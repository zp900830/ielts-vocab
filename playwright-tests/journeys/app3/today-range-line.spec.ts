// 2026-09-24/25 用户新需求：「在文章内使用与文章等宽的横线标记出今天任务的起始区间
// （首句前、尾句后）」，把「今天要读的这一段」框出来。
//
// 口径（与实现一一对应，不许各算一套）：
//  · 区间 = 今天这一段的**固定起止**（plan.todayRange 按天钉，一天各一条）：当天第一次画线时
//    定下（必然早于当天任何阅读 —— 读句必须先进任务模式，进模式就先画一次），之后读句/退出重进/
//    ② 批次重同步都不动它；只有手动调起点、改回自动安排或跨天才改。旧口径「区间 = 实时剩余队列」
//    会被 assemble 跳过已见词带偏（队列首后移 → 开始线跟着漂 +N）；更早的「按篇钉」口径会让
//    每篇各画一条开始线（2026-10-08 用户：「不应该有且仅有一天起始线吗」）。
//  · 位置的边界取舍：开始线一律画（哪怕贴文章第 1 句）—— 它是「点线设起点」的入口，
//    贴边界不画等于入口消失；结束线保留贴文章最后一句不画（顶端/底端没有可隔的东西）。
//  · 宽度 = 与 .reader-head / .layout 内容框同一口径（min(1084px, 100% − 36px)），±2px。
//  · 无计划 / 自由跟读 / 已收工：不画线。
//
// 反向验证：把 index.html 的改动 stash 掉后，本文件除「结构不受损」外的锁必须红
//（它们钉的是新节点 new-behavior；结构锁钉的是既有正文结构，不依赖新节点）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  exitTaskMode(): void;
  openArticle(a: number, opts?: Record<string, unknown>): void;
  openPanel(): void;
  todayPlan(force?: boolean): { queue: { i: number }[] };
  queue: { i: number }[];
  todayProgress(): { done: number; planned: number; left: number };
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
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

/* 六篇各 6 句 = 36 句：11 分钟只排得下前缀（约 26 句），今天这一段横跨第 0～4 篇。
   「每篇各画一条开始线」只有多篇都排到今天的任务时才露馅 —— 唯一性锁必须要这种形状。 */
function spanFixture(): Record<string, string> {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${ai}_${i}:w${ai}_${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: ['这一段的意思。'],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, 6))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
}

