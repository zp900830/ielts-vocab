// 2026-09-24/25 用户新需求：「在文章内使用与文章等宽的横线标记出今天任务的起始区间
// （首句前、尾句后）」，把「今天要读的这一段」框出来。
//
// 口径（与实现一一对应，不许各算一套）：
//  · 区间 = 今天的队列（todayQueue，来自 todayPlan().queue —— 就是任务条给句子染
//    task-new/task-review/task-done 的同一份数组；任务条辅行「今天 N/M 句」与首页横幅
//    的计数也派生自同一份 todayPlan/todayProgress）。
//  · 位置的边界取舍：某一条边正好是文章的第 1 句 / 最后一句时，那一条线不画 ——
//    线的意义是「把今天这段与上下隔开」，顶端/底端没有可隔的东西，画了反而突兀；
//    因此「全篇即区间」时不画线（下面有一条锁专门钉这个）。
//  · 宽度 = 与 .reader-head / .layout 内容框同一口径（min(1084px, 100% − 36px)），±2px。
//  · 无计划 / 自由跟读 / 已收工：不画线。
//
// 反向验证：把 app/index.html 的改动 stash 掉后，本文件除「结构不受损」外的锁必须红
//（它们钉的是新节点 new-behavior；结构锁钉的是既有正文结构，不依赖新节点）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  exitTaskMode(): void;
  openArticle(a: number, opts?: Record<string, unknown>): void;
  queue: { i: number }[];
  todayProgress(): { done: number; planned: number; left: number };
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
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

/* 第 0 篇 40 句，每句一个独立目标词；其余 5 篇各 2 句。
   15 分钟 → 900s ÷ 25s/句 = 36 句，装不满 40 句 → 今天是文章的前缀，能同时看到两条线。
   夹具里 paraZh/sentZh 都非空，锁「横线不许吃掉词卡行/段意」。 */
function rangeFixture(): Record<string, string> {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${ai}_${i}:w${ai}_${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: ['这一段的意思。'],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 40 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
}

/* 第 0 篇只有 8 句、15 分钟装得下全部 → 今天区间 = 全篇。 */
function fullArticleFixture(): Record<string, string> {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${ai}_${i}:w${ai}_${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: ['这一段的意思。'],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
}

/* 建计划（8 分钟，够把 40 句里的前 19 句排进去），并先「读过第 0 句」——
   第 0 句的词今天已见 → assemble 不再排它 → 今天区间从第 1 句开始，
   两边都不贴文章边界，两条线都该出现。 */
async function enterRangeArticle(page: import('@playwright/test').Page) {
  await stubData(page, rangeFixture());
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(8); TASK.readDone(0); });
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
}

