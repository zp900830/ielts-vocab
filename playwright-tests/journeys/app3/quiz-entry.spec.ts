// 2026-09-24 用户实测：一篇 339 句、当天额度 180 句 —— 读满 180/180 后，本篇队列还剩一大截，
// 于是「① 走完 → 遍间小结 → 开始答题」这条 ② 入口永远不出现（旧判据是「本篇队列走完」），
// 任务条主按钮还一直写「下一句」把人往多读上引，首页卡片也没有任何入口。核心学习闭环断在这里。
//
// 本轮把 ② 的触发判据改成「今天该读的句都读完了」（todayQuotaDone：当天快照读满即算），
// 与「文章读没读完」解耦；M1 那条「① 走完整篇 → 小结 → 挖空」的既有路径必须同时保留。
//
// 复现手法：把今天的句数承诺（ROOT2.planned[day]）钉到一个**比本篇队列小**的值，
// 再真读那么多句 —— 就是用户「额度 < 本篇句数」的局面，不需要伪造事件账。
// 反向验证：把 app/ 的改动 stash 掉后，本文件前面 4 条必须红。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  refreshNext(): void;
  taskSentenceFinished(gi: number): void;
  next(): void;
  pass(): number;
  queue: { i: number }[];
  todayProgress(): { done: number; planned: number; left: number };
  state(): { daily: Record<string, { sentDone?: number }> };
};
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number>; dayKey(ts: number, h: number): string };
declare const SECTIONS: { title: string; paragraphs: string[][] }[];
declare const APP3: {
  route(): void;
  articleStat(a: number): { ever: number; total: number; stage: string };
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* ② 要出真四选一（引擎凑满 4 个候选才出题）：四个词、义项互不重叠。与 task.spec.ts 的 SIXQ 同款。
   第 0 篇 8 句但只有 4 个不同词（引擎按词去重）→ 本篇队列 4 句。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + QSENSES[i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = QWORDS[(ai + i) % QWORDS.length];
      return `Sentence ${i} about [[${w}:${w}]].`;
    })],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) => r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try { return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0 && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily); } catch (e) { return false; }
  });
}
async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
}
/* 把「今天的句数承诺」钉到一个比本篇队列小的值 —— 复现用户「额度 180 < 本篇 339」的局面。 */
async function pinQuota(page: import('@playwright/test').Page, q: number) {
  await page.evaluate((qq) => {
    const raw = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
    const b = (raw.plan && raw.plan.boundaryHour != null) ? raw.plan.boundaryHour : 4;
    const day = ShadowPlan.dayKey(Date.now(), b);
    raw.planned = raw.planned || {};
    raw.planned[day] = qq;
    localStorage.setItem('ielts.shadow.v2', JSON.stringify(raw));
  }, q);
  await page.reload();
  await waitAppReady(page);
}
async function gotoStatsReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderStats?: unknown } };
    if (!(w.APP3 && typeof w.APP3.renderStats === 'function')) return false;
    const v = document.getElementById('appView');
    return !!(v && (v.querySelector('.stats-page') || v.querySelector('.st-empty-start')));
  }, undefined, { timeout: 20000 });
}