/** 停在任务模式里的第 0 篇（跨篇夹具）。 */
async function enterSpanBook(page: import('@playwright/test').Page, minutes = 11) {
  await stubData(page, spanFixture());
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitAppReady(page);
  await page.evaluate((m) => { TASK.resetV2(); TASK.initPlan(m); }, minutes);
  await page.reload();
  await waitAppReady(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
}

/* 逐篇进任务模式，记下「这一篇今天排到哪些句」与「这一篇画了哪几根线」。
   per[a].q 是按篇收窄的队列，只用来证明「今天不止排到一篇」；它不能当全天窗口 ——
   按篇装配时每篇都能挑到全天承诺之外的句子（六篇并集比全天窗口长）。
   每篇之间必须先退出：enterTaskMode 在「已经在任务模式」时只收面板就 return
   （index.html:8659），不重跑 syncQueueFromPlan —— 不退就六次读到的都是第一篇的队列。 */
async function sweepArticles(page: import('@playwright/test').Page, n = 6) {
  const out: { q: number[]; lines: { e: string; gi: string }[] }[] = [];
  for (let a = 0; a < n; a++) {
    await page.evaluate(() => TASK.exitTaskMode());
    await page.evaluate((i) => TASK.openArticle(i), a);
    await expect(page.locator('body'), `第 ${a} 篇应在任务模式`).toHaveClass(/task-mode/);
    out.push(await page.evaluate(() => ({
      q: TASK.queue.map((x) => x.i),
      lines: [...document.querySelectorAll('.today-range-line')]
        .map((el) => ({ e: (el as HTMLElement).dataset.edge || '', gi: (el as HTMLElement).dataset.gi || '' })),
    })));
  }
  return out;
}

/* 建计划（8 分钟，够把 40 句里的前 19 句排进去），并先「读过第 0 句」——
   第 0 句的词今天已见 → assemble 不再排它 → 今天区间从第 1 句开始，
   两边都不贴文章边界，两条线都该出现。 */
async function enterRangeArticle(page: import('@playwright/test').Page) {
  await stubData(page, rangeFixture());
  await page.goto(`${rootUrl}/index.html#/home`);
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

    // 线端小标签（2026-09-25 用户需求）：线要标明自己是什么线 —— 起点线左端
    // 「今天任务 · 开始」、终点线右端「今天任务 · 结束」，随父线 aria-hidden。
    const startTag = startLine.locator('.today-range-tag');
    const endTag = endLine.locator('.today-range-tag');
    await expect(startTag).toHaveText('今天任务 · 开始');
    await expect(endTag).toHaveText('今天任务 · 结束');
    expect(await startTag.evaluate((el) => el.closest('.today-range-line')!.getAttribute('aria-hidden')), '标签随父线装饰性').toBe('true');
    // 位置锚点：开始标签贴线左端、结束标签贴线右端
    const tagPos = await page.evaluate(() => {
      const s = document.querySelector('.today-range-line[data-edge="start"] .today-range-tag') as HTMLElement;
      const e = document.querySelector('.today-range-line[data-edge="end"] .today-range-tag') as HTMLElement;
      const sl = document.querySelector('.today-range-line[data-edge="start"]') as HTMLElement;
      const el2 = document.querySelector('.today-range-line[data-edge="end"]') as HTMLElement;
      return { sLeft: s.offsetLeft, eRight: el2.offsetWidth - (e.offsetLeft + e.offsetWidth), lineW: sl.offsetWidth };
    });
    expect(tagPos.sLeft, '开始标签贴线左端').toBeLessThan(4);
    expect(tagPos.eRight, '结束标签贴线右端').toBeLessThan(4);
    expect(tagPos.lineW, '线本体宽度不因标签改变').toBeGreaterThan(0);
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
    await page.goto(`${rootUrl}/index.html#/home`);
    await expect(page.locator('.art-card')).toHaveCount(6);
    await page.evaluate(() => TASK.resetV2());   // 清掉计划 = 自由跟读
    await page.reload();
    await expect(page.locator('.art-card')).toHaveCount(6);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await expect(page.locator('.today-range-line')).toHaveCount(0);
  });

  test('读两句后重进：开始/结束线钉在今日原区间，不随后续阅读漂移（2026-09-30 bug）', async ({ page }) => {
    await enterRangeArticle(page);
    const before = await page.evaluate(() => {
      const q = TASK.queue.map((x) => x.i);
      const g = [...document.querySelectorAll('.today-range-line')]
        .map((el) => ({ e: (el as HTMLElement).dataset.edge, gi: (el as HTMLElement).dataset.gi }));
      return { first: q[0], g };
    });
    expect(before.g.map((x) => x.e).sort(), '两条线都在').toEqual(['end', 'start']);

    // 读掉队列头两句（真记接触）→ 引擎队列重新装配后会跳过已读句（前提成立的证据）
    await page.evaluate(() => TASK.exitTaskMode());
    await page.evaluate((gi) => TASK.readDone(gi), before.first);
    await page.evaluate((gi) => TASK.readDone(gi), before.first + 1);
    await page.evaluate(() => TASK.openArticle(0));
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    const after = await page.evaluate(() => {
      const q = TASK.queue.map((x) => x.i);
      const g = [...document.querySelectorAll('.today-range-line')]
        .map((el) => ({ e: (el as HTMLElement).dataset.edge, gi: (el as HTMLElement).dataset.gi }));
      return { first: q[0], g };
    });
    expect(after.first, '引擎队列确实跳过了已读句（前提）').toBeGreaterThan(before.first);
    expect(after.g, '两条线钉住今日原区间，不许跟着队列首漂').toEqual(before.g);
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

  test('全篇即区间：开始线照画（设起点入口），结束线贴底不画', async ({ page }) => {
    await stubData(page, fullArticleFixture());
    await page.goto(`${rootUrl}/index.html#/home`);
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
    const lines = page.locator('.today-range-line');
    await expect(lines, '开始线贴第一句也照画（点线设起点的入口）').toHaveCount(1);
    await expect(lines.first()).toHaveAttribute('data-edge', 'start');
    await expect(lines.first()).toHaveAttribute('data-gi', '0');
  });

  test('点开始线设起点：今日有进度先出确认，确认后两线同移、今日记录清零', async ({ page }) => {
    await enterRangeArticle(page);
    expect((await page.evaluate(() => TASK.todayProgress())).done, '前置：今天已有进度').toBeGreaterThan(0);
    const before = await page.evaluate(() => [...document.querySelectorAll('.today-range-line')]
      .map((el) => (el as HTMLElement).dataset.gi));

    // 第一次：出确认步 → 返回 → 线与进度都不动
    await page.locator('.today-range-line[data-edge="start"]').click();
    await expect(page.locator('#startPickPop')).toBeVisible();
    await page.locator('#spSent').selectOption('5');
    await page.locator('#startPickPop .sp-actions .btn.primary').click();
    await expect(page.locator('#startPickPop'), '有进度必须先出重新计算确认').toContainText('重新计算');
    await page.locator('#startPickPop .sp-actions .btn').first().click();   // 返回
    await expect(page.locator('#spSent')).toBeVisible();                    // 回到表单
    await page.locator('#startPickPop .sp-actions .btn').first().click();   // 取消关掉
    await expect(page.locator('#startPickPop')).toHaveCount(0);
    const unchanged = await page.evaluate(() => [...document.querySelectorAll('.today-range-line')]
      .map((el) => (el as HTMLElement).dataset.gi));
    expect(unchanged, '返回后线不动').toEqual(before);
    expect((await page.evaluate(() => TASK.todayProgress())).done, '返回后进度不动').toBeGreaterThan(0);

    // 第二次：确认调整 → 两线一起移动，今日记录清零
    await page.locator('.today-range-line[data-edge="start"]').click();
    await page.locator('#spSent').selectOption('5');
    await page.locator('#startPickPop .sp-actions .btn.primary').click();
    await expect(page.locator('#startPickPop')).toContainText('重新计算');
    await page.locator('#startPickPop .sp-actions .btn.primary').click();   // 确认调整
    await expect(page.locator('#startPickPop')).toHaveCount(0);
    const moved = await page.evaluate(() => ({
      lines: [...document.querySelectorAll('.today-range-line')]
        .map((el) => ({ e: (el as HTMLElement).dataset.edge, gi: (el as HTMLElement).dataset.gi })),
      q: TASK.queue.map((x) => x.i),
      done: TASK.todayProgress().done,
    }));
    expect(moved.done, '今日记录已清').toBe(0);
    expect(moved.q[0], '队列从新起点起').toBe(4);
    const start = moved.lines.find((x) => x.e === 'start');
    expect(start && start.gi, '开始线落到第 5 句（全局 4）').toBe('4');
    const end = moved.lines.find((x) => x.e === 'end');
    /* 2026-10-10 刷句模式：按篇队列 = 从书签连刷到篇末（8 分钟 N=19 不再截断按篇队列），
       区间尾 = 文章最后一句 —— 「结束线贴底不画」规则生效（同文件 295 行那条锁），
       队列与开始线仍是一套数：q = [4..39]，线只画开始那条。 */
    expect(moved.q.length, '按篇从书签连刷到篇末（39-4+1 = 36 句）').toBe(36);
    expect(moved.q[moved.q.length - 1], '队列尾句 = 篇末').toBe(39);
    expect(end && end.gi, '结束线贴篇末不画').toBeUndefined();
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

/* 2026-10-08 用户两问：「之前可以自定义今日任务开始线的内容没了？还有为什么每一章都有个
   起始线，不应该有且仅有一[天]起始线吗？」
   查下来功能没删（点线开弹窗那条一直在），但两件事确实不对：
    · auto 口径下线画的是**本篇**今天队列的头尾（todayQueue 按篇收窄），于是进一篇画一篇；
      而手动起点是全天一个 —— 同一根线背了两套语义。收成「一天各一条」。
    · 入口只有正文里那根 2px 的线：移动端零提示（title 在触屏不显示）、键盘 Tab 到不了、
      读屏听不到（线整条 aria-hidden，而且它本就该保持装饰性 —— 上面那条锁钉着），
      设完也没有任何地方回显「现在起点在哪」。补一颗今日面板里的真按钮。 */
test.describe('今日起点的唯一性与入口', () => {
  test('一天只有一条开始线、一条结束线：切到别的篇不再各画一条', async ({ page }) => {
    await enterSpanBook(page);
    const per = await sweepArticles(page);
    const withQ = per.filter((p) => p.q.length > 0);
    expect(withQ.length, '夹具：今天的任务要横跨多篇（否则这条锁什么都没锁住）').toBeGreaterThan(1);

    const all = withQ.flatMap((p) => p.q);
    /* 全天窗口以引擎自己的装配为准（退出任务模式 = 没有按篇 scope）：各篇队列的并集只用来
       证明横跨多篇，它比全天窗口长（按篇收窄时每篇都能挑到全天承诺之外的句子）。 */
    const day = await page.evaluate(() => {
      TASK.exitTaskMode();
      const q = TASK.todayPlan(true).queue.map((x) => x.i);
      return { first: Math.min(...q), last: Math.max(...q), n: q.length };
    });
    expect(day.n, '夹具：今天排到的不止一句').toBeGreaterThan(1);
    expect(Math.max(...all), '夹具：并集里确实有全天窗口外的句子（否则这条锁退化成按篇口径也绿）')
      .toBeGreaterThan(day.last);
    const artOf = (gi: number) => Math.floor(gi / 6);   // 夹具：每篇 6 句

    const at = (edge: string) => per.flatMap((p, a) =>
      p.lines.filter((l) => l.e === edge).map((l) => ({ a, gi: Number(l.gi) })));
    expect(at('start'), '全天只许一条开始线，落在全天窗口的头一句').toEqual([{ a: artOf(day.first), gi: day.first }]);
    const ends = at('end');
    expect(ends.length, '全天最多一条结束线（末句贴文章最后一句时按既有口径不画）').toBeLessThanOrEqual(1);
    if (ends.length) expect(ends[0].gi, '结束线落在全天窗口的末一句，不是本篇队列的末一句').toBe(day.last);
  });

  test('开始线的可点高度补到 ≥30px，且只吃自己的 margin（不抢上下那句的点击）', async ({ page }) => {
    await enterSpanBook(page);
    const m = await page.evaluate(() => {
      const el = document.querySelector('.today-range-line[data-edge="start"]') as HTMLElement;
      const r = el.getBoundingClientRect();
      const after = getComputedStyle(el, '::after');
      const own = getComputedStyle(el);
      const parts = (after.inset || 'auto').split(/\s+/).map((x) => parseFloat(x));
      const tb = Number.isNaN(parts[0]) ? 0 : Math.abs(parts[0]);
      const lr = Number.isNaN(parts[1]) ? tb : Math.abs(parts[1]);
      return {
        h: Math.round(r.height + 2 * tb), w: Math.round(r.width + 2 * lr), inset: tb,
        mt: parseFloat(own.marginTop), mb: parseFloat(own.marginBottom),
      };
    });
    expect(m.h, '2px 的线在手机上点不着，有效触区要 ≥30px').toBeGreaterThanOrEqual(30);
    expect(m.inset, '外扩只许吃自己的 margin：越界就盖住上下那句的点击（点句＝跳句）').toBeLessThanOrEqual(Math.min(m.mt, m.mb));
    expect(m.w, '横向仍是整条线可点').toBeGreaterThan(100);
  });

  test('今日面板给一颗真按钮：点了开同一个起点弹窗，设完在面板上回显第几篇第几句', async ({ page }) => {
    await enterSpanBook(page);
    /* 触区按手机档量（.btn 视觉 30 + ::after 外扩 -7 = 44，见 index.html:1216 那条 @media），
       与 a11y.spec.ts 的 hit() 同一口径。 */
    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => TASK.exitTaskMode());
    await page.evaluate(() => TASK.openPanel());
    const panel = page.locator('#todayPanel');
    await expect(panel).toBeVisible();

    const btn = panel.locator('button', { hasText: '起点与模式' });
    await expect(btn, '入口不许只长在正文那根线上').toHaveCount(1);
    const hitH = await btn.evaluate((el) => {
      const r = (el as HTMLElement).getBoundingClientRect();
      const a = getComputedStyle(el, '::after');
      let tb = 0;
      if (a.content !== 'none' && a.display !== 'none') {
        tb = Math.abs(parseFloat(((a.inset || '0px').split(/\s+/)[0])) || 0);
      }
      return Math.round(r.height + 2 * tb);
    });
    expect(hitH, '按钮有效触区 ≥44px（PRD §10.4）').toBeGreaterThanOrEqual(44);

    await btn.click();
    await expect(page.locator('#startPickPop'), '开的是同一个「设置今日任务起点」弹窗').toBeVisible();
    await expect(page.locator('#startPickPop'), '从面板里开：弹窗必须盖在面板之上').toBeInViewport();
    await page.locator('#spArt').selectOption('4');
    await page.locator('#spSent').selectOption('2');
    await page.locator('#startPickPop .sp-actions .btn.primary').click();
    await expect(page.locator('#startPickPop')).toHaveCount(0);
    await expect(panel, '设完要看得见当前起点，不是一句一闪而过的 toast').toContainText('第 5 篇第 2 句');

    await panel.locator('button', { hasText: '切换到记忆模式' }).click();
    await expect(panel, '切回记忆模式后不能再报刷句起点').not.toContainText('第 5 篇第 2 句');
  });
});
