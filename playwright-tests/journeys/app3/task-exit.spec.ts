// 回归：任务模式退出即停播 + 口音切换不洗掉已存的云音色选择（2026-09-28 用户报障）。
// 只覆盖 /app/（用户只用 app 项目，shadow/ 主站不动）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  exitTaskMode(): void;
  state(): { daily: Record<string, unknown> };
  queue: { i: number }[];
  progress: { sentences: Record<string, { reps: number }> };
  listenSetSrc(s: string): string;
  listenToggle(): void;
  onSentenceComplete(gi: number): void;
  roundInfo(): { round: number; done: number; total: number };
  startNewRound(): number;
  seedRoundSeenForTest(gis: number[]): number;
  setManualStart(gi: number): boolean;
  clearManualStart(): boolean;
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
    await page.route(`**/shadow/data/${name}*`, (r) =>
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
  await page.goto(`${rootUrl}/app/index.html#/listen`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

test('颜色跟播完走：未读灰，播完才黑', async ({ page }) => {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  expect((await cls(0)).unknown, '没读过灰字').toBe(true);
  await page.locator('#tbNext').click();            // 点：+1 但不变黑
  expect((await cls(0)).unknown, '点了没播完还是灰').toBe(true);
  expect((await cls(0)).known, '点了没播完不许黑').toBe(false);
  await fireStaleSpeak(page);                       // 播完
  expect((await cls(0)).known, '播完才黑').toBe(true);
});

test('读完一轮可开新轮：颜色全灰，轮次+1', async ({ page }) => {
  await stubData2(page, TWO);
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
  await page.goto(`${rootUrl}/app/index.html#/home`);
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