test.describe('3.0 ② 入口修复：额度读满即可答题（不依赖文章读完）', () => {
  test('① 今天额度读满（本篇没读完）→ 放完这句 → 遍间小结「开始答题」端出来', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await pinQuota(page, 2);          // 额度 2 < 本篇队列 4
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');

    const q = await page.evaluate(() => TASK.queue.map((x) => x.i));
    expect(q.length, '夹具要让本篇队列比额度大，否则复现不出用户那个局面').toBeGreaterThan(2);
    // 真读满今天的额度（真事件账，不是伪造 sentDone）
    await page.evaluate((n) => { TASK.queue.slice(0, n).forEach((x) => TASK.readDone(x.i)); TASK.refreshNext(); }, 2);
    const tp = await page.evaluate(() => TASK.todayProgress());
    expect(tp.left, '额度必须真的读满').toBe(0);
    // 文章并没读完 —— 正是用户那张截图：本篇只读了一部分
    const st = await page.evaluate(() => APP3.articleStat(0));
    expect(st.ever, '本篇不该是读完状态').toBeLessThan(st.total);

    // readDone 不算「放完」→ 还没有提示；放完这一句（taskSentenceFinished）才该端小结
    await expect(page.locator('#passCard')).toBeHidden();
    await page.evaluate(() => TASK.taskSentenceFinished(TASK.queue[1].i));
    await expect(page.locator('#passCard .pass-summary')).toBeVisible();
    await expect(page.locator('#passCard .pass-summary .go')).toContainText('答题');
    // 小结一出现，正文已挖空 + 已在 ②
    expect(await page.evaluate(() => TASK.pass())).toBe(2);
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
  });

  test('② 读满后任务条不再写「下一句」，主按钮点了直达 ②', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await pinQuota(page, 2);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');

    await page.evaluate(() => { TASK.queue.slice(0, 2).forEach((x) => TASK.readDone(x.i)); TASK.refreshNext(); });
    const nxt = page.locator('#tbNext');
    await expect(nxt, '读满后不许再显示「下一句」').not.toContainText('下一句');
    await expect(nxt).toContainText('答题');

    await nxt.click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    expect(await page.evaluate(() => TASK.pass()), '点了必须真的进 ②').toBe(2);
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
  });

  test('③ 首页卡片在「今天读完了」时给「答题」，点了直达 ②', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await pinQuota(page, 2);
    // 就在首页真读满今天的额度（不先进任务模式）
    await page.evaluate(() => { Array.from(ShadowPlan.articleScope(SECTIONS, 0)).slice(0, 2).forEach((i) => TASK.readDone(i)); APP3.route(); });
    expect((await page.evaluate(() => TASK.todayProgress())).left).toBe(0);

    const card = page.locator('.art-card[data-a="0"]');
    // §9.4 的 stage 判据不动：本篇没读完，胶囊仍是「通读中」
    await expect(card).toHaveAttribute('data-stage', 'reading');
    const quizBtn = card.locator('.a-quiz');
    await expect(quizBtn, '今天读完了的卡片必须给答题入口').toContainText('答题');

    await quizBtn.click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    expect(await page.evaluate(() => TASK.pass())).toBe(2);
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
  });

  test('④ 数据页「今天」块与「待加强」指向同一入口（去答题 → ②）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await gotoStatsReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const raw = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
      const day = ShadowPlan.dayKey(Date.now(), 4);
      raw.planned = raw.planned || {}; raw.planned[day] = 2;
      localStorage.setItem('ielts.shadow.v2', JSON.stringify(raw));
    });
    await page.reload();
    await gotoStatsReady(page);
    await page.evaluate(() => { Array.from(ShadowPlan.articleScope(SECTIONS, 0)).slice(0, 2).forEach((i) => TASK.readDone(i)); APP3.route(); });
    expect((await page.evaluate(() => TASK.todayProgress())).left).toBe(0);

    const todayGo = page.locator('.st-block[data-block="today"] .st-go[data-go="quiz"]');
    await expect(todayGo, '「今天」块要有一个去答题').toContainText('去答题');
    await expect(page.locator('.st-tip[data-tip="quiz"]'), '「待加强」要指向同一入口').toContainText('答题');
    await expect(page.locator('.st-tip[data-tip="quiz"] .tip-go')).toContainText('去答题');

    await page.locator('.st-tip[data-tip="quiz"] .tip-go').click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    expect(await page.evaluate(() => TASK.pass())).toBe(2);
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
  });

  /* M1 既有路径回归（与 task.spec.ts:513 同源，这里再钉一次两条路并存）：
     本篇队列真走完（不靠额度）也必须端小结、进 ②。 */
  test('M1 回归：① 走完整篇队列 → 小结「开始答题」→ 正文立刻挖空', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');

    await page.evaluate(() => { TASK.queue.map((x) => x.i).forEach((i) => TASK.readDone(i)); });
    await page.evaluate(() => TASK.next());
    await expect(page.locator('#passCard .pass-summary')).toBeVisible();
    await expect(page.locator('#passCard .pass-summary .go')).toContainText('开始');
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
    await page.locator('#passCard .pass-summary .go').click();
    await expect(page.locator('#passCard')).toBeHidden();
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
  });
});
