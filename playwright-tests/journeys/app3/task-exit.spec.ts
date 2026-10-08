// 回归：任务模式退出即停播 + 口音切换不洗掉已存的云音色选择（2026-09-28 用户报障）。
// 只覆盖主站（2026-10-08 起全站就这一个版本）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  exitTaskMode(): void;
  state(): { daily: Record<string, unknown>; sents: Record<string, { lastReadAt: number }> };
  queue: { i: number }[];
  progress: { sentences: Record<string, { reps: number }> };
  listenSetSrc(s: string): string;
  listenToggle(): void;
  onSentenceComplete(gi: number): void;
  taskSentenceFinished(gi: number): boolean;
  roundInfo(): { round: number; done: number; total: number };
  startNewRound(): number;
  seedRoundSeenForTest(gis: number[]): number;
  setManualStart(gi: number): boolean;
  clearManualStart(): boolean;
  confirmAutoStart(fromPicker: boolean): void;
  applyDaystartEvents(): boolean;
  manualStart(): { gi: number; day: string; ts: number } | null;
  testManualStartLocal(v: { gi: number; day: string; ts: number } | null): unknown;
  events(): { type: string; day?: string; gi?: number; ts?: number }[];
  startInfo(): { manual: boolean; gi: number | null; text: string };
  openStartPicker(): void;
  openArticle(a: number): void;
  openPanel(): void;
  todayProgress(): { done: number; planned: number };
  listenState(): { src: string; todayPos: number; todayTotal: number };
};
declare const setAccent: (a: string) => void;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇 stub（抄 task.spec.ts 同一套）：第 0 篇 12 句，其余各 2 句。 */
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

/* 朗读引擎换成录音笔（抄 task.spec.ts）：__cbs 攒下未兑现的“这句播完”回调。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const pendingSpeaks = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __cbs: unknown[] }).__cbs.length);
const fireStaleSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });
const playBtnLabel = (page: import('@playwright/test').Page) =>
  page.evaluate(() => document.getElementById('btnPlay')?.textContent?.trim() || '');

test('退出任务模式：滞留的旧播放回调不再续播（退出即停）', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await installSpeakStub(page);

  await page.locator('#tbNext').click();          // 起播：旧链攒进 __cbs
  expect(await pendingSpeaks(page), '起播后应有一句在播').toBeGreaterThan(0);

  await page.evaluate(() => TASK.exitTaskMode());
  await expect(page.locator('body'), '退出后不在任务模式').not.toHaveClass(/task-mode/);

  await fireStaleSpeak(page);                     // 兑现退出前滞留的那句“播完了”
  expect(await pendingSpeaks(page), '旧回调不许再发射下一句').toBe(0);
  expect(await playBtnLabel(page), '退出后播放键回到“播放”（不在播了）').toContain('播放');
});

test('口音切换：云端不可用时不洗掉已存的云音色选择', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await installSpeakStub(page);                   // setAccent 尾巴上的试听只进录音笔，不真发声
  const cloudOn = await page.evaluate(() => {
    try { return !!(window as unknown as { CLOUD?: { _on?: boolean } }).CLOUD?._on; } catch (e) { return false; }
  });
  expect(cloudOn, '本用例要求未登录态（云端不可用）').toBe(false);

  await page.evaluate(() => { localStorage.setItem('ielts-voice', 'cloud:kept-voice'); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  const before = await page.evaluate(() => localStorage.getItem('ielts-voice'));
  expect(before, '云选择要真存进 localStorage').toBe('cloud:kept-voice');

  await page.evaluate(() => setAccent('en-US'));   // 切口音：以前这里会把云选择洗成本地
  expect(await page.evaluate(() => localStorage.getItem('ielts-voice')),
    '云端不可用时切口音不许改写云选择').toBe('cloud:kept-voice');
});

/* 2026-09-28 用户报障第二轮：「我都返回了，不在任务模式了，还仍在播放」——
   头部 #ttBack 已修，但他实际走的是左侧导航 / 浏览器后退（只改 hash），
   route() 与 .nav-item 点击此前都不碰任务模式。这里锁两条退出路径。 */
