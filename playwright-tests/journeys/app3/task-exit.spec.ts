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
