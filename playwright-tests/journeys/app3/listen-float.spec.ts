// 3.0 随身听悬浮球（切 tab 续播）：照搬主站 index.html 那套 #lsFab 的完整出现/消失/点击交互。
// 服务器归 global-setup.ts 起停（仓库根 8932）：/app/ 在仓库根，和 shell/home/stats/words 一样
// 用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  listenState(): { a: number; idx: number; total: number; playing: boolean; expanded: boolean; ctx: boolean; text: string };
  listenLeave(): void;
  listenMiniStop(): void;
};
declare const SECTIONS: Array<{ title: string }>;

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

/* 把朗读引擎换成录音笔：__cbs 记交给引擎的回调，__finish() 手动兑现「这句播完了」。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}

async function gotoListen(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/listen`);
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderListen?: unknown } };
    const v = document.getElementById('appView');
    return !!(w.APP3 && typeof w.APP3.renderListen === 'function' && v && v.querySelector('.listen-page'));
  }, undefined, { timeout: 20000 });
}

/* 在随身听卡片上起播（stub 引擎，playing=true 但不会自己推进）。 */
async function startListening(page: import('@playwright/test').Page) {
  await installSpeakStub(page);
  await page.locator('.ls-play').click();
  await expect.poll(() => page.evaluate(() => TASK.listenState().playing)).toBe(true);
}

const fab = (page: import('@playwright/test').Page) => page.locator('#lsMini');
const playing = (page: import('@playwright/test').Page) => page.evaluate(() => TASK.listenState().playing);

/* 悬浮球出现有一段 .3s 的 translateY+scale 过渡；几何/触摸目标要在过渡结束后量，
   否则会量到 scale(.92) 的中间态（首版就在这儿量到 42.27px 而误报）。 */
async function fabSettled(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    const el = document.getElementById('lsMini');
    if (!el || !el.classList.contains('on')) return false;
    const t = getComputedStyle(el).transform;
    return t === 'none' || /^matrix\(1, 0, 0, 1, 0, 0\)$/.test(t);
  });
}

async function switchTo(page: import('@playwright/test').Page, route: string) {
  await page.locator(`.sidenav .nav-item[data-route="${route}"]`).click();
  await expect(page).toHaveURL(new RegExp(`#/${route}`));
}

