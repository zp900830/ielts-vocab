// 2026-09-30 登录门禁回归：未登录不读文章/看数据/进单词本；
// 随身听免登录可用，但不许切今日任务。
// 注意：故意直连官方 test，不吃 fixtures 的 __e2eAuthBypass 后门。
import { test, expect } from '@playwright/test';

const rootUrl = process.env.E2E_ROOT_URL || '';

const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/app/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}
declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  isLoggedIn(): boolean;
  listenSetSrc(s: string): string;
  listenToggle(): void;
  openPanel(): void;
  setMinutes(m: number): void;
  planConfig(): { minutes: number } | null;
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: unknown[];

async function freshPlan(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
}

test('未登录点文章卡：不进任务模式，弹统一登录弹窗', async ({ page }) => {
  await freshPlan(page);
  expect(await page.evaluate(() => TASK.isLoggedIn()), '本文件必须保持未登录态').toBe(false);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body'), '未登录不许进任务模式').not.toHaveClass(/task-mode/);
  await expect(page.locator('#loginModal'), '应弹出统一登录弹窗').toBeVisible();
  await expect(page.locator('#loginWhy'), '弹窗里要写清为什么被拦').toContainText('登录后才能');
});

test('未登录直进数据/单词本：锁定页 + 去登录按钮', async ({ page }) => {
  await freshPlan(page);
  for (const route of ['stats', 'words']) {
    await page.goto(`${rootUrl}/app/index.html#/${route}`);
    await expect(page.locator('.ls-card'), `${route} 应显示锁定页`).toBeVisible({ timeout: 15000 });
    await expect(page.locator('#lockLoginBtn'), '有去登录按钮').toBeVisible();
  }
  await page.locator('#lockLoginBtn').click();
  await expect(page.locator('#loginModal'), '去登录打开统一登录弹窗').toBeVisible();
});

test('未登录：设置学习时间（建计划/改分钟数）都要登录', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); });
  expect(await page.evaluate(() => TASK.isLoggedIn()), '本文件必须保持未登录态').toBe(false);
  // openPanel 没计划 = 设置屏入口（横幅/我的/任务条空状态全走它）→ 应被拦
  await page.evaluate(() => TASK.openPanel());
  await expect(page.locator('#todayPanel'), '设置屏不许开').toBeHidden();
  await expect(page.locator('#loginModal'), '弹统一登录弹窗').toBeVisible();
  await expect(page.locator('#loginWhy'), '弹窗里要写清为什么被拦').toContainText('要先登录');
  // 绕过 UI 直接建计划（API 级，门禁只拦界面入口），再造一份"有计划的未登录"样本
  await page.evaluate(() => { TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  expect(await page.evaluate(() => TASK.isLoggedIn()), '刷新后仍未登录').toBe(false);
  const before = await page.evaluate(() => TASK.planConfig()!.minutes);
  await page.evaluate(() => TASK.setMinutes(90));
  const after = await page.evaluate(() => TASK.planConfig()!.minutes);
  expect(after, '未登录不许改分钟数').toBe(before);
});

test('未登录随身听可用，但今日任务切不过去', async ({ page }) => {
  await freshPlan(page);
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await expect(page.locator('.ls-card')).toBeVisible();
  await page.evaluate(() => TASK.listenToggle());
  await expect.poll(async () => page.evaluate(() =>
    (window as unknown as { __cbs: unknown[] }).__cbs.length)).toBeGreaterThan(0);
  expect(await page.evaluate(() => TASK.listenSetSrc('today')), '未登录切不到今日任务').toBe('all');
});
