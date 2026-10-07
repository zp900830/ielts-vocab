// 触区回归锁 · app 单站（docs/2026-10-07-app站点一致性排查报告.md C1/C5/C6/C8）
// 口径（与 index.html 191 行那段一致）：视觉盒子允许小于 44，但 **盒子 + ::after 外扩**之后的
// 有效触区必须 ≥44×44。所以这里量的不是 getBoundingClientRect 本身，而是它加上计算样式里
// ::after 的 inset —— 与 a11y.spec 那条同口径，但补上它覆盖不到的三场：
//   C1 自由播放态那排播放键（旧版这条是 display:none，整排实测 30 高、最窄 29.4 宽）
//   C5/C6 两枚收起键与右上角 FAB（同排一颗 44 一颗 30）
//   C8 弹窗里的通用文字键 .btn（既没进 194 的批量清扫，也没人逐个补）
//
// 数值都是 2026-10-07 在 390×844 上实测的：#rateCycle 盒 29.4×30 → 外扩 -7/-8 才刚好过线；
// #lcFab 盒 132.5×33；.ls-collapse 盒 57.7×30。反面验证：把 .audiobar .btn::after 改回
// display:none，第一条必须红。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void; initPlan(minutes: number): void;
  listenOpen(a: number): void; listenExpand(): void; openStartPicker(): void; closeStartPicker(): void;
};
declare const APP3: { setLcDrawer(on: boolean, o?: { focus?: boolean }): void };

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 两篇小课文：篇 0 = 4 句，每句都带目标词（保证 FAB 与抽屉有东西可开）。 */
const TWO: Record<string, string> = (() => {
  const lines = [
    'The [[atmosphere:atmosphere]] protects life.',
    'We need [[oxygen:oxygen]] to live.',
    'The [[atmosphere:atmosphere]] keeps us warm.',
    'Plants give us [[oxygen:oxygen]].',
  ];
  const mk = (title: string, ls: string[]) => ({
    title, zh: title, subheads: ['第一卷'], paragraphs: [ls],
    sentZh: ls.map((_, i) => `第 ${i + 1} 句译文。`), paraZh: [''],
  });
  const sections = [mk('地球与生命', lines), mk('校园与文化', ['A [[library:library]] is quiet.', 'The [[library:library]] opens late.'])];
  const vocab = { atmosphere: { m: 'n. 大气' }, oxygen: { m: 'n. 氧气' }, library: { m: 'n. 图书馆' } };
  return { 'sections.json': JSON.stringify(sections), 'vocab.json': JSON.stringify(vocab), 'chapters.json': '[]' };
})();

async function stubData(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(TWO)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });

async function bootMobile(page: import('@playwright/test').Page, hash: string) {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 390, height: 844 });
  await stubData(page);
  await page.goto(`${rootUrl}/app/index.html${hash}`);
  await waitShadowReady(page);
}

/* 有效触区 = 盒子 + ::after 外扩；没有热区的元素就按盒子本身算（.ls-expand / <select> 是实高 44）。
   ⚠️ 不能顺手判 ::after 的 visibility —— 抽屉/迷你条的显隐是 `visibility 0s .28s` 过渡，
   刚加完 .open 的那一刻计算值还是 hidden，会把热区读成 0（量出来就是 30 高的假红）。
   与 a11y.spec 那条同口径：只看 content / display。 */
async function hit(page: import('@playwright/test').Page, sel: string) {
  return page.locator(sel).first().evaluate((el) => {
    const b = (el as HTMLElement).getBoundingClientRect();
    const a = getComputedStyle(el, '::after');
    let w = b.width, h = b.height;
    if (a.content !== 'none' && a.display !== 'none') {
      const parts = (a.inset || '0px').split(/\s+/).map((x) => Math.abs(parseFloat(x) || 0));
      const tb = parts[0] || 0;
      const lr = parts.length > 1 ? parts[1] : tb;
      w += 2 * lr; h += 2 * tb;
    }
    return { w: Math.round(w), h: Math.round(h) };
  });
}

