// 2026-09-24 用户改口径：「我的」从一级导航拿出来，改成左下角常驻用户卡 + 向上弹出的浮窗（PRD §2.2 / §8.1）。
// 这条锁三件事：① 点左下角卡片 → 浮窗出现且含主题开关；② 切主题 → body.dark 真的变；
// ③ 未登录时头像有默认图（Remix Icon，不引新图）。另锁手机端用户卡是 TabBar 的第 5 格、点得到。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL，不走 baseURL。
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

test.describe('3.0 「我的」一行 + 浮窗（PRD §2.2 / §8.1）', () => {
  test('未登录显示「登录」按钮；点它弹浮窗（含主题/口音/音色）；已登录显示头像+账号', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);

    // ① 未登录：「我的」那一行是一颗「登录」按钮（不是头像）
    await expect(page.locator('#meCard .me-login'), '未登录显示登录按钮').toHaveText('登录');
    expect(await page.locator('#meCard .me-avatar').count(), '未登录不显示头像').toBe(0);
    await expect(page.locator('#mePop'), '浮窗初始是关的').toBeHidden();
    // ③ 口音/音色只活在「我的」里：浮窗没开时，页面上不该有它们
    expect(await page.locator('#btnAccent').count(), '口音只在我的里').toBe(0);
    expect(await page.locator('#voiceBtn').count(), '音色只在我的里').toBe(0);

    // 点它 → 向上弹浮窗
    await page.locator('#meCard').click();
    const pop = page.locator('#mePop');
    await expect(pop).toBeVisible();
    await expect(pop.locator('.mp-avatar i'), '浮窗里是默认头像').toHaveClass(/\bri-user-3-fill\b/);
    await expect(pop.locator('[data-me-theme]'), '浮窗里必须有主题开关').toBeVisible();
    // ③ 口音 + 音色都只在「我的」里
    await expect(pop.locator('#btnAccent'), '口音切换在浮窗里').toBeVisible();
    await expect(pop.locator('#voiceBtn'), '音色选择器在浮窗里').toBeVisible();

    // 浮窗开在「我的」那一行正上方（向上弹）
    const geo = await page.evaluate(() => {
      const c = document.getElementById('meCard')!.getBoundingClientRect();
      const p = document.getElementById('mePop')!.getBoundingClientRect();
      return { cardTop: c.top, popBottom: p.bottom };
    });
    expect(geo.popBottom, '浮窗底边应贴着「我的」上沿（向上弹）').toBeLessThanOrEqual(geo.cardTop + 1);

    // 切主题 → body.dark 真的翻转
    const wasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    await pop.locator('[data-me-theme]').click();
    expect(await page.evaluate(() => document.body.classList.contains('dark')), '切主题后 body.dark 必须翻转').toBe(!wasDark);

    // 浮窗含 PRD §8.1 的关键区块：学习摘要 / 数据管理 / 账号
    await expect(pop.locator('.mp-nums')).toBeVisible();
    await expect(pop.locator('[data-me-export]')).toBeVisible();
    await expect(pop.locator('[data-me-import]')).toBeVisible();
    await expect(pop.locator('[data-me-logout],[data-me-login]')).toBeVisible();

    // 点浮窗外收掉
    await page.locator('body').click({ position: { x: 4, y: 4 } });
    await expect(pop).toBeHidden();

    // 已登录：「我的」那一行变成头像 + 账号（昵称/邮箱前缀）
    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); });
    await expect(page.locator('#meCard .me-avatar i'), '已登录显示默认头像').toHaveClass(/\bri-user-3-fill\b/);
    await expect(page.locator('#meCard .me-name'), '已登录显示账号').toHaveText('alice');
    expect(await page.locator('#meCard .me-login').count(), '已登录不再显示登录按钮').toBe(0);
  });

  test('手机端：用户卡是 TabBar 第 5 格，点它弹浮窗（不塞进浮窗里点不到）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);

    const card = page.locator('#meCard');
    await expect(card).toBeVisible();
    const geo = await card.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return { bottom: r.bottom, vh: window.innerHeight, count: document.querySelectorAll('.sidenav > *').length };
    });
    expect(geo.bottom, '手机端用户卡贴在底部 TabBar').toBeGreaterThan(geo.vh - 80);

    await card.click();
    await expect(page.locator('#mePop')).toBeVisible();
    await expect(page.locator('#mePop [data-me-theme]')).toBeVisible();
  });
});