async function enterTaskAndStartPlay(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await installSpeakStub(page);
  await page.locator('#tbNext').click();          // 起播：旧链攒进 __cbs
  expect(await pendingSpeaks(page), '起播后应有一句在播').toBeGreaterThan(0);
}

test('一级导航「首页」（hash 不变、不触发 hashchange）也退出任务模式并停播', async ({ page }) => {
  await enterTaskAndStartPlay(page);
  // 任务模式就在 #/home 上建立：再点「首页」hash 不变 → hashchange 不触发，只能靠点击处那层。
  // （sidenav 在 task-mode 下被 CSS 藏了，用事件派发走同一条代理处理链。）
  await page.locator('.nav-item[data-route="home"]').dispatchEvent('click');
  await expect(page.locator('body'), '点导航后必须真退出任务模式').not.toHaveClass(/task-mode/);
  await fireStaleSpeak(page);
  expect(await pendingSpeaks(page), '退出后滞留的旧回调不许再续播').toBe(0);
  expect(await playBtnLabel(page), '播放键要回到「播放」').toContain('播放');
});

test('切到别的页（hashchange → route）也退出任务模式并停播', async ({ page }) => {
  await enterTaskAndStartPlay(page);
  // route 里有 800ms 时间窗豁免「进入动作自带的 hashchange」，真实导航必须在窗外
  await page.waitForTimeout(900);
  await page.evaluate(() => { location.hash = '#/stats'; });   // 等价于浏览器后退/切页
  await expect(page.locator('body'), '切页后必须真退出任务模式').not.toHaveClass(/task-mode/);
  await fireStaleSpeak(page);
  expect(await pendingSpeaks(page), '退出后滞留的旧回调不许再续播').toBe(0);
  expect(await playBtnLabel(page), '播放键要回到「播放」').toContain('播放');
});

/* 2026-09-28 第三轮：① 进来第一句自动播；② 点「下一句」即+1（不等播完，防点快漏账）。 */
const repsCount = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const s = TASK.progress.sentences || {};
    return Object.keys(s).filter((k) => (s[k].reps || 0) > 0).length;
  });
const repsOf = (page: import('@playwright/test').Page, gi: number) =>
  page.evaluate((g) => ((TASK.progress.sentences || {})[g] || { reps: 0 }).reps, gi);

test('点“下一句”即+1：不等播完，且播完不重复记', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  const first = await page.evaluate(() => TASK.queue[0].i);
  expect(await repsOf(page, first), '点之前未读').toBe(0);

  await page.locator('#tbNext').click();         // 第一下：放这一句 + 点即+1
  expect(await repsOf(page, first), '点一下就记，不等播完').toBeGreaterThan(0);

  await fireStaleSpeak(page);                    // 兑现滞留的播完回调（入口自动播 + 刚点的）
  await fireStaleSpeak(page);
  expect(await repsOf(page, first), '播完不许重复记').toBe(1);
  expect(await repsCount(page), '只记了点过的这一句').toBe(1);

  await page.locator('#tbNext').click();         // 第二下：口径A去屏幕下一句 + 点即+1
  expect(await repsCount(page), '第二下记到第二句').toBe(2);
});

/* 2026-09-28 新功能：随身听「仅今日任务」——按当日列表播，播完从头循环。 */
async function installTextStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as {
      speak: (t: string, cb?: () => void) => void;
      __cbs: (() => void)[]; __texts: string[];
    };
    w.__cbs = []; w.__texts = [];
    w.speak = function (t: string, cb?: () => void) { w.__texts.push(t); if (cb) w.__cbs.push(cb); };
  });
}
const spokenTexts = (page: import('@playwright/test').Page) =>
  page.evaluate(() => (window as unknown as { __texts: string[] }).__texts.slice());