async function expectHit(page: import('@playwright/test').Page, sel: string) {
  const m = await hit(page, sel);
  expect(m.w, `${sel} 有效触区宽`).toBeGreaterThanOrEqual(44);
  expect(m.h, `${sel} 有效触区高`).toBeGreaterThanOrEqual(44);
}

test.describe('C1 · 播放条那排键：换壳不换触区', () => {
  test('自由播放态（播放条挂在 body 下，不在 .tb-play 里）整排 ≥44', async ({ page }) => {
    await bootMobile(page, '#/listen');
    await page.evaluate(() => TASK.listenOpen(0));
    await page.evaluate(() => TASK.listenExpand());
    await expect(page.locator('body'), '展开全文阅读 = listen-mode').toHaveClass(/listen-mode/);
    const bar = page.locator('body > #audiobar');
    await expect(bar, '这一态播放条没被搬进任务条').toBeVisible();

    for (const sel of ['#btnPlay', '#btnStop', '#btnLoop', '#btnAB', '#rateCycle', '#markBtn']) {
      await expect(bar.locator(sel), `${sel} 在播放条里`).toBeVisible();
      await expectHit(page, `body > #audiobar ${sel}`);
    }
  });

  test('同一排键 dock 进任务条后仍 ≥44（走它自己那条 -5px 热区）', async ({ page }) => {
    await bootMobile(page, '#/home');
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    const dock = page.locator('.task-bar .tb-play');
    await expect(dock, '进任务模式后播放控件整排搬进任务条').toBeVisible();
    for (const sel of ['#btnLoop', '#btnAB', '#rateCycle', '#markBtn']) {
      await expectHit(page, `.task-bar .tb-play ${sel}`);
    }
    /* 超窄屏（≤360）那一档只收横向：以前连 min-height 一起压到 28，会把 -7px 热区削成 42。 */
    await page.setViewportSize({ width: 320, height: 700 });
    await expect(page.locator('.task-bar .tb-play'), '320 宽下播放排还在任务条里').toBeVisible();
    await expectHit(page, '.task-bar .tb-play #btnLoop');
  });
});

test.describe('C5/C6 · 同排不许一颗 44 一颗 30', () => {
  test('展开态收起键 ≥44（与它同排的键都是 44 档）', async ({ page }) => {
    await bootMobile(page, '#/listen');
    await page.evaluate(() => TASK.listenOpen(0));
    await page.evaluate(() => TASK.listenExpand());
    await expectHit(page, '#lsClose');
  });

  test('抽屉收起键 ≥44（与展开态那颗共用 .ls-collapse，热区一起补）', async ({ page }) => {
    await bootMobile(page, '#/listen');
    await page.evaluate(() => TASK.listenOpen(0));
    await page.evaluate(() => TASK.listenExpand());
    await page.evaluate(() => APP3.setLcDrawer(true, { focus: false }));
    await expect(page.locator('#lcDrawer')).toHaveClass(/open/);
    await expectHit(page, '#lcClose');
  });

  test('未展开态：FAB（进抽屉唯一入口）与展开键同档', async ({ page }) => {
    await bootMobile(page, '#/listen');
    await page.evaluate(() => TASK.listenOpen(0));
    const fab = page.locator('#lcFab');
    await expect(fab, '当前句有目标词 → FAB 出现').toBeVisible();
    await expectHit(page, '#lcFab');
    await expectHit(page, '.ls-expand');
    await expectHit(page, '#lcMini .mb-play');
    await expectHit(page, '#lcMini .mb-prev');
    await expectHit(page, '#lcMini .mb-next');
  });
});

test.describe('C8 · 弹窗里的通用文字键（两条路都没走的那批）', () => {
  test('今日任务起点弹窗：三颗文字键 + 两颗点选框 ≥44', async ({ page }) => {
    await bootMobile(page, '#/home');
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.locator('.art-card .a-open').first().click();
    await page.evaluate(() => TASK.openStartPicker());
    await expect(page.locator('#startPickPop')).toBeVisible();
    for (const sel of ['#spArt', '#spSent', '#startPickPop .sp-actions .btn']) {
      await expectHit(page, sel);
    }
    await page.evaluate(() => TASK.closeStartPicker());
  });
});
