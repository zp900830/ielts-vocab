// 答题体验四件套（2026-10-09 用户实景反馈）：
// ① 答完浮窗不收：选项标红/绿 + 朗读（错项先读、对项跟上）—— 不背单词式反馈；
// ② 浮窗长在空的**下方**：上一个空的红/绿和辨析表留在视野里，不再被遮得严严实实；
// ③ 答题自动压住句内词义/辨析卡（剧透源），出 ② 还原，用户的「行内词义」开关不动；
// ④ 按篇答完 ≠ 今天完成：全局还有剩 → 「本篇完成 · 继续读」，点了扩回全局队列接着读（不迷失）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  exitTaskMode(): void;
  openArticle(a: number): void;
  setPass(n: number): void;
  next(): void;
  pass(): number;
  finished(): boolean;
  answerQuiz(choice: string): boolean;
  currentQuiz(): { opts: string[]; answer: string } | null;
  queue: { i: number }[];
  queueLeftToday(): number;
  continueTodayQueue(): void;
};
declare const APP3: { openBlank(bi: number): void };
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number> };
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 四个名词配好义项互不重叠的卡（四选一凑得齐），第 0 篇 8 句、其余各 2 句（全局 18 句）。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + QSENSES[i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
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

async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
}

/* 朗读引擎换成记录笔：__spokenTxt 记朗读的词序、__cbs 攒兑现口 ——
   断言「错项先读、对项跟上」靠它（headless 里 speechSynthesis 不发声，本来也要 stub）。 */
