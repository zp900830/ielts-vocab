// 3.0 M2：学习数据页（PRD §5）。服务器归 global-setup.ts 起停（仓库根 8932）；
// /app/ 在仓库根，所以和 shell.spec.ts / home.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  seedDailyForTest(back: number): void;
  seedArticleForTest(a: number, o: { quizOk?: number; quizNo?: number; reps?: number; pass2?: boolean }): void;
  state(): {
    daily: Record<string, { sentDone?: number; quizDone?: number; minutes?: number }>;
    words: Record<string, unknown>;
    sents: Record<number, { lastReadAt: number }>;
  };
  todayStats(): { streak: number; graduated: number; targetWords: number };
  countStages(): { graduated: number; leech: number };
};
declare const ShadowPlan: {
  articleScope(sections: unknown, a: number): Set<number>;
  newWord(): Record<string, unknown>;
  dayKey(ts: number, b: number): string;
  DAY_MS: number;
};
declare const SECTIONS: unknown[];
declare const APP3: {
  articleStat(a: number): { progress: number; stage: string; ever: number; total: number };
  route(): void;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 6 篇小壳（与 home.spec.ts 同款）：第 0 篇 24 句、30 个不同目标词，其余 2 句。
   既让数据页拿到 6 篇，又不再多渲一页 1833 句 + 3242 词（并行时那份额外负载会压出 shadow 偶发红）。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number, extra: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) =>
      `Sentence ${i} about [[w${i}:w${i}]].${i < extra ? ` Plus [[x${i}:x${i}]].` : ''}`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 24 : 2, i === 0 ? 6 : 0))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

test.describe('3.0 学习数据页（M2，PRD §5）', () => {
  test('未开始：一句话 + 一个按钮，点了打开「我的」浮窗，不内嵌计划表单', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await page.reload();

    const start = page.locator('.st-empty-start');
    await expect(start).toBeVisible();
    await expect(start.locator('h1')).toHaveText('开始你的学习计划');
    expect((await start.locator('p').innerText()).length, '未开始态要有一句说明').toBeGreaterThan(0);
    // 不内嵌计划表单：数据页里不得出现 renderSetup 的 .ps-start
    expect(await page.locator('#appView .ps-start').count(), '未开始态不得内嵌计划表单').toBe(0);

    // 按钮 → 打开「我的」浮窗（不是跳设置屏）
    await page.locator('.st-open-me').click();
    await expect(page.locator('#mePop')).toBeVisible();
    await expect(page.locator('#mePop [data-me-theme]'), '「我的」浮窗真的开了').toBeVisible();
    expect(await page.locator('#appView .ps-start').count(), '点按钮也不许内嵌表单').toBe(0);
  });

  test('进行中：学习总览 5 个数与 state 同源', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));  // 今天读 5 句
      TASK.seedDailyForTest(1);                                   // 昨天：sentDone 5、minutes 15（必须在 readDone 之后）
    });
    await page.reload();

    await expect(page.locator('.st-block[data-block="overview"]')).toBeVisible();
    const expected = await page.evaluate(() => {
      const st = TASK.state();
      const daily = st.daily || {};
      const keys = Object.keys(daily);
      let minutes = 0, acts = 0;
      keys.forEach((k) => { const d = daily[k] || {}; minutes += d.minutes || 0; acts += (d.sentDone || 0) + (d.quizDone || 0); });
      let arts = 0;
      for (let a = 0; a < SECTIONS.length; a++) { const s = APP3.articleStat(a).stage; if (s === 'done' || s === 'pro') arts++; }
      return { days: keys.length, minutes, streak: TASK.todayStats().streak, arts, acts };
    });
    const num = (k: string) => page.locator(`.st-num[data-k="${k}"] b`).innerText().then((t) => Number(t.replace('%', '')));
    expect(await num('days')).toBe(expected.days);
    expect(await num('minutes')).toBe(expected.minutes);
    expect(await num('streak')).toBe(expected.streak);
    expect(await num('arts')).toBe(expected.arts);
    expect(await num('acts')).toBe(expected.acts);
    expect(expected.days, '夹具要真造出日账，否则这条什么都没测').toBeGreaterThanOrEqual(2);
    expect(expected.acts, '夹具要真造出学习次数').toBeGreaterThan(0);
  });

  test('文章学习：6 篇小卡数字与首页卡片同源；点小卡 → 回首页并高亮', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 20).forEach((i) => TASK.readDone(i));
    });
    await page.reload();

    await expect(page.locator('.st-art')).toHaveCount(6);
    // 与 APP3.articleStat 同源（真断言，不写死字面量）
    const stats = await page.evaluate(() => Array.from({ length: SECTIONS.length }, (_, a) => APP3.articleStat(a).progress));
    for (let a = 0; a < 6; a++) {
      await expect(page.locator(`.st-art[data-a="${a}"] .sa-pct`), `第 ${a} 篇小卡百分比`).toHaveText(stats[a] + '%');
    }
    // 首页卡片同一个数：切到首页比对
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await expect(page.locator('.art-card[data-a="0"] .a-pct')).toHaveText(stats[0] + '%');

    // 点第 0 篇小卡 → 回首页且该卡片被高亮
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.locator('.st-art[data-a="0"]').click();
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('.art-card[data-a="0"]')).toHaveClass(/hl/);
  });

  test('单词掌握：4 个数与 countStages/state 同源', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 8).forEach((i) => TASK.readDone(i));
      TASK.seedArticleForTest(0, { quizOk: 2 });     // 造点词状态，别让 4 个数全 0
    });
    await page.reload();

    const expected = await page.evaluate(() => {
      const c = TASK.countStages();
      const st = TASK.state();
      const learned = Object.keys(st.words || {}).length;
      const total = TASK.todayStats().targetWords;
      return { learned, grad: c.graduated, leech: c.leech, rate: total ? Math.round((c.graduated / total) * 100) : 0 };
    });
    const num = (k: string) => page.locator(`.st-num[data-k="${k}"] b`).innerText().then((t) => Number(t.replace('%', '')));
    expect(await num('learned')).toBe(expected.learned);
    expect(await num('grad')).toBe(expected.grad);
    expect(await num('leech')).toBe(expected.leech);
    expect(await num('rate')).toBe(expected.rate);
    expect(expected.learned, '夹具要真造出词状态').toBeGreaterThan(0);
  });
});