test.describe('3.0 随身听悬浮球（切 tab 续播）', () => {
  /* ---------- 出现 ---------- */

  test('播放中切 tab：悬浮球出现，播放不中断（主站 #lsFab 的核心行为）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    // 卡片页不显示悬浮球（卡片本身就是控制面，2026-09-25 用户再确认）；球只在别的页出现
    await expect(fab(page), '随身听卡片页不出现悬浮球').toBeHidden();

    await switchTo(page, 'home');
    await expect(fab(page), '切走后应出现悬浮球').toBeVisible();
    await expect.poll(() => playing(page), '切走后音频必须继续').toBe(true);
    await expect(page.locator('#lsMiniPlay')).toHaveAttribute('aria-label', '暂停');
  });

  test('暂停后切 tab：悬浮球仍出现，且显示「播放」态（主站 playing||paused）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await page.locator('.ls-play').click();          // 暂停
    await expect.poll(() => playing(page)).toBe(false);

    await switchTo(page, 'words');
    await expect(fab(page), '暂停态切走也要出现悬浮球').toBeVisible();
    await expect(page.locator('#lsMiniPlay')).toHaveAttribute('aria-label', '播放');
  });

  /* ---------- 点击 ---------- */

  test('点悬浮球封面：回到随身听页，且还在播（用户点名的那条）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();

    await page.locator('#lsMiniCover').click();
    await expect(page).toHaveURL(/#\/listen/);
    await expect(page.locator('.ls-card')).toBeVisible();
    await expect.poll(() => playing(page), '回随身听页后仍要播着').toBe(true);
    // 卡片页不显示球（卡片就是控制面）：回到随身听页球收起，但播放继续
    await expect(fab(page), '回到随身听页后悬浮球收起').toBeHidden();
  });

  test('点悬浮球暂停/继续按钮：就地切播放态，悬浮球不消失', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await switchTo(page, 'stats');

    await page.locator('#lsMiniPlay').click();
    await expect.poll(() => playing(page)).toBe(false);
    await expect(fab(page)).toBeVisible();
    await expect(page.locator('#lsMiniPlay')).toHaveAttribute('aria-label', '播放');

    await page.locator('#lsMiniPlay').click();
    await expect.poll(() => playing(page)).toBe(true);
    await expect(page.locator('#lsMiniPlay')).toHaveAttribute('aria-label', '暂停');
  });

  test('点悬浮球停止按钮：播放停止，悬浮球消失', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();

    await page.locator('#lsMiniStop').click();
    await expect(fab(page), '停止后悬浮球必须消失').toBeHidden();
    await expect.poll(() => playing(page)).toBe(false);
    await expect.poll(() => page.evaluate(() => TASK.listenState().ctx)).toBe(false);
  });

  /* ---------- 消失 ---------- */

  test('停在随身听页：#/listen 上不出现悬浮球（卡片就是控制面）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await expect(fab(page), '卡片页不出现球（卡片是控制面）').toBeHidden();
    // 反复切走再回来：别的页有球，回卡片页球收起，播放始终不断
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();
    await page.locator('.sidenav .nav-item[data-route="listen"]').click();
    await expect(page).toHaveURL(/#\/listen/);
    await expect(fab(page)).toBeHidden();
    await expect.poll(() => playing(page), '回卡片页播放仍继续').toBe(true);
  });

  test('展开全屏（listen-mode）：不出现悬浮球', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await page.locator('.ls-cover').click();
    await expect(page.locator('body')).toHaveClass(/listen-mode/);
    await expect(fab(page)).toBeHidden();
  });

  test('进入任务模式（阅读页等价物）：随身听停掉，悬浮球消失', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();

    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(fab(page), '任务模式里不许挂悬浮球').toBeHidden();
    await expect.poll(() => playing(page)).toBe(false);
    await expect.poll(() => page.evaluate(() => TASK.listenState().ctx)).toBe(false);
  });

  test('从未起播就切走：不出现悬浮球', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeHidden();
  });

  /* ---------- 层级 / 几何 / 深色 / a11y ---------- */

  /* refine3 ⑤：一级页面底部续读条已删，悬浮球现在只需让开底部 TabBar（任务模式里本就不挂球）。 */
  test('移动端：悬浮球在 TabBar 之上，互不压住；一级页面不再有任务条；触摸目标 ≥44px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubData(page, TWO);
    await gotoListen(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();
    await expect(page.locator('#taskBar'), '一级页面不再挂续读条/任务条').not.toHaveClass(/show/);
    await fabSettled(page);

    const geo = await page.evaluate(() => {
      const f = document.getElementById('lsMini')!.getBoundingClientRect();
      const nav = document.querySelector('.sidenav')!.getBoundingClientRect();
      return { fBottom: f.bottom, navTop: nav.top };
    });
    expect(geo.fBottom, `悬浮球底 ${geo.fBottom} 不许压住底部 TabBar 顶 ${geo.navTop}`)
      .toBeLessThanOrEqual(geo.navTop + 0.5);

    for (const sel of ['#lsMiniPlay', '#lsMiniStop', '#lsMiniCover']) {
      const h = await page.locator(sel).evaluate((el) => el.getBoundingClientRect().height);
      expect(h, `${sel} 触摸目标 ≥44px`).toBeGreaterThanOrEqual(44);
    }
  });

  test('深色模式：悬浮球不是浅色白玻璃（PRD §10.1）', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();
    const light = await fab(page).evaluate((el) => getComputedStyle(el).backgroundImage + '|' + getComputedStyle(el).borderTopColor);
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await fab(page).evaluate((el) => getComputedStyle(el).backgroundImage + '|' + getComputedStyle(el).borderTopColor);
    expect(dark, '深色下悬浮球的背景/描边必须换成深色 token').not.toBe(light);
    expect(dark, '深色下不许仍是白玻璃（rgba(255,255,255,.8)）').not.toContain('255, 255, 255, 0.8');
  });

  test('无障碍：悬浮球是真按钮、可聚焦、有可读标签', async ({ page }) => {
    await stubData(page, TWO);
    await gotoListen(page);
    await startListening(page);
    await switchTo(page, 'home');
    await expect(fab(page)).toBeVisible();
    for (const sel of ['#lsMiniPlay', '#lsMiniStop', '#lsMiniCover']) {
      expect(await page.locator(sel).evaluate((el) => el.tagName), `${sel} 应是 button`).toBe('BUTTON');
      await expect(page.locator(sel)).toHaveAttribute('aria-label', /./);
    }
    await page.locator('#lsMiniCover').focus();
    expect(await page.evaluate(() => document.activeElement === document.getElementById('lsMiniCover'))).toBe(true);
  });
});