test('随身听仅今日任务：按当日列表播完自动从头循环', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.goto(`${rootUrl}/index.html#/listen`);
  await expect(page.locator('.ls-card')).toBeVisible();
  await installTextStub(page);

  expect(await page.evaluate(() => TASK.listenSetSrc('today')), '切到今日任务').toBe('today');
  const total = (await page.evaluate(() => TASK.listenState())).todayTotal;
  expect(total, '今日列表非空').toBeGreaterThan(0);

  await page.evaluate(() => TASK.listenToggle());   // 起播
  expect((await spokenTexts(page)).length, '起播发射第一句').toBe(1);
  for (let k = 0; k < total; k++) await fireStaleSpeak(page);   // 播完当日整单
  const texts = await spokenTexts(page);
  expect(texts.length, '整单播完共发射 N+1 句').toBe(total + 1);
  expect(new Set(texts.slice(0, total)).size, '当日列表去重保序').toBe(total);
  expect(texts[total], '播完从头循环').toBe(texts[0]);
});

/* 2026-09-28 第四轮：① 存档句已读完时入口落到第一条没读的（游标/高亮/队列三方对齐，
   第一 下不许跳走）；② 点只+1+高亮+播，变暗等播完。 */
const hlIndex = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Array.from(document.querySelectorAll('#art .sent')).findIndex((el) => el.classList.contains('playing')));
const hasTaskDone = (page: import('@playwright/test').Page, local: number) =>
  page.evaluate((li) => {
    const el = document.querySelectorAll('#art .sent')[li];
    return !!(el && el.classList.contains('task-done'));
  }, local);

test('点只+1+高亮+播：变暗等播完那一下', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);

  await page.locator('#tbNext').click();            // 第一下：放这一句 + 点即+1
  expect(await hlIndex(page), '点了就高亮').toBe(0);
  expect(await hasTaskDone(page, 0), '没播完不许变暗').toBe(false);

  await fireStaleSpeak(page);                       // 播完
  expect(await hasTaskDone(page, 0), '播完才变暗').toBe(true);
  expect(await hlIndex(page), '播完高亮停在原句').toBe(0);
});

test('存档句已读完：重进落到第一条没读的，第一下不跳走', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);

  await page.locator('#tbNext').click();            // 读 s0（点即+1 + 起播）
  await fireStaleSpeak(page);                       // s0 播完（落 lastRead + 变暗）
  await page.evaluate(() => TASK.exitTaskMode());

  await page.locator('.art-card').first().click();  // 重进：存档 s0 已读完
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  expect(await hlIndex(page), '高亮 = 第一条没读的 s1，不是存档 s0').toBe(1);

  await installTextStub(page);
  await page.locator('#tbNext').click();            // 第一下：放的就是高亮这句，不许跳走
  const texts = await spokenTexts(page);
  expect(texts.length, '第一下就发射').toBeGreaterThan(0);
  expect(texts[texts.length - 1], '放的是高亮的 s1').toContain('Sentence 1 about');
});

/* 2026-09-28 口径：任务外自由播放不记账。直接打唯一的自由记账入口，
   断言 reps / 事件流 / 日账三本账一字不动。 */
test('任务外自由播放不记账：onSentenceComplete 零写入', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  const snap = () => page.evaluate(() => JSON.stringify({
    sents: TASK.progress.sentences,
    daily: TASK.state().daily,
    nev: TASK.events().length,
  }));
  const before = await snap();
  await page.evaluate(() => { TASK.onSentenceComplete(0); TASK.onSentenceComplete(1); });
  expect(await snap(), '任务外记账入口必须零写入').toBe(before);
});

/* 2026-09-30 黑白区分 + 新一轮 + 手动起点。 */

/* 微型语料：整库只有 2 句（一轮 = 2），一次跑通"读完一轮→开新轮"。 */
const TWO: Record<string, string> = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: [''],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  return {
    'sections.json': JSON.stringify([
      mk('地球与生命', ['The [[atmosphere:atmosphere]] protects life.', 'We need [[oxygen:oxygen]] to live.']),
    ]),
    'vocab.json': JSON.stringify({ atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' } }),
    'chapters.json': '[]',
  };
})();

