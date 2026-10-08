// 2026-10-08 用户：「我的」按宿主分叉 —— PC 端仍是浮窗，移动端改成与浮窗内容相同的一级页面（#/me）；
// 同时 PC 侧栏那一行按登录态显示「未登录 / 账号名」，移动端底栏两种登录态都保持「我的」。
// 账号行的观感借鉴用户给的参考截图：圆形首字母头像（未登录是「未」），不再是通用用户图标。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { stubCloudAccount } from '../../utils/cloud-stub';
import { setMin } from '../../utils/min-slider';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  planConfig(): { minutes: number } | null;
  hasPlan: boolean;
};
declare const CLOUD: { _userMail: string };

const rootUrl = process.env.E2E_ROOT_URL || '';
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

/* 六篇小壳（篇 0 = 6 句，其余各 1 句）：够开计划、够让「每天分钟数」那一行出现。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 12; i++) vocab[`w${i}`] = { m: `w${i}` };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 6 : 1))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });

/** 起一台指定视口的 /app/ 首页；withPlan 才建计划（计划相关那一行要有计划才出现）。 */
async function boot(page: import('@playwright/test').Page, vp: { width: number; height: number }, withPlan = true) {
  await page.setViewportSize(vp);
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitTask(page);
  if (withPlan) await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
}
const hash = (page: import('@playwright/test').Page) => page.evaluate(() => location.hash);

test.describe('「我的」双宿主 · 移动端一级页面 / PC 浮窗', () => {
  test('移动端点底栏那一格 → 进 #/me 一级页面，不弹浮层，底栏点亮成当前页', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    expect(await hash(page), '点它 = 切路由，不是弹层').toBe('#/me');
    const pg = page.locator('#appView .me-page');
    await expect(pg, '页面宿主在 #appView 里').toBeVisible();
    await expect(pg.locator('.pg-title'), '一级页面有自己的标题').toHaveText('我的');
    await expect(page.locator('#mePop'), '移动端不再用浮层').toBeHidden();
    expect(await page.locator('#mePop').evaluate((el) => el.innerHTML.trim()), '浮窗在移动端保持空壳（不撞 id）').toBe('');
    await expect(page.locator('#meCard'), '底栏那一格是选中态').toHaveClass(/\bon\b/);
    expect(await page.locator('#meCard').getAttribute('aria-current'), 'tab 语义而不是弹窗').toBe('page');
  });

  test('PC 点侧栏那一行 → 仍是浮窗，路由一步都不动', async ({ page }) => {
    await boot(page, DESKTOP);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    await expect(page.locator('#mePop'), 'PC 还是向上弹的浮窗').toBeVisible();
    expect(await hash(page), 'PC 点它不跳路由').toBe('#/home');
    expect(await page.locator('#appView .me-page').count(), 'PC 不渲页面宿主').toBe(0);
    expect(await page.locator('#meCard').getAttribute('aria-current'), 'PC 不是 tab 语义').toBe(null);
  });

  test('PC 侧栏那一行跟着登录态：未登录写「未登录」，登录后写账号名', async ({ page }) => {
    await boot(page, DESKTOP);
    await expect(page.locator('#meCard .me-tab-label'), '未登录：状态就是这一行的文案').toHaveText('未登录');
    await stubCloudAccount(page, 'demo@example.com');
    await expect(page.locator('#meCard .me-tab-label'), '已登录：账号名（邮箱 @ 前缀）').toHaveText('demo');
    await expect(page.locator('#meCard .i-line'), '图标仍是那颗用户图标（不换皮）').toHaveClass(/\bri-user-smile-line\b/);
  });

  test('移动端底栏两种登录态都写「我的」，不把账号塞进 tab', async ({ page }) => {
    await boot(page, MOBILE);
    await expect(page.locator('#meCard .me-tab-label'), '未登录也是「我的」').toHaveText('我的');
    await stubCloudAccount(page, 'demo@example.com');
    await expect(page.locator('#meCard .me-tab-label'), '登录后还是「我的」（账号只出现在页面里）').toHaveText('我的');
  });

  test('未登录也进得去页面：页内给「去登录」，改主题不用先登录', async ({ page }) => {
    await boot(page, MOBILE, false);
    await page.locator('#meCard').click();
    expect(await hash(page)).toBe('#/me');
    const pg = page.locator('#appView .me-page');
    await expect(pg.locator('.mp-login-btn'), '未登录：页内一颗去登录').toBeVisible();
    await expect(page.locator('#loginModal'), '不再先拦一道登录弹窗').toBeHidden();
    const wasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    await pg.locator('[data-me-theme]').click();
    expect(await page.evaluate(() => document.body.classList.contains('dark')), '未登录也调得了主题').toBe(!wasDark);
    await expect(pg, '切主题不该把页面换成登录弹窗').toBeVisible();
  });

  test('页面与浮窗内容同一份：关键区块一个不少', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    const pg = page.locator('#appView .me-page');
    for (const sel of ['.mp-head', '.mp-cta', '.mp-card', '.mp-nums', '#btnAccent', '#voiceBtn',
      '[data-me-theme]', '.min-range', '#mpEta', '[data-me-reset-plan]', '[data-me-export]', '[data-me-import]']) {
      await expect(pg.locator(sel).first(), `${sel} 在页面里` ).toBeVisible();
    }
    await expect(pg.locator('.mp-name'), '账号名写在页内头部').toHaveText('demo');
  });

  test('账号行按参考图：圆形首字母头像，未登录显示「未」', async ({ page }) => {
    await boot(page, MOBILE);
    await page.locator('#meCard').click();
    const av = page.locator('#appView .me-page .mp-avatar');
    await expect(av, '未登录：头像里是「未」').toHaveText('未');
    expect(await av.locator('i').count(), '不再放通用用户图标').toBe(0);
    await stubCloudAccount(page, 'demo@example.com');
    await page.evaluate(() => { location.hash = '#/home'; });
    await page.locator('#meCard').click();
    await expect(page.locator('#appView .me-page .mp-avatar'), '已登录：首字母大写').toHaveText('D');
  });

  test('浏览器后退离开页面，回到底栏其它 tab 正常', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    expect(await hash(page)).toBe('#/me');
    await page.goBack();
    expect(await hash(page), '后退 = 回首页').toBe('#/home');
    expect(await page.locator('#appView .me-page').count(), '页面宿主收掉').toBe(0);
    await expect(page.locator('#meCard'), '底栏还在').toBeVisible();
  });

  test('页面里拖滑块松手就落账（与浮窗共用同一份监听，不抄第二套）', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    const range = page.locator('#appView .me-page .min-range');
    await expect(range).toHaveValue('15');
    await setMin(range, 45);
    expect((await page.evaluate(() => TASK.planConfig()))!.minutes, '松手即改计划').toBe(45);
    await page.reload();
    await waitTask(page);
    expect((await page.evaluate(() => TASK.planConfig()))!.minutes, '落账后重开还在').toBe(45);
  });
});
