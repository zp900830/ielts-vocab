// 2026-09-24 用户改口径：「我的」从一级导航拿出来，改成左下角常驻用户卡 + 向上弹出的浮窗（PRD §2.2 / §8.1）。
// 2026-10-08 用户再改口径：PC 侧栏那一行按登录态报账（未登录 / 账号名），浮窗只属于 PC；
//   手机端两种登录态都写「我的」，点它切到内容相同的一级页面 #/me（不再是浮窗/抽屉）。
// 这条锁三件事：① 点左下角卡片 → 浮窗出现且含主题开关；② 切主题 → body.dark 真的变；
// ③ 未登录时头像位是「未」字（不引新图）。另锁手机端用户卡是 TabBar 的第 5 格、点得到、进页面。
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

test.describe('3.0 用户卡 + 「我的」浮窗（PRD §2.2 / §8.1，PC 宿主）', () => {
  test('未登录显示图标+「未登录」；点它开统一登录弹窗；弹窗可进设置；已登录显示账号名', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);

    // ① 未登录（2026-10-08 用户改口径）：PC 侧栏这一行本身就报登录状态 —— 图标 + 「未登录」
    await expect(page.locator('#meCard .me-tab-label'), '未登录显示「未登录」标签').toHaveText('未登录');
    await expect(page.locator('#meCard .i-line'), '未登录显示用户图标').toHaveClass(/\bri-user-smile-line\b/);
    expect(await page.locator('#meCard .me-login').count(), '不再有裸登录文字').toBe(0);
    expect(await page.locator('#meCard .me-avatar').count(), '未登录不显示头像').toBe(0);
    await expect(page.locator('#mePop'), '浮窗初始是关的').toBeHidden();
    // ③ 口音/音色只活在「我的」里：浮窗没开时，页面上不该有它们
    expect(await page.locator('#btnAccent').count(), '口音只在我的里').toBe(0);
    expect(await page.locator('#voiceBtn').count(), '音色只在我的里').toBe(0);

    // 点它 → 开统一登录弹窗（不是浮窗）
    await page.locator('#meCard').click();
    const modal = page.locator('#loginModal');
    await expect(modal, '点卡片开登录弹窗').toBeVisible();
    await expect(page.locator('#mePop'), '浮窗保持关闭').toBeHidden();
    await expect(modal.locator('#loginEmail'), '弹窗有邮箱框').toBeVisible();
    await expect(modal.locator('#loginPass'), '弹窗有密码框').toBeVisible();
    await expect(modal.locator('.login-go'), '弹窗有登录按钮').toHaveText('登录');
    await expect(modal.locator('.login-reg'), '弹窗有注册按钮').toHaveText('注册');

    // 弹窗里「先去设置」→ 关弹窗、开浮窗（未登录也要调得了主题/口音/音色）
    await modal.locator('[data-login-settings]').click();
    await expect(modal, '弹窗关闭').toBeHidden();
    const pop = page.locator('#mePop');
    await expect(pop, '浮窗打开').toBeVisible();
    await expect(pop.locator('.mp-avatar'), '浮窗里默认头像是「未」字').toHaveText('未');
    expect(await pop.locator('.mp-avatar i').count(), '头像位不再塞图标（改首字母文字）').toBe(0);
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
    await expect(pop.locator('[data-me-logout],[data-me-login-btn]')).toBeVisible();

    // 点浮窗外收掉
    await page.locator('body').click({ position: { x: 4, y: 4 } });
    await expect(pop).toBeHidden();

    // 已登录（2026-10-08 用户改口径）：这一行报账 —— 图标不变，文字换成账号名；
    // 账号信息同时留在浮窗头部（mp-head），tab 里不放头像方块。
    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); });
    await expect(page.locator('#meCard .i-line'), '已登录仍是用户图标（同 tab 风格）').toHaveClass(/\bri-user-smile-line\b/);
    await expect(page.locator('#meCard .me-tab-label'), '已登录标签换成账号名').toHaveText('alice');
    expect(await page.locator('#meCard .me-avatar').count(), '已登录不再显示头像方块').toBe(0);
    expect(await page.locator('#meCard .me-login').count(), '已登录不再显示登录按钮').toBe(0);
  });

  test('手机端：用户卡是 TabBar 第 5 格（图标+「我的」），点它进「我的」一级页面', async ({ page }) => {
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
    // 第 5 格两种登录态都写「我的」（风格与其他 tab 一致，账号只出现在页面里）
    await expect(card.locator('.me-tab-label'), '标签是「我的」').toHaveText('我的');
    await expect(card.locator('.i-line'), '图标与其他 tab 同风格').toHaveClass(/\bri-user-smile-line\b/);

    // 点它 = 切页面，不开浮窗、也不拦一个登录弹窗（未登录照样进「我的」页）
    await card.click();
    expect(await page.evaluate(() => location.hash), '点它切到 #/me').toBe('#/me');
    await expect(page.locator('#loginModal'), '不在门口塞登录弹窗').toBeHidden();
    await expect(page.locator('#mePop'), '浮窗在手机上收起空壳').toBeHidden();
    const mePage = page.locator('#appView .me-page');
    await expect(mePage, '「我的」一级页面出现').toBeVisible();
    await expect(card, '用户卡是选中态').toHaveClass(/\bon\b/);
    // 未登录进页面：头部是「未」字头像 + 未登录，页内给一颗「去登录」大按钮
    await expect(mePage.locator('.mp-avatar'), '未登录头像位是「未」').toHaveText('未');
    await expect(mePage.locator('[data-me-login-btn]'), '页内有去登录入口').toBeVisible();
    // 未登录也要调得了主题
    await expect(mePage.locator('[data-me-theme]'), '页面里有主题开关').toBeVisible();
  });
});
