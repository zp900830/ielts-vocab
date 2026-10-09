// 模式重构回归（2026-10-10 用户定名）：「自动/手动」改为「记忆模式/刷句模式」。
// 记忆模式 = 引擎按遗忘曲线挑句（必然跳句）；刷句模式 = 从起点按句号顺序连刷，绝不跳句。
// 本文件锁三件事：① 刷句队列连续无跳句；② 记忆模式「今天的句子」清单（分组 + 标签 + 点句直达）；
// ③ 刷到全书末尾的「再刷一遍」出口；④ 按篇 + 刷句的书签语义。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  exitTaskMode(): void;
  openPanel(): void;
  closePanel(): void;
  openArticle(a: number): void;
  setManualStart(gi: number): boolean;
  clearManualStart(): boolean;
  manualStart(): { gi: number; day: string; ts: number } | null;
  startInfo(): { manual: boolean; gi: number | null; text: string };
  todayPlan(): { queue: { i: number; pool: string }[] };
  queue: { i: number }[];
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇 stub（抄 task-exit.spec.ts 同一套）：第 0 篇 12 句，其余各 2 句，共 22 句。
   句子标记 [[a0_w0:a0_w0]] 会派生出每句一个词；词没见过 = fresh = 池 C（「新词」）。 */
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
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
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
declare const SECTIONS: unknown[];

/* 朗读引擎换成录音笔（抄 task-exit.spec.ts）：headless 里 speechSynthesis 不发声，
   跳句/直达后会 playFrom，不让真引擎掺和。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}

async function freshBook(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
}

/* ① 刷句模式的核心承诺：全局队列 = [起点, 起点+N-1] 按句号连续全装，绝不跳句。
   15 分钟 → N = 900s ÷ 25s = 36；全书只有 22 句 → 窗口 [4..21] 全量 18 句。 */
test('刷句模式：全局队列从起点起按句号连续，一个不跳', async ({ page }) => {
  await freshBook(page);
  expect(await page.evaluate(() => TASK.setManualStart(4)), '设起点 = 进入刷句模式').toBe(true);
  const si = await page.evaluate(() => TASK.startInfo());
  expect(si.manual, '起点在账 = 刷句模式').toBe(true);
  expect(si.text, '回显报刷句起点（不再叫「手动」）').toContain('刷句模式 · 第 1 篇第 5 句');

  await page.evaluate(() => TASK.openPanel());
  await page.locator('#todayPanel button', { hasText: '开始今天的任务' }).click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  const qis = await page.evaluate(() => TASK.queue.map((q) => q.i));
  expect(qis, '队列 = 4..21 连续，一个不跳').toEqual(Array.from({ length: 18 }, (_, k) => k + 4));
});

/* ② 记忆模式「今天的句子」清单：跳句不隐瞒 —— 为什么是这几句、它什么状态，摆在明面上。
   按篇分组、句号升序（当天不回跳）；标签与正文染色同一套语言（新词/该复习了）；
   点一句直接进任务模式跳到那句。 */
test('记忆模式：清单按篇分组带标签，点句直达', async ({ page }) => {
  await freshBook(page);
  /* 种一个「见过的词」：第 2 句的词 a0_w2 已见过 → 清单上它标「该复习了」，其余标「新词」。 */
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    root.state.words['a0_w2'] = { stage: 'seen', reps: 1, err: 0, due: Date.now() + 86400000, ctx: {}, ok3: 0 };
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);

  await page.evaluate(() => TASK.openPanel());
  const panel = page.locator('#todayPanel');
  await expect(panel.locator('.tp-sl h4'), '记忆模式才摆清单').toHaveText('今天的句子');
  const qis = await page.evaluate(() => TASK.todayPlan().queue.map((q) => ({ i: q.i, pool: q.pool })));
  expect(qis.length, '新计划引擎有活干').toBeGreaterThan(0);
  await expect(panel.locator('.tp-sl-row'), '清单行数 = 队列句数').toHaveCount(qis.length);
  await expect(panel.locator('.tp-sl-row[data-gi="2"] .tp-sl-tag'), '见过的词标「该复习了」').toHaveText('该复习了');
  await expect(panel.locator('.tp-sl-row[data-gi="0"] .tp-sl-tag'), '没见过的标「新词」').toHaveText('新词');
  await expect(panel.locator('.tp-sl-art').first(), '按篇分组，第一组是第 1 篇').toContainText('第 1 篇');

  /* 点句直达：进任务模式、高亮落到点的那句（任务条标题读队列位置）。 */
  await panel.locator('.tp-sl-row[data-gi="5"]').click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#abTitle'), '高亮落到点的那句（全局 5 = 第 6 句）').toContainText('读到第 6 句');
});

/* ③ 刷到全书末尾：接力书签 cursor ≥ 全文长度 → 面板给「再刷一遍」；
   点了书签回第 1 篇第 1 句，新一轮从这里重新连刷。 */