async function installSpeakRecorder(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[]; __spokenTxt: string[] };
    w.__cbs = []; w.__spokenTxt = [];
    w.speak = function (t: string, cb?: () => void) { w.__spokenTxt.push(t); if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

async function answerWronglyInPop(page: import('@playwright/test').Page) {
  const idx = await page.evaluate(() => {
    const q = TASK.currentQuiz()!;
    return q.opts.findIndex((o) => o !== q.answer);
  });
  await page.locator('#blankPop .qz-opt').nth(idx).click();
}

/* ① 反馈态：答完浮窗不收，错选标红、正确项标绿，朗读先错后对。 */
test('答完反馈：浮窗选项标色 + 朗读先错后对（不背单词式）', async ({ page }) => {
  await stubData(page, SIXQ);
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toBeVisible();
  await installSpeakRecorder(page);
  await page.evaluate(() => TASK.setPass(2));

  const answer = await page.evaluate(() => TASK.currentQuiz()!.answer);
  const pick = await page.evaluate(() => TASK.currentQuiz()!.opts.find((o) => o !== TASK.currentQuiz()!.answer)!);
  await answerWronglyInPop(page);

  // 浮窗不收：错选 .wrong、正确项 .right、提示语换成判词
  await expect(page.locator('#blankPop')).toBeVisible();
  await expect(page.locator('#blankPop .qz-opt.wrong'), '选错的标红').toHaveText(new RegExp(pick.slice(0, 4)));
  await expect(page.locator('#blankPop .qz-opt.right'), '正确项标绿').toHaveCount(1);
  await expect(page.locator('#blankPop .bp-hint')).toContainText('正确的是');

  // 朗读：错项先出声，兑现它的回调后（+停一拍）对项跟上
  const spoken = await page.evaluate(() => (window as unknown as { __spokenTxt: string[] }).__spokenTxt);
  expect(spoken[0], '先读选错的那个').toBe(pick);
  await finishSpeak(page);
  await page.waitForTimeout(450);
  const spoken2 = await page.evaluate(() => (window as unknown as { __spokenTxt: string[] }).__spokenTxt);
  expect(spoken2[1], '停一拍后读正确的那个').toBe(answer);
});

/* ② 浮窗长在空的下方：正常视口下 .below 箭头朝上；空滚进视口时给下边留了 scroll-margin。 */
test('浮窗优先长在空的下方，上一句的答题反馈留在视野里', async ({ page }) => {
  await stubData(page, SIXQ);
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').first().click();
  await page.evaluate(() => TASK.setPass(2));
  await expect(page.locator('#blankPop')).toBeVisible();

  await expect(page.locator('#blankPop.below'), '正常视口下浮窗在空下方（箭头朝上）').toBeVisible();
  const geo = await page.evaluate(() => {
    const pop = document.getElementById('blankPop')!.getBoundingClientRect();
    const blank = document.querySelector('#art .qz-blank.qz-blank, #art .qz-blank') as HTMLElement;
    const cur = document.querySelector(`#art .qz-blank[data-bi="${blank.dataset.bi}"]`)!.getBoundingClientRect();
    return { popTop: pop.top, blankBottom: cur.bottom };
  });
  expect(geo.popTop, '浮窗顶边必须在空的底边之下（真的在下方，不是盖在句子上）').toBeGreaterThanOrEqual(geo.blankBottom);
});

/* ③ 答题防剧透：② 期间句内词义/辨析卡整体压住、顶栏开关禁用并写明原因；
   退出任务模式立即还原 —— 用户自己的「行内词义」设置一个字不动。 */
test('答题自动藏句内词义（防剧透），退出还原且不动用户开关', async ({ page }) => {
  await stubData(page, SIXQ);
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toBeVisible();

  // ① 态词义是显示的（开着学），进 ② 被压住
  await expect(page.locator('#art .gl').first()).toBeVisible();
  await page.evaluate(() => TASK.setPass(2));
  await expect(page.locator('body')).toHaveClass(/quiz-gl-off/);
  expect(await page.locator('#art .gl').first().isVisible(), '行内词义在答题中不可见').toBe(false);
  await expect(page.locator('#btnGloss'), '开关禁用并写明原因').toBeDisabled();

  // 退出还原：quiz-gl-off 摘掉、开关回来，且用户没被偷偷改设置（hide-gl 未被写入）
  await page.evaluate(() => TASK.exitTaskMode());
  await expect(page.locator('body')).not.toHaveClass(/quiz-gl-off/);
  await expect(page.locator('#btnGloss')).toBeEnabled();
  expect(await page.evaluate(() => document.body.classList.contains('hide-gl')), '用户的「行内词义」偏好没被动过').toBe(false);
});

/* ④ 按篇答完 ≠ 今天完成（2026-10-09 用户：「答完题会继续跳到另外章吗？不迷失」）：
   第 0 篇答完 → 收工说「本篇完成」+ 推进位「继续读」；点了扩回全局队列，
   正文切到下一篇并弹「本篇读完了 · 队列接着读」—— 下一步做什么一眼可见。
   夹具与 SIXQ 的差别：每句一个**独占**词（a{ai}_w{i}）—— 词在篇间复用时 assemble
   「一个词只排一次」，全局队列缩在第 0 篇里，「今天还有剩」就造不出来了。 */
const UNIQUE: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = `a${ai}_w${i}`;
      vocab[w] = { m: `n. 义项${ai}_${i}` };
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

test('本篇答完今天还有剩：「继续读」扩回全局队列接着读', async ({ page }) => {
  await stubData(page, UNIQUE);
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toBeVisible();

  // 先把第 0 篇的通读账记上（模拟「读完了这一篇」），再按篇答完 8 题 ——
  // 不先通读的话，「继续读」会从第 0 篇第 0 句开始读今天的量（不跨篇，是另一条合理路径）。
  await page.evaluate(() => {
    Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i: number) => (TASK as unknown as { readDone(i: number): void }).readDone(i));
    TASK.setPass(2);
    for (let g = 0; g < 300; g++) {
      const q = TASK.currentQuiz();
      if (!q) break;
      TASK.answerQuiz(q.answer);
      TASK.nextQuiz();
    }
  });
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
  await expect(page.locator('#tbTitle')).toContainText('本篇完成');
  await expect(page.locator('#tbNext')).toContainText('继续读');
  const left = await page.evaluate(() => TASK.queueLeftToday());
  expect(left, '夹具前提：全局还有没读的句（第 2 篇起的 10 句）').toBeGreaterThan(0);

  // 点「继续读」：解除按篇收窄，队列跳到下一篇的第一句，pass 回 ①
  await page.locator('#tbNext').click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  expect(await page.evaluate(() => TASK.pass()), '继续的是通读（pass 1），不是答题').toBe(1);
  expect(await page.evaluate(() => TASK.finished()), '收工态已解除').toBe(false);
  const qis = await page.evaluate(() => TASK.queue.map((q: { i: number }) => q.i));
  expect(qis, '队列扩回全局：含第 2 篇的句（全局 8..9）').toEqual(expect.arrayContaining([8, 9]));
  // 跨篇 toast 把因果说全：本篇读完了，队列接着读（onChapterChange 的 fromTask 文案）
  await expect(page.locator('#abToast')).toContainText('本篇读完了', { timeout: 5000 });
});