async function stubData2(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 口径（2026-10-08 晚二次改）：黑 = 「已完成」—— 曾经读过（reps>0，任何一轮）∪ 任务①当前高亮句。
   高亮挪到哪句哪句当场黑（上一句/键盘/点句这些不走 TASK.next 的路径也亮，paintLighting 统一挂 paint）；
   roundSeen 只喂「本轮 x/y」的账，不再管颜色。
   另一半没动：lastRead（左侧「今日已读」竖条 + 额度）仍只许发生在播完，那是 2026-09-28 他自己拍的。 */
test('颜色跟「已完成」走：高亮句当场黑，读过的一直黑；「今日已读」仍等播完', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  const cls = (li: number) => page.evaluate((i) => ({
    known: !!document.querySelectorAll('#art .sent')[i]?.classList.contains('lw-known'),
    unknown: !!document.querySelectorAll('#art .sent')[i]?.classList.contains('lw-unknown'),
  }), li);
  expect((await cls(0)).known, '进①高亮这句当场算已完成，直接黑').toBe(true);
  expect((await cls(0)).unknown, '黑了就不许挂着灰字类').toBe(false);
  expect((await cls(1)).unknown, '还没轮到的下一句仍是灰').toBe(true);
  expect((await page.evaluate(() => TASK.roundInfo())).done, '只是高亮，本轮账还是 0').toBe(0);

  await page.locator('#tbNext').click();                 // 点即+1：这句真读上了
  expect(await pendingSpeaks(page), '这句的音频还在排队，根本没放完').toBeGreaterThan(0);
  expect((await cls(0)).known, '点了就黑，不许等播完').toBe(true);
  expect((await cls(0)).unknown, '黑了就不许再挂着灰字类').toBe(false);
  expect((await page.evaluate(() => TASK.roundInfo())).done, '点一下就记进本轮').toBe(1);
  expect(await hasTaskDone(page, 0), '「今日已读」的竖条仍等播完（2026-09-28 口径没跟着动）').toBe(false);

  await fireStaleSpeak(page);                            // 播完回调再来一次
  expect((await cls(0)).known, '播完仍是黑').toBe(true);
  expect((await page.evaluate(() => TASK.roundInfo())).done, '同一句不许记两遍').toBe(1);
  expect(await hasTaskDone(page, 0), '播完才落 task-done').toBe(true);
});

/* 纯听不点：颜色在高亮那一下就已经黑（显示层），本轮账与「今日已读」等播完才记。 */
test('纯听不点：高亮就黑，账等播完', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  const known0 = () => page.evaluate(() =>
    !!document.querySelectorAll('#art .sent')[0]?.classList.contains('lw-known'));
  expect(await known0(), '高亮这句当场黑（高亮=已完成）').toBe(true);
  expect((await page.evaluate(() => TASK.roundInfo())).done, '没点没放完，本轮账不动').toBe(0);

  await page.evaluate(() => TASK.taskSentenceFinished(0));   // 放完回调直接进来
  expect(await known0(), '放完仍是黑').toBe(true);
  expect((await page.evaluate(() => TASK.roundInfo())).done, '一句就是一句').toBe(1);
  expect((await page.evaluate(() => TASK.todayProgress())).done, '今日已读同一下落').toBe(1);
});

/* 判据①（2026-10-08 晚二次口径的核心支点）：黑 = 已完成 = reps>0，与「是不是当前句」
   「在不在任务模式」都无关。读到一句就退出任务模式：非当前句、无播放链，这句必须保持黑。
   旧判据只认 roundSeen（本轮），这条场景在「开新轮/隔天重进」下全是灰 —— 用户截图报的就是它。 */
