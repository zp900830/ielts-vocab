// playwright-tests/journeys/app3/word-bank-tabs.spec.ts
// 词库面板双视图（2026-10-10 用户：把 1.0 的「目标词速查」侧栏放回来——收进现有词库面板做 tab）：
//   'cur' = 本篇目标词（数据源 SECTIONS[cur].words，与正文 .w 高亮同源）；'all' = 六篇全量（chapters.json 分组）。
// currentChapter=-1（全部文章）时 'cur' 自动降级为全库。选择记忆在 localStorage['ielts-wq-view']；
// 面板开着切篇由 onChapterChange 侧即时刷新列表，📖（不在本篇正文）标记随切篇重建。
// 入口：#edgeTab 把手——3.0 外壳曾把它全局 display:none（词库面板桌面零入口），本轮在任务模式恢复。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
};
declare const onChapterChange: (val: string | number, fromTask?: boolean) => void;

const rootUrl = process.env.E2E_ROOT_URL || '';

const PAYLOAD = (() => {
  const mk = (title: string, lines: string[], words: string[]) => ({
    title, zh: title, subheads: ['第一卷'],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
    words,
  });
  const sections = [
    mk('地球与生命', [
      'The [[atmosphere:atmosphere]] protects life.',
      'We need [[oxygen:oxygen]] to live.',
    ], ['atmosphere', 'oxygen', 'crust']),
    mk('校园与文化', [
      'Students [[library:library]] read books.',
      'The [[liberty:liberty]] matters.',
    ], ['library', 'liberty', 'lecture']),
  ];
  const vocab = {
    atmosphere: { p: 'ˈætməsfɪr', m: 'n. 大气；气氛；氛围', ex: 'The meeting was held in a relaxed atmosphere.', exZh: '会议在轻松的气氛中举行。' },
    oxygen: { m: 'n. 氧气' },
    crust: { m: 'n. 地壳' },
    library: { m: 'n. 图书馆' },
    liberty: { m: 'n. 自由' },
    lecture: { m: 'n. 讲座' },
  };
  const chapters = [
    { title: 'Chapter 1 · Earth and Life', words: ['atmosphere', 'oxygen', 'crust'] },
    { title: 'Chapter 2 · Campus and Culture', words: ['library', 'liberty', 'lecture'] },
  ];
  return {
    'sections.json': JSON.stringify(sections),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': JSON.stringify(chapters),
  };
})();

async function stubData(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(PAYLOAD)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 进任务模式（唯一露出正文与 #edgeTab 把手的视图）→ 点把手开词库面板 */
async function enterReadingAndOpenPanel(page: import('@playwright/test').Page, chapter = 0) {
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.locator('.art-card .a-open').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  if (chapter !== 0) await page.evaluate(() => onChapterChange(chapter));
  await expect(page.locator('#edgeTab'), '任务模式下词库把手可见（3.0 外壳曾藏掉它）').toBeVisible();
  await page.locator('#edgeTab').click();
  await expect(page.locator('#panel')).toBeVisible();
}

test.describe('词库面板双视图（目标词侧栏回归）', () => {
  test('任务模式：把手可见，本篇视图无分组头、卡数对上 SECTIONS[cur].words、不在正文的词带 📖', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    await expect(page.locator('#wqTabCur'), '默认视图 = 本篇目标词').toHaveClass(/on/);
    await expect(page.locator('#vlist .g'), '单篇视图不出现章分组头').toHaveCount(0);
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    await expect(page.locator('#vlist .item').first()).toContainText('atmosphere');
    /* 📖 = 「不在本篇正文」：crust 在本篇词表但正文没有它 */
    await expect(page.locator('#vlist .item[data-k="crust"] .wtop b')).toHaveText(/📖/);
    await expect(page.locator('#vlist .item[data-k="atmosphere"] .wtop b')).not.toHaveText(/📖/);
    await expect(page.locator('#vcnt')).toContainText('3 / 本篇3词');
  });

  test('切「全部词库」：分组头回归；切换结果写 localStorage，切回也记录', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#vlist .item')).toHaveCount(3);

    await page.locator('#wqTabAll').click();
    await expect(page.locator('#wqTabAll')).toHaveClass(/on/);
    await expect(page.locator('#wqTabCur')).not.toHaveClass(/on/);
    await expect(page.locator('#vlist .g')).toHaveCount(2);
    await expect(page.locator('#vcnt')).not.toContainText('本篇');
    expect(await page.evaluate(() => localStorage.getItem('ielts-wq-view'))).toBe('all');

    await page.locator('#wqTabCur').click();
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    expect(await page.evaluate(() => localStorage.getItem('ielts-wq-view'))).toBe('cur');
  });

  test('切篇即时刷新：面板开着从篇 1 切篇 2，列表与 vcnt 跟着新篇走', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#vlist .item').first()).toContainText('atmosphere');

    await page.evaluate(() => onChapterChange(1));
    await expect(page.locator('#vlist .item')).toHaveCount(3);
    await expect(page.locator('#vlist .item').first()).toContainText('library');
    await expect(page.locator('#vlist .item[data-k="lecture"] .wtop b')).toHaveText(/📖/);
    await expect(page.locator('#vcnt')).toContainText('3 / 本篇3词');
  });

  test('刷新还原视图：all 记忆回 all，cur 记忆回 cur', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await page.locator('#wqTabAll').click();
    await expect(page.locator('#wqTabAll')).toHaveClass(/on/);

    await page.reload();
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#wqTabAll'), '刷新后仍是全部词库').toHaveClass(/on/);
    await expect(page.locator('#vlist .g')).toHaveCount(2);

    await page.locator('#wqTabCur').click();
    await page.reload();
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);
    await expect(page.locator('#wqTabCur'), '刷新后回到本篇目标词').toHaveClass(/on/);
  });

  test('手机档（390×844）：两颗 tab 触区 ≥44', async ({ page }) => {
    await stubData(page);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${rootUrl}/index.html#/`);
    await waitShadowReady(page);
    await enterReadingAndOpenPanel(page, 0);

    for (const sel of ['#wqTabCur', '#wqTabAll']) {
      const box = await page.locator(sel).evaluate((el) => {
        const b = (el as HTMLElement).getBoundingClientRect();
        return { w: Math.round(b.width), h: Math.round(b.height) };
      });
      expect(box.w, `${sel} 触区宽`).toBeGreaterThanOrEqual(44);
      expect(box.h, `${sel} 触区高`).toBeGreaterThanOrEqual(44);
    }
  });
});
