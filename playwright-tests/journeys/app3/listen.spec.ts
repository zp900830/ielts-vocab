// 3.0 M4：随身听（PRD §7）。服务器归 global-setup.ts 起停（仓库根 8932）：
// /app/ 在仓库根，和 shell/home/stats/words 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  state(): { daily: Record<string, unknown>; words: Record<string, unknown>; sents: Record<number, { lastReadAt: number }> };
  listenState(): { a: number; idx: number; total: number; playing: boolean; loop: number; rate: number; expanded: boolean; text: string };
  listenArticle: number | null;
  listenStat(): { totalSents: number; totalMs: number; byArticle: Record<string, number>; last: Record<string, number> };
  listenLast(a: number): number;
  listenOpen(a: number): void;
  listenExpand(): void;
  listenCollapse(): void;
  listenSeek(local: number): void;
  listenSetTickForTest(ts: number): void;
  repsOf(a: number): number;
  article: number | null;
};
declare const ShadowPlan: { articleScope(sections: unknown, a: number): Set<number>; newWord(): Record<string, unknown>; dayKey(ts: number, b: number): string; DAY_MS: number };
declare const SECTIONS: Array<{ title: string; subheads: string[] }>;
declare const APP3: { route(): void; articleStat(a: number): { progress: number; lastAt: number; ever: number; total: number }; renderListen?: unknown };
declare const dataReady: boolean;

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 两篇小课文：篇 0 = 4 句，篇 1 = 2 句；句号全局连续（0–3 / 4–5）。 */
const TWO: Record<string, string> = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const sections = [
    mk('地球与生命', ['The [[atmosphere:atmosphere]] protects life.', 'We need [[oxygen:oxygen]] to live.',
      'The [[atmosphere:atmosphere]] keeps us warm.', 'Plants give us [[oxygen:oxygen]].']),
    mk('校园与文化', ['A [[library:library]] is quiet.', 'The [[library:library]] opens late.']),
  ];
  const vocab = { atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' }, library: { m: 'n. 图书馆' } };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 把朗读引擎换成录音笔：__cbs 记交给引擎的回调，__finish() 手动兑现「这句播完了」。
   headless 里 speechSynthesis 不发声（和 task.spec.ts 同一套 stub）。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

async function gotoListen(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderListen?: unknown } };
    const v = document.getElementById('appView');
    return !!(w.APP3 && typeof w.APP3.renderListen === 'function' && v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
}