test('读过就保持黑：退出任务模式后 reps>0 的句子仍黑（判据①）', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);

  await page.locator('#tbNext').click();            // s0 点即+1（reps=1）
  await fireStaleSpeak(page);                       // s0 播完落账
  await page.evaluate(() => TASK.exitTaskMode());
  await expect(page.locator('body'), '已退出任务模式').not.toHaveClass(/task-mode/);

  const cls0 = await page.evaluate(() => ({
    known: !!document.querySelectorAll('#art .sent')[0]?.classList.contains('lw-known'),
    unknown: !!document.querySelectorAll('#art .sent')[0]?.classList.contains('lw-unknown'),
    color: (() => { const el = document.querySelectorAll('#art .sent')[0]; return el ? getComputedStyle(el).color : ''; })(),
  }));
  expect(cls0.known, '非当前句、非任务模式：reps>0 仍挂黑字类').toBe(true);
  expect(cls0.unknown, '不许同时挂着灰字类').toBe(false);
  expect(cls0.color, '计算色 = 近黑 --ink-known #181c15').toBe('rgb(24, 28, 21)');
});

/* 跨设备账（2026-10-09 用户报「硬刷新后只有高亮句黑，其他都是灰」）：接触事件走
   shadow_events 云同步，引擎重放出 ROOT2.state.sents —— 手机上读过的句子，这台设备
   的本地 reps 账是空的，但任务条「本篇 x/y」「今天 x/y」全读这本云账（readToday2 /
   everRead 同源）。颜色必须跟它对齐：ROOT2 里有 lastReadAt 的照样点亮（判据②），
   不能只认本地 prog.sentences，否则数字说读过、颜色还是灰。 */
test('跨设备账：影子引擎句账（云事件重放）里的已读句也点亮（判据②）', async ({ page }) => {
  await stubData(page, SIX);
  // 本地账只有第 1 句：模拟「这句是在这台设备上读的」
  await page.addInitScript(() => {
    localStorage.setItem('ielts-task-progress', JSON.stringify({
      sentences: { 1: { reps: 2, phase: 'learning', nextDue: 0, lastRead: 1700000000000 } },
      daily: {}, streak: 0, lastDay: '', cycleCount: 0, cycleSeen: {},
    }));
  });
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  // 引擎侧种跨设备账：第 0、2 句在「另一台设备」读过（云事件重放结果），本地从没碰过
  await page.evaluate(() => {
    TASK.state().sents = { 0: { lastReadAt: 1700000000000 }, 2: { lastReadAt: 1700000000001 } };
  });
  await page.evaluate(() => TASK.openArticle(0));      // 渲染正文 → updateMarkers
  await page.evaluate(() => TASK.exitTaskMode());      // 出任务模式：关掉「当前句」兜底，只验 ①②
  await page.evaluate(() => TASK.updateMarkers());     // 退出后显式重刷一遍

  const states = await page.evaluate(() => [...document.querySelectorAll('#art .sent')].slice(0, 5).map((el) => ({
    known: el.classList.contains('lw-known'),
    unknown: el.classList.contains('lw-unknown'),
    color: getComputedStyle(el).color,
  })));
  expect(states.length, '正文已渲染').toBeGreaterThanOrEqual(4);
  expect(states[0].known, '云账 lastReadAt>0 → 黑（判据②）').toBe(true);
  expect(states[1].known, '本地 reps>0 → 黑（判据①不变）').toBe(true);
  expect(states[2].known, '云账第二句也黑').toBe(true);
  expect(states[3].unknown, '两本账都没有 → 灰').toBe(true);
  expect(states[0].color, '计算色 = 近黑 --ink-known #181c15').toBe('rgb(24, 28, 21)');
});


