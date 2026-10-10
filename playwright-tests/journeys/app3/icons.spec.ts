// 2026-09-24 用户要求：三站图标统一到同一套图标源（remixicon 4.5.0，含 woff2 preload），
// 并给主站的左侧导航补上 PRD §2.2 的五颗图标。
// 2026-10-10：图标源从 fastly.jsdelivr.net 改为本地自托管（vendor/remixicon/，同为 4.5.0）——
// jsdelivr 在国内常不可达，本机实测三个外链各卡满 30s 才超时、图标字形全塌。
// 这条锁做两件事：① 源码级 —— 只许引用本地 vendor 那份，页面里不许再出现任何远端图标源，
// 且本地副本必须自称 4.5.0、woff2 实体必须在（缺了就是线上静默空白，页面一声不吭）；
// ② 实页级 —— 主站五个导航项各有一颗 <i class="ri-…">，且该名字在「已加载的 4.5.0 字体样式表」
// 里真的有字形（::before content 非 none）。名字不存在时 ::before 没有 content 规则 → 量出来是 none，
// 正是要抓的「空白/豆腐块」。服务器归 global-setup.ts 起停（仓库根 8932）；
// 站点在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import fs from 'node:fs';
import path from 'node:path';
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';
declare const CLOUD: { _userMail: string };
declare const APP3: { updateMeCard(): void };

const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

const NAV_ICONS = ['ri-home-5-line', 'ri-headphone-line', 'ri-book-2-line', 'ri-bar-chart-2-line'];
const NAV_ICONS_FILL = ['ri-home-5-fill', 'ri-headphone-fill', 'ri-book-2-fill', 'ri-bar-chart-2-fill'];

test.describe('3.0 图标源（remixicon 4.5.0 · 本地自托管）', () => {
  test('源码级：只引用本地 vendor 那份，页面里没有远端图标源', () => {
    const root = path.resolve(process.cwd(), '..');
    for (const f of ['index.html']) {
      const src = fs.readFileSync(path.join(root, f), 'utf8');
      expect(src, `${f} 必须引用本地图标样式表`).toContain('vendor/remixicon/remixicon.css');
      expect(src, `${f} 必须预加载本地 woff2（否则首屏图标晚一拍）`).toContain('vendor/remixicon/remixicon.woff2');
      /* 用「远端 URL」而不是「版本串」做禁引：历史注释里会写 remixicon@4.5.0 这种字样，
         拿版本串会假绿/假红；这条正则只认真正的远端引用（jsdelivr / cdnjs / unpkg / 自建都一样抓）。 */
      expect(src, `${f} 不许再引用任何远端图标源`).not.toMatch(/https?:\/\/[^"'\s)]*remixicon/i);
    }
    // 本地副本自身也要点名：版本头 + woff2 实体。CSS 在而 woff2 不在 = 线上图标全塌且不报错。
    const vend = path.join(root, 'vendor/remixicon');
    expect(fs.readFileSync(path.join(vend, 'remixicon.css'), 'utf8'), '自托管 CSS 的版本头').toContain('Remix Icon v4.5.0');
    expect(fs.existsSync(path.join(vend, 'remixicon.woff2')), 'woff2 实体缺失 —— 图标会静默全塌').toBe(true);
  });

  test('主站导航四颗 + 已登录头像在 4.5.0 字体里真的渲得出', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/index.html#/home`);

    // 字体样式表：本地 vendor 那份（2026-10-10 起自托管，不再走 CDN）
    const href = await page.locator('link[rel="stylesheet"][href*="remixicon"]').getAttribute('href');
    expect(href, '图标样式表应指向本地 vendor').toContain('vendor/remixicon/remixicon.css');

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
    // 「我的」那一行：图标前后都是同一对用户图标（线性+面性，靠选中态换），文字才报登录状态
    // （2026-10-08 PC 改口径：未登录写「未登录」，登录后写账号名；手机端才统一写「我的」）
    await expect(page.locator('.sidenav .me-card .me-tab-label'), '未登录显示「未登录」').toHaveText('未登录');
    await expect(page.locator('.sidenav .me-card .i-line'), '未登录显示线性用户图标').toHaveClass(/\bri-user-smile-line\b/);
    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); });
    await expect(page.locator('.sidenav .me-card .me-tab-label'), '已登录显示账号名').toHaveText('alice');
    await expect(page.locator('.sidenav .me-card .i-line'), '已登录仍是线性用户图标').toHaveClass(/\bri-user-smile-line\b/);
    await expect(page.locator('.sidenav .me-card .i-fill'), '已登录仍带面性用户图标（与其他 tab 同结构）').toHaveClass(/\bri-user-smile-fill\b/);

    // 量字形：等 4.5.0 的 CSS 落地后，每个 ::before 必须真有 content（名字不存在 = none）。
    // 2026-10-10 起 CSS/woff2 都在本地（自托管），这条不再受网络抖动影响（原先依赖 CDN，
    // 全量并行时 15s 偶发不够、实测 1/6 视红）。上限维持 30s：留着是为了真加载不出来时
    // 给出清晰红灯，不是缩短等待。源级锁在同文件第一条。
    await page.waitForFunction(() => {
      const els = document.querySelectorAll('.sidenav .nav-item i, .sidenav .me-card i');
      /* 4 个导航项 × 2 + 「我的」× 2（线性 + 面性）= 10（2026-10-06 成对图标） */
      if (els.length !== 10) return false;
      return Array.from(els).every((el) => {
        const c = getComputedStyle(el, '::before').content;
        return !!c && c !== 'none' && c !== 'normal';
      });
    }, null, { timeout: 30000 });
    const contents = await page.evaluate(() =>
      Array.from(document.querySelectorAll('.sidenav .nav-item i, .sidenav .me-card i')).map((el) => getComputedStyle(el, '::before').content));
    for (const c of contents) expect(c, `::before content 全量：${JSON.stringify(contents)}`).not.toMatch(/^(none|normal)$/);

    // 字体文件本身加载成功（woff2 可达）
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('16px remixicon')), 'remixicon 字体未加载').toBe(true);
  });
});