test.describe('文章内「今天任务区间」横线', () => {
  test('首句前 / 尾句后各一条，且锚在队列端点上（断言序号与文本，不只数线条）', async ({ page }) => {
    await enterRangeArticle(page);

    const q = await page.evaluate(() => TASK.queue.map((x) => x.i));
    const total = await page.evaluate(() => document.querySelectorAll('#art .sent').length);
    expect(q.length, '队列要有内容').toBeGreaterThan(2);
    expect(total, '夹具第 0 篇 40 句').toBe(40);
    const first = q[0];
    const last = q[q.length - 1];
    // 夹具前置条件：两条边都不贴文章边界，这样两条线都该被画出来
    expect(first, '区间首句不是文章第 1 句').toBeGreaterThan(0);
    expect(last, '区间尾句不是文章最后一句').toBeLessThan(total - 1);

    const startLine = page.locator('.today-range-line[data-edge="start"]');
    const endLine = page.locator('.today-range-line[data-edge="end"]');
    await expect(startLine).toHaveCount(1);
    await expect(endLine).toHaveCount(1);

    // 序号锚点：线自己记着它标的是哪个全局句号
    expect(await startLine.getAttribute('data-gi')).toBe(String(first));
    expect(await endLine.getAttribute('data-gi')).toBe(String(last));

    // 文本锚点：首句线紧跟的那句，就是队列首句（article 0，local == global）
    await expect(page.locator('#art .sent').nth(first)).toContainText(`Sentence ${first} about`);
    const startAdjacent = await startLine.evaluate((el, gi) => {
      return el.nextElementSibling === document.querySelectorAll('#art .sent')[gi];
    }, first);
    expect(startAdjacent, '首句线必须紧贴在队列首句之前').toBe(true);

    // 尾句线必须接在队列尾句（及其译文块）之后
    await expect(page.locator('#art .sent').nth(last)).toContainText(`Sentence ${last} about`);
    const endAdjacent = await endLine.evaluate((el, gi) => {
      let n: Element | null = document.querySelectorAll('#art .sent')[gi];
      while (n && n.nextElementSibling && n.nextElementSibling !== el) {
        const c = n.nextElementSibling.classList;
        if (!c.contains('sent-zh') && !c.contains('notebar')) return false;
        n = n.nextElementSibling;
      }
      return !!n && n.nextElementSibling === el;
    }, last);
    expect(endAdjacent, '尾句线必须接在队列尾句之后').toBe(true);
  });

  test('横线与正文内容框等宽、左右边缘对齐（±2px）', async ({ page }) => {
    await enterRangeArticle(page);
    await expect(page.locator('.today-range-line').first()).toBeVisible();

    const m = await page.evaluate(() => {
      const line = document.querySelector('.today-range-line') as HTMLElement;
      const lr = line.getBoundingClientRect();
      const lay = document.querySelector('.layout') as HTMLElement;
      const ls = getComputedStyle(lay);
      const box = lay.getBoundingClientRect();
      return {
        lineL: lr.left, lineR: lr.right, lineW: lr.width,
        contentL: box.left + parseFloat(ls.paddingLeft),
        contentR: box.right - parseFloat(ls.paddingRight),
      };
    });
    expect(Math.abs(m.lineL - m.contentL), '左缘').toBeLessThan(2);
    expect(Math.abs(m.lineR - m.contentR), '右缘').toBeLessThan(2);
    expect(Math.abs(m.lineW - (m.contentR - m.contentL)), '线宽 = 内容框宽').toBeLessThan(2);
  });

  test('无计划 / 自由跟读：一条线也不画', async ({ page }) => {
    await stubData(page, rangeFixture());
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await expect(page.locator('.art-card')).toHaveCount(6);
    await page.evaluate(() => TASK.resetV2());   // 清掉计划 = 自由跟读
    await page.reload();
    await expect(page.locator('.art-card')).toHaveCount(6);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await expect(page.locator('.today-range-line')).toHaveCount(0);
  });

  test('区间变化后线跟着走，且不残留旧线', async ({ page }) => {
    await enterRangeArticle(page);
    const before = await page.evaluate(() => {
      const q = TASK.queue.map((x) => x.i);
      return { first: q[0], last: q[q.length - 1] };
    });

    // 多读一句（真记一条接触）→ 这个词今天已见 → 再进这一篇，队列重新装配后区间整体后移
    await page.evaluate(() => TASK.exitTaskMode());
    await page.evaluate((gi) => TASK.readDone(gi), before.first);
    await page.evaluate(() => TASK.openArticle(0));
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    const after = await page.evaluate(() => {
      const q = TASK.queue.map((x) => x.i);
      return { first: q[0], last: q[q.length - 1] };
    });
    expect(after.first, '读掉首句后区间起点后移').toBeGreaterThan(before.first);
    expect(after.last, '区间终点随之后移').toBeGreaterThan(before.last);

    const gis = await page.$$eval('.today-range-line', (els) =>
      els.map((e) => (e as HTMLElement).dataset.gi));
    const edges = await page.$$eval('.today-range-line', (els) =>
      els.map((e) => (e as HTMLElement).dataset.edge));
    expect(gis).toContain(String(after.first));
    expect(gis).toContain(String(after.last));
    // 旧边界不残留
    expect(gis).not.toContain(String(before.first));
    expect(gis).not.toContain(String(before.last));
    expect(edges.sort()).toEqual(['end', 'start']);
  });

  test('装饰性：aria-hidden，不在无障碍树里', async ({ page }) => {
    await enterRangeArticle(page);
    const lines = page.locator('.today-range-line');
    await expect(lines).toHaveCount(2);
    for (let i = 0; i < 2; i++) {
      await expect(lines.nth(i)).toHaveAttribute('aria-hidden', 'true');
      expect(await lines.nth(i).getAttribute('role'), '装饰线不该有 role').toBeNull();
      expect(await lines.nth(i).evaluate((el) => (el as HTMLElement).tabIndex), '不可聚焦').toBe(-1);
    }
  });

  test('深色模式：横线用深色令牌，仍然可见', async ({ page }) => {
    await enterRangeArticle(page);
    const line = page.locator('.today-range-line').first();
    await expect(line).toBeVisible();
    const light = await line.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await line.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dark, '深色下横线底色必须换到深色令牌').not.toBe(light);
    await expect(line).toBeVisible();
  });

  test('全篇即区间：两条边都贴文章边界 → 不画线（避免顶端/底端突兀）', async ({ page }) => {
    await stubData(page, fullArticleFixture());
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitAppReady(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    const info = await page.evaluate(() => {
      const q = TASK.queue.map((x) => x.i);
      const n = document.querySelectorAll('#art .sent').length;
      return { first: q[0], last: q[q.length - 1], qn: q.length, n };
    });
    expect(info.qn, '15 分钟要装得下这 8 句').toBe(info.n);
    expect(info.first, '区间首句就是文章第 1 句').toBe(0);
    expect(info.last, '区间尾句就是文章最后一句').toBe(info.n - 1);
    await expect(page.locator('.today-range-line')).toHaveCount(0);
  });

  test('不破坏正文结构：句子 / 译文 / 段意数量不变', async ({ page }) => {
    await enterRangeArticle(page);
    const counts = await page.evaluate(() => ({
      sent: document.querySelectorAll('#art .sent').length,
      zh: document.querySelectorAll('#art .sent-zh').length,
      paraZh: document.querySelectorAll('#art .para-zh').length,
    }));
    expect(counts.sent, '任务模式只渲当前这一篇：40 句').toBe(40);
    expect(counts.zh, '每句一条译文').toBe(40);
    expect(counts.paraZh, '这一篇一段段意').toBe(1);
  });
});