test('读完一轮可开新轮：本轮账清零、轮次+1（颜色跟已完成走，不再回灰）', async ({ page }) => {
  await stubData2(page, TWO);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  expect(await page.evaluate(() => TASK.roundInfo()), '开局第 1 轮').toEqual({ round: 1, done: 0, total: 2 });
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await page.locator('#tbNext').click();
  await fireStaleSpeak(page);
  expect(await page.evaluate(() => TASK.roundInfo()), '读完第 1 句记 1').toEqual({ round: 1, done: 1, total: 2 });
  // 第 2 句走测试缝记（UI 点读会触发 finishPass 翻到 ②，参实现注释）
  await page.evaluate(() => TASK.seedRoundSeenForTest([1]));
  expect(await page.evaluate(() => TASK.roundInfo()), '两句读完一轮').toEqual({ round: 1, done: 2, total: 2 });
  await page.on('dialog', (d) => d.accept());
  await page.evaluate(() => TASK.openPanel());
  const btn = page.locator('#todayPanel button', { hasText: '开启新的一轮' });
  await expect(btn, '读完一轮面板里有开新轮按钮').toBeVisible();
  await btn.click();
  expect(await page.evaluate(() => TASK.roundInfo()), '新轮计数清零').toEqual({ round: 2, done: 0, total: 2 });
});

test('手动起点：队列从指定句起，今日进度重置', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await page.locator('#tbNext').click();
  await fireStaleSpeak(page);                       // s0 读完，done=1
  expect((await page.evaluate(() => TASK.todayProgress())).done, '读完一句 done=1').toBe(1);
  // 第 1 篇第 2 句（全局 13）为起点
  expect(await page.evaluate(() => TASK.setManualStart(13)), '设起点成功').toBe(true);
  expect((await page.evaluate(() => TASK.todayProgress())).done, '今日进度已重置').toBe(0);
  await page.evaluate(() => TASK.exitTaskMode());
  await page.evaluate(() => TASK.openArticle(1));
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  expect(await page.evaluate(() => TASK.queue[0].i), '队列从指定句起').toBe(13);
  const gi = await page.evaluate(() =>
    document.querySelector('.today-range-line[data-edge="start"]')?.getAttribute('data-gi'));
  expect(gi, '开始线落到指定句').toBe('13');
  await page.evaluate(() => TASK.exitTaskMode());
  expect(await page.evaluate(() => TASK.clearManualStart()), '恢复引擎').toBe(true);
  await page.evaluate(() => TASK.openArticle(0));
  expect(await page.evaluate(() => TASK.queue[0].i), '恢复后引擎从头排').toBe(0);
});

/* 今日起点跨设备（2026-10-09 用户报「桌面设了起点，手机还是第一篇第一句」）：
   manualStart 原来只写本机 LS_V2，事件流里没有它的位置，别的设备永远看不到。
   现在 set/clear 都发 daystart 事件（dayplan 同款通道），对端拉到后 applyDaystartEvents
   按「ts 最新者赢」重放。这条用例直接在事件流层面拍两台设备的账。 */
test('今日起点跨设备：daystart 事件入流，对端重放跟账', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);

  // 设备 A：设起点 → daystart 事件入流 + 本机账带 ts
  expect(await page.evaluate(() => TASK.setManualStart(13)), '设备 A 设起点成功').toBe(true);
  const ev = await page.evaluate(() => {
    const evs = TASK.events().filter((e) => e.type === 'daystart');
    const last = evs[evs.length - 1];
    return last ? { gi: last.gi, day: last.day, ts: last.ts } : null;
  });
  expect(ev, 'daystart 事件已入流').not.toBeNull();
  expect(ev!.gi, '事件带着起点句号').toBe(13);
  expect((await page.evaluate(() => TASK.manualStart()))?.ts, '本机账带 ts').toBeGreaterThan(0);

  // 设备 B：本机从没见过这个设置（账为空）→ 拉到事件重放，起点跟上来
  await page.evaluate(() => { TASK.testManualStartLocal(null); });
  expect(await page.evaluate(() => TASK.applyDaystartEvents()), 'B 重放应用').toBe(true);
  expect((await page.evaluate(() => TASK.manualStart()))?.gi, 'B 的起点 = A 设的 13').toBe(13);

  // A 切回记忆模式（gi:-1 事件）；B 端还留着旧起点账 → 重放后一起切回
  expect(await page.evaluate(() => TASK.clearManualStart()), 'A 切回记忆模式').toBe(true);
  await page.evaluate((day) => { TASK.testManualStartLocal({ gi: 13, day, ts: 1 }); }, ev!.day!);
  expect(await page.evaluate(() => TASK.applyDaystartEvents()), 'B 重放清除').toBe(true);
  expect(await page.evaluate(() => TASK.manualStart()), 'B 回到记忆模式').toBeNull();

  // ts 守卫：本机账比流里任何事件都新（自己刚点过）→ 不被迟到的旧事件盖掉
  expect(await page.evaluate(() => TASK.setManualStart(13)), 'A 再设一次').toBe(true);
  const kept = await page.evaluate(() => {
    const cur = TASK.manualStart()!;
    TASK.testManualStartLocal({ gi: cur.gi, day: cur.day, ts: Date.now() + 60000 });   // 未来 1 分钟
    return TASK.applyDaystartEvents();
  });
  expect(kept, '本机更新则不动').toBe(false);
  expect((await page.evaluate(() => TASK.manualStart()))?.gi, '保留本机起点').toBe(13);
});

