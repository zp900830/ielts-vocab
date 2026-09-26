// 2026-09-24 用户要求：三站图标统一到主站那套（remixicon@4.5.0 + fastly.jsdelivr.net，含 woff2 preload），
// 并给 /app/ 的左侧导航补上 PRD §2.2 的五颗图标。
// 这条锁做两件事：① 源码级 —— 三站都不许再引用旧版 4.2.0 图标源；② 实页级 —— /app/ 五个导航项
// 各有一颗 <i class="ri-…">，且该名字在「已加载的 4.5.0 字体样式表」里真的有字形（::before content 非 none）。
// 名字不存在时 ::before 没有 content 规则 → 量出来是 none，正是要抓的「空白/豆腐块」。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';
declare const CLOUD: { _userMail: string };
declare const APP3: { updateMeCard(): void };

const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

const NAV_ICONS = ['ri-home-5-line', 'ri-headphone-line', 'ri-book-2-line', 'ri-bar-chart-2-line'];
const NAV_ICONS_FILL = ['ri-home-5-fill', 'ri-headphone-fill', 'ri-book-2-fill', 'ri-bar-chart-2-fill'];

test.describe('3.0 图标源统一（remixicon 4.5.0）', () => {
  test('源码级：三站图标样式表都指向 4.5.0，不再引用 4.2.0', () => {
    const root = path.resolve(process.cwd(), '..');
    for (const f of ['index.html', 'shadow/index.html', 'app/index.html']) {
      const src = fs.readFileSync(path.join(root, f), 'utf8');
      expect(src, `${f} 必须引用 remixicon@4.5.0`).toContain('remixicon@4.5.0');
      expect(src, `${f} 不许再引用 4.2.0`).not.toContain('remixicon/4.2.0');
      expect(src, `${f} 不许再引用 cdnjs 的图标字体`).not.toContain('cdnjs.cloudflare.com/ajax/libs/remixicon');
    }
  });

  test('/app/ 导航四颗 + 已登录头像在 4.5.0 字体里真的渲得出', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);

    // 字体样式表版本
    const href = await page.locator('link[rel="stylesheet"][href*="remixicon"]').getAttribute('href');
    expect(href, '图标样式表版本').toContain('remixicon@4.5.0');

    // 四个导航项各一对图标（线性 + 面性，2026-09-26 用户：默认线性、选中面性）
    const items = page.locator('.sidenav .nav-item');
    await expect(items).toHaveCount(4);
    for (let i = 0; i < NAV_ICONS.length; i++) {
      const item = items.nth(i);
      await expect(item.locator(`i.${NAV_ICONS[i]}`), `第 ${i + 1} 个导航项的线性图标`).toHaveCount(1);
      await expect(item.locator(`i.${NAV_ICONS_FILL[i]}`), `第 ${i + 1} 个导航项的面性图标`).toHaveCount(1);
    }
    // #/home 下：首页项是 .on → 显示面性、藏线性；其余项相反
    const vis = await page.evaluate(() => Array.from(document.querySelectorAll('.sidenav .nav-item')).map((el) => ({
      on: el.classList.contains('on'),
      line: getComputedStyle(el.querySelector('.i-line')).display,
      fill: getComputedStyle(el.querySelector('.i-fill')).display,
    })));
    for (const v of vis) {
      if (v.on) { expect(v.fill, '选中项显示面性').not.toBe('none'); expect(v.line, '选中项藏线性').toBe('none'); }
      else { expect(v.line, '未选中显示线性').not.toBe('none'); expect(v.fill, '未选中藏面性').toBe('none'); }
    }
    expect(vis.filter((v) => v.on).length, '恰好一项选中').toBe(1);
    // 未登录「我的」显示「登录」按钮（无头像）；已登录才显示默认头像图标
    await expect(page.locator('.sidenav .me-card .me-login'), '未登录显示登录按钮').toHaveText('登录');
    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); });
    await expect(page.locator('.sidenav .me-card .me-avatar i'), '已登录默认头像').toHaveClass(/\bri-user-3-fill\b/);

    // 量字形：等 4.5.0 的 CSS 落地后，每个 ::before 必须真有 content（名字不存在 = none）。
    // M6 抖动排查：这条依赖 CDN（fastly.jsdelivr.net）的 CSS/woff2，全量并行 + 网络抖动时
    // 15s 偶发不够（实测 1/6 视红）。条件等待本身没问题，只是给足上限；源级锁在第一条，
    // 就算 CDN 一时挂掉也不会让「版本引用」这件事失守。
    await page.waitForFunction(() => {
      const els = document.querySelectorAll('.sidenav .nav-item i, .sidenav .me-card .me-avatar i');
      /* 4 个导航项 × 2（线性 + 面性）+ 1 个头像 = 9（2026-09-26 成对图标） */
      if (els.length !== 9) return false;
      return Array.from(els).every((el) => {
        const c = getComputedStyle(el, '::before').content;
        return !!c && c !== 'none' && c !== 'normal';
      });
    }, null, { timeout: 30000 });
    const contents = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sidenav .nav-item i, .sidenav .me-card .me-avatar i')).map((el) => getComputedStyle(el, '::before').content));
    for (const c of contents) expect(c, `::before content 全量：${JSON.stringify(contents)}`).not.toMatch(/^(none|normal)$/);

    // 字体文件本身加载成功（woff2 可达）
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('16px remixicon')), 'remixicon 字体未加载').toBe(true);
  });
});