test.describe('3.0 随身听（M4，PRD §7）', () => {
  test('播放卡片默认态：篇名/卷名/位置 + ◄ ▶⏸ ► + 位置条；且能起播', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);

    // 默认篇 = 最近在学的那篇（无历史 → 第 1 篇）
    await expect(page.locator('.listen-page > h1')).toHaveText('随身听');
    await expect(page.locator('.ls-art')).toContainText('地球与生命');
    await expect(page.locator('.ls-vol')).toContainText('第 1 卷');
    await expect(page.locator('.ls-info')).toContainText('第 1 / 4 句');
    await expect(page.locator('.ls-info')).toContainText('还剩 3 句');
    for (const sel of ['.ls-prev', '.ls-play', '.ls-next', '.ls-expand']) {
      await expect(page.locator(sel)).toBeVisible();
    }
    await expect(page.locator('.ls-seek')).toHaveAttribute('max', '4');

    // 起播：点 ▶ → playing 变 true（同一套播放链）
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await expect(page.locator('.ls-play')).toHaveAttribute('aria-label', '暂停');
  });

  test('点卡片展开全屏阅读：正文 + 播放条现身；关闭收回卡片（不是回首页）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);

    await page.locator('.ls-cover').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(page.locator('#art')).toBeVisible();
    await expect(page.locator('#art .sent').first()).toBeVisible();
    await expect(page.locator('#audiobar')).toBeVisible();
    // 展开即起播：当前句高亮
    await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
    await expect(page.locator('#art .sent.playing')).toHaveCount(1);

    // 关闭 → 收回卡片，仍在 #/listen
    await page.locator('#lsClose').click();
    await expect(page.locator('body')).not.toHaveClass(/listen-mode/);
    await expect(page).toHaveURL(/#\/listen/);
    await expect(page.locator('.ls-card')).toBeVisible();
  });

  test('连续播放会推进：兑现一句 → 自动进下一句（不用手点）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(0);
    await finishSpeak(page);
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx), '连播要自动推进').toBe(1);
    await expect(page.locator('.ls-info')).toContainText('第 2 / 4 句');
  });

  test('篇末自动切下一篇（六篇循环）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await installSpeakStub(page);
    // 直接跳到本片末句（第 4 句）再放完 → 应自动切到第 2 篇
    await page.evaluate(() => TASK.listenSeek(3));
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(3);
    await finishSpeak(page);
    await expect.poll(() => page.evaluate(() => TASK.listenState().a), '篇末要切下一篇').toBe(1);
    await expect.poll(() => page.evaluate(() => TASK.listenState().idx)).toBe(0);
    await expect(page.locator('.ls-art')).toContainText('校园与文化');
  });

  /* §7.6 核心锁：听一段后——精读次数/熟练度一个字不许动，收听账要动。
     夹具特意让「听的那几句」是**还没精读过的**句子：若收听误走了 contact（onSentenceComplete），
     everRead/progress 会被抬起来，这条立刻红。 */
  test('§7.6 分开记账：收听不改精读句数/熟练度，只改收听数据', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.evaluate(() => TASK.listenOpen(0));
    const before = await page.evaluate(() => ({
      reps: TASK.repsOf(0), prog: APP3.articleStat(0).progress, ever: APP3.articleStat(0).ever,
      sentDone: (TASK.state().daily as Record<string, { sentDone?: number }>)[ShadowPlan.dayKey(Date.now(), 4)]?.sentDone || 0,
      listen: TASK.listenStat().totalSents,
    }));
    expect(before.ever, '基线：这一篇还没精读过').toBe(0);
    expect(before.listen).toBe(0);

    // 听 3 句（stub 兑现完播）
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    for (let k = 0; k < 3; k++) {
      await page.evaluate(() => TASK.listenSetTickForTest(Date.now() - 90000));  // 每句前拨慢 90s → 3 句 ≈ 4.5 分钟
      await finishSpeak(page);
    }
    const after = await page.evaluate(() => ({
      reps: TASK.repsOf(0), prog: APP3.articleStat(0).progress, ever: APP3.articleStat(0).ever,
      sentDone: (TASK.state().daily as Record<string, { sentDone?: number }>)[ShadowPlan.dayKey(Date.now(), 4)]?.sentDone || 0,
      stat: TASK.listenStat(),
    }));
    // 精读口径：一个字不动
    expect(after.reps, '精读次数不许被收听刷').toBe(before.reps);
    expect(after.prog, '熟练度不许被收听刷').toBe(before.prog);
    expect(after.ever, '通读句数不许被收听刷').toBe(before.ever);
    expect(after.sentDone, '日账 sentDone 不许被收听刷').toBe(before.sentDone);
    // 收听账：动了
    expect(after.stat.totalSents, '收听句数要动').toBeGreaterThanOrEqual(3);
    expect(after.stat.totalMs, '收听时长要动').toBeGreaterThan(0);
    expect(after.stat.last[0], '最近收听要更新').toBeGreaterThan(0);
  });

  test('学习数据页随身听块读到的是真收听数据（不是占位）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await installSpeakStub(page);
    await page.locator('.ls-play').click();
    await page.evaluate(() => TASK.listenSetTickForTest(Date.now() - 60000));
    await finishSpeak(page);
    const want = await page.evaluate(() => Math.round(TASK.listenStat().totalMs / 60000));
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await waitShadowReady(page);
    await page.waitForFunction(() => {
      const v = document.getElementById('appView');
      return !!(v && v.querySelector('.st-block[data-block="listen"]'));
    });
    await expect(page.locator('.st-empty[data-empty="listen"]'), '空态占位必须已被真数据取代').toHaveCount(0);
    await expect(page.locator('.st-block[data-block="listen"] .st-num[data-k="listen-min"] b')).toHaveText(String(want));
    await expect(page.locator('.st-block[data-block="listen"] .st-num[data-k="listen-sents"] b')).not.toHaveText('0');
  });

  test('§7.5 首页联动：默认播「最近在学的那篇」；听过之后首页卡片「最近学习」跟着更新', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await installSpeakStub(page);
    // 只听第 1 篇（第 0 篇完全没动）→ 第 1 篇成为「最近在学的那篇」
    await page.evaluate(() => TASK.listenOpen(1));
    await page.locator('.ls-play').click();
    await finishSpeak(page);

    // 首页：第 1 篇卡片「最近学习」应显示「今天」（读数 = max(精读 lastReadAt, 收听 last)）
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitShadowReady(page);
    await expect(page.locator('.art-card[data-a="1"]')).toContainText('今天');
    await expect(page.locator('.art-card[data-a="0"]')).toContainText('还没学过');

    // 回随身听（刷新 → 默认篇按「最近在学」现算，不是沿用上一趟的 _listenArticle）
    await page.goto(`${rootUrl}/app/index.html#/listen`);
    await waitShadowReady(page);
    await page.reload();
    await waitShadowReady(page);
    await page.waitForFunction(() => !!document.querySelector('.ls-art'));
    await expect(page.locator('.ls-art')).toContainText('校园与文化');
  });
});