/* 「切换到记忆模式」先亮结果再动手（2026-10-09 用户：「改回自动，起点怎么算？怎么让人不恐慌」；
   2026-10-10 定名：改回自动安排 → 切换到记忆模式）：
   点它在弹窗里先看到引擎挑出来的起点位置/句数/「已读保留」承诺，确认才真清账。 */
test('切换到记忆模式：先预览起点结果，确认才清账', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);

  await page.evaluate(() => TASK.setManualStart(13));
  await page.evaluate(() => TASK.openStartPicker());
  await page.locator('#startPickPop button', { hasText: '切换到记忆模式' }).click();
  await expect(page.locator('#startPickPop h3'), '预览弹层出现').toHaveText(/切换到记忆模式/);
  const warn = await page.locator('#startPickPop .sp-warn').first().textContent();
  expect(warn, '预览里有起点位置（第 X 篇第 Y 句）').toMatch(/第\s*\d+\s*篇第\s*\d+\s*句/);
  expect(warn, '预览里有句数').toContain('句');
  expect(await page.locator('#startPickPop').textContent(), '说清记忆模式会回头补跳过的').toContain('回头补');

  // 返回：还原选择器，账没动
  await page.locator('#startPickPop button', { hasText: '返回' }).click();
  expect(await page.evaluate(() => TASK.manualStart()), '返回不清账').not.toBeNull();
  await expect(page.locator('#startPickPop h3'), '回到选择器').toHaveText(/今日任务从哪开始/);

  // 再走一遍 → 确认切换：账清掉、回显翻记忆模式
  await page.locator('#startPickPop button', { hasText: '切换到记忆模式' }).click();
  await page.locator('#startPickPop button', { hasText: '确认切换' }).click();
  expect(await page.evaluate(() => TASK.manualStart()), '确认后回到记忆模式').toBeNull();
  expect(await page.evaluate(() => TASK.startInfo().manual), '回显为记忆模式').toBe(false);
});

/* 接力规则（2026-10-10 用户：「昨天设的起点没学完，今天应该接着学到的位置继续，
   而不是又从第一章第一句开始」）：手动起点 = 书签，跨天持续有效直到改回自动。
   每天第一次用到时冻结接力起点：cursor = max(设置位置, 设置之后读到的最远位置+1)，
   「设置之后」用接触账 lastReadAt > 设置时刻 ts 判（接触账云同步 → 跨设备一致）。
   冻结后当天不漂（09-30 钉子 bug 教训），跨天重新冻结 → 自然接力。
   浮窗回显 / 弹窗预填 / 文章开始线三处必须读同一个数。 */