test('刷句模式刷到全书末尾：「再刷一遍」把书签送回开头', async ({ page }) => {
  await freshBook(page);
  /* 种接力到末尾的账：书签 gi=20 设于 26h 前，之后 20、21 都读过 → 今天冻结 cursor = 22 = atEnd。 */
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    const T1 = Date.now() - 26 * 3600000;
    root.plan.manualStart = { gi: 20, day: 'yesterday', ts: T1 };
    root.state.sents[20] = { lastReadAt: T1 + 60000 };
    root.state.sents[21] = { lastReadAt: T1 + 120000 };
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);

  expect(await page.evaluate(() => TASK.startInfo().text), '接力到末尾的回显').toContain('已到全文末尾');
  await page.evaluate(() => TASK.openPanel());
  const panel = page.locator('#todayPanel');
  const again = panel.locator('button', { hasText: '再刷一遍' });
  await expect(again, '到末尾才给这一颗').toBeVisible();
  await expect(panel.locator('.tp-sl'), '刷句模式不摆清单（队列连续，文章本身就是顺序）').toHaveCount(0);

  await again.click();
  expect((await page.evaluate(() => TASK.manualStart()))?.gi, '书签回到第 1 篇第 1 句').toBe(0);
  const si = await page.evaluate(() => TASK.startInfo());
  expect(si.text, '回显跟着刷新').toContain('第 1 篇第 1 句');
});

/* ④ 按篇 + 刷句模式：书签在这篇里 → 从那句连刷到篇末（不受 N 截断，与按篇整篇承诺同口径）；
   书签不在这篇里（已刷过）→ 整篇重刷。fixture 篇幅：第 1 篇 12 句（0..11），之后每篇 2 句。 */
test('按篇 + 刷句：书签在内接着刷，书签已过整篇重刷', async ({ page }) => {
  await freshBook(page);
  expect(await page.evaluate(() => TASK.setManualStart(14)), '书签设到第 3 篇第 1 句（全局 14）').toBe(true);

  await page.evaluate(() => TASK.openArticle(2));
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  let qis = await page.evaluate(() => TASK.queue.map((q) => q.i));
  expect(qis, '第 3 篇（14..15）：书签 14 在内 → 从 14 连刷到篇末').toEqual([14, 15]);
  await page.evaluate(() => TASK.exitTaskMode());

  await page.evaluate(() => TASK.openArticle(1));
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  qis = await page.evaluate(() => TASK.queue.map((q) => q.i));
  expect(qis, '第 2 篇（12..13）：书签 14 已过 → 整篇重刷').toEqual([12, 13]);
});

/* ⑤ 「每天有多少分钟」的账面（2026-10-10 用户问「时间是不是只针对刷句了」）：
   两种模式都认它，算法不同且必须亮出来 —— 全局刷句亮「分钟 ≈ 句数」的换算
   （一句约 25 秒）；按篇刷句亮「整篇为单位、分钟只用来估算时长」——
   不让「今天 15 分钟：连刷 40 句」这种数字对不上的账面出现。 */
test('分钟数的账面：全局刷句亮换算，按篇刷句亮整篇承诺', async ({ page }) => {
  await freshBook(page);
  expect(await page.evaluate(() => TASK.setManualStart(4)), '进入刷句模式').toBe(true);

  await page.evaluate(() => TASK.openPanel());
  const note = page.locator('#todayPanel .tp-note').first();
  await expect(note, '全局刷句：分钟与句数画上 ≈ 号').toContainText('15 分钟 ≈');
  await expect(note, '换算口径写明：一句约 X 秒').toContainText('按这个换算成今天的句数');
  await page.evaluate(() => TASK.closePanel());

  await page.evaluate(() => TASK.openArticle(2));   // 第 3 篇（14..15）：书签在内
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await page.evaluate(() => TASK.openPanel());
  const note2 = page.locator('#todayPanel .tp-note').first();
  await expect(note2, '按篇刷句：整篇承诺亮出来').toContainText('连刷到篇末');
  await expect(note2, '时间在按篇口径下只是估算').toContainText('只用来估算时长');
});

/* ⑥ 模式出口的显隐跟着状态走（2026-10-09 用户实景抓的荒谬点：已在记忆模式，
   起点弹窗里还挂着「切换到记忆模式」——在记忆模式里还能再切换成记忆模式？）。
   三处出口同一条规则：只有刷句状态在账（manualStart 非空）才给这颗出口 ——
   记忆模式下弹窗只管「选起点 = 进刷句」，不摆一颗空转的切换键。 */
test('起点弹窗的「切换到记忆模式」只在刷句状态下出现', async ({ page }) => {
  await freshBook(page);

  // 记忆模式（没设起点）：弹窗里没有这颗按钮
  await page.evaluate(() => TASK.openPanel());
  await page.locator('#todayPanel button', { hasText: '起点与模式' }).click();
  await expect(page.locator('#startPickPop'), '弹窗打开').toBeVisible();
  await expect(page.locator('#startPickPop button', { hasText: '切换到记忆模式' }),
    '记忆模式下不给这颗空转的出口').toHaveCount(0);
  await page.evaluate(() => TASK.closeStartPicker());

  // 设起点进入刷句模式：同一颗弹窗里按钮出现，走预览-确认链路
  expect(await page.evaluate(() => TASK.setManualStart(4)), '进入刷句模式').toBe(true);
  await page.evaluate(() => TASK.openStartPicker());
  await expect(page.locator('#startPickPop button', { hasText: '切换到记忆模式' }),
    '刷句模式下这颗出口回来').toHaveCount(1);
  await page.locator('#startPickPop button', { hasText: '切换到记忆模式' }).click();
  await expect(page.locator('#startPickPop h3'), '先看到预览再动手').toContainText('切换到记忆模式？');
  await page.locator('#startPickPop button', { hasText: '返回' }).click();
  expect(await page.evaluate(() => TASK.manualStart()), '返回不清账').not.toBeNull();
  await expect(page.locator('#startPickPop h3'), '回到选择器').toHaveText(/今日任务从哪开始/);
});