test('接力跨天：昨天设的起点读到第9句，今天从第10句接着学', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });

  // 种昨天的账：起点 gi=6（26h 前设），昨天从 6 读到 8（接触账在设置时刻之后）
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    const T1 = Date.now() - 26 * 3600000;
    root.plan.manualStart = { gi: 6, day: 'yesterday', ts: T1 };
    root.state.sents[6] = { lastReadAt: T1 + 60000 };
    root.state.sents[7] = { lastReadAt: T1 + 120000 };
    root.state.sents[8] = { lastReadAt: T1 + 180000 };
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  await page.reload();
  await waitAppReady(page);

  // 回显：接力起点 = 9（第 1 篇第 10 句）
  const si = await page.evaluate(() => TASK.startInfo());
  expect(si.manual, '接力模式跨天生效（旧规则 day 不对就作废）').toBe(true);
  expect(si.gi, '接力起点 = 中断位置 + 1').toBe(9);
  expect(si.text, '回显报接力位置').toContain('第 1 篇第 10 句');

  // 文章开始线钉在同一个位置，队列也从它起
  await installSpeakStub(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  expect(await page.evaluate(() => TASK.queue[0].i), '今日队列从接力起点起').toBe(9);
  expect(await page.evaluate(() =>
    document.querySelector('.today-range-line[data-edge="start"]')?.getAttribute('data-gi')),
    '开始线钉在接力起点').toBe('9');
  await page.evaluate(() => TASK.exitTaskMode());

  // 弹窗预填 = 同一个起点（三处一致的最后一环）
  await page.evaluate(() => TASK.openStartPicker());
  const picked = await page.evaluate(() => ({
    art: parseInt((document.getElementById('spArt') as HTMLSelectElement).value, 10),
    sent: parseInt((document.getElementById('spSent') as HTMLSelectElement).value, 10),
  }));
  expect(picked.art, '预填篇目跟接力起点走').toBe(0);
  expect(picked.sent, '预填第几句 = 接力位置').toBe(10);
  await page.evaluate(() => TASK.closeStartPicker());

  // 当天冻结：此刻再读一句（9），今天的起点不许漂
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    root.state.sents[9] = { lastReadAt: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  expect((await page.evaluate(() => TASK.startInfo())).gi, '冻结后起点不漂').toBe(9);
});

test('接力跨天重放：昨天发的 daystart 事件今天拉取依然生效', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  // 另一台设备昨天发来的 daystart（day 是昨天、事件在流里躺着）
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    root.events = root.events || [];
    root.events.push({ type: 'daystart', day: 'yesterday', gi: 6, ts: Date.now() - 26 * 3600000 });
    root.eventsSeen = root.events.length;
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  await page.reload();
  await waitAppReady(page);
  expect(await page.evaluate(() => TASK.applyDaystartEvents()), '跨天事件照常应用').toBe(true);
  expect((await page.evaluate(() => TASK.manualStart()))?.gi, '书签落账').toBe(6);
  const si = await page.evaluate(() => TASK.startInfo());
  expect(si.manual, '接力模式生效').toBe(true);
  expect(si.gi, '昨天设的没读过 → 今天从设置位置起').toBe(6);
});

test('接力到文末：回显「已到全文末尾」，窗口 clamp 不越界', async ({ page }) => {
  await stubData(page, SIX);                       // 全文 22 句（gi 0..21）
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.evaluate(() => {
    const KEY = 'ielts.shadow.v2';
    const root = JSON.parse(localStorage.getItem(KEY)!);
    const T1 = Date.now() - 26 * 3600000;
    root.plan.manualStart = { gi: 21, day: 'yesterday', ts: T1 };
    root.state.sents[21] = { lastReadAt: T1 + 60000 };   // 最后一句昨天读过 → cursor = 22 = len
    localStorage.setItem(KEY, JSON.stringify(root));
  });
  await page.reload();
  await waitAppReady(page);
  const si = await page.evaluate(() => TASK.startInfo());
  expect(si.manual, '接力模式').toBe(true);
  expect(si.gi, 'clamp 到全文最后一句').toBe(21);
  expect(si.text, '回显明说到头了').toContain('已到全文末尾');
});
