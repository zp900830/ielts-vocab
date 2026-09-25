// 2026-09-24 用户实测：任务条主行「通读 337/339」（= 本篇：这一篇共 339 句 / 读到 337 句）
// 与气泡「今天第 75 句 · 还剩 38 句」（= 今天的队列）并排，两个没标签的不同量看着像矛盾。
//
// 09-24 的口径是「主行/气泡=本篇、辅行=今天」；2026-09-25 用户在真机上把这一版看了之后改拍板
// **口径 A**：主行与气泡统一到「今天」（条满 = 今天这批走完，正是正文里「今日任务结束线」），
// lifetime 的「本篇 337/339」降到辅行当小字 —— 不再读成"快读完整篇"。每处口径仍写在脸上。
// 下面四条各自独立成锁，谁也不遮谁。
//
// 反向验证：把 app/ 的改动 stash 掉后，主行/辅行/气泡/数据页四条必须红。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  next(): void;
  pass(): number;
  queue: { i: number }[];
  state(): { daily: Record<string, { sentDone?: number; minutes?: number }> };
  todayProgress(): { done: number; planned: number; left: number; minutes: number };
  todayCoverWords(): number;
};
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇，句数刻意不等：第 0 篇 12 句，其余各 2 句 → 全局 22 句。
   与 task.spec.ts 同款夹具 —— 按篇（12）≠ 全局（22），才锁得住「主行说的是这一篇」。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
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

/* ② 要用真四选一（引擎凑满 4 个候选才出题）：四个词、义项互不重叠。与 task.spec.ts 的 SIXQ 同款。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + QSENSES[i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
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
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 等 app 真正就位（与 task.spec.ts 同一把闸）：loadData 落地 + TASK.init 跑过。 */
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

/* 建一份「刚建好、还没读」的 15 分钟计划 → 进第 0 篇的任务模式（① 通读态）。 */
async function enterFirstArticle(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  await stubData(page, payloads);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').first().click();
  await expect(page.locator('#taskBar')).toBeVisible();
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
}

async function waitStatsReady(page: import('@playwright/test').Page) {
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderStats?: unknown } };
    if (!(w.APP3 && typeof w.APP3.renderStats === 'function')) return false;
    const v = document.getElementById('appView');
    return !!(v && (v.querySelector('.stats-page') || v.querySelector('.st-empty-start')));
  }, undefined, { timeout: 20000 });
}

test.describe('3.0 任务条/数据页的「今天」口径（主行·辅行·气泡·数据页）', () => {
  test('主行=今天口径：分母是今天计划的句数，不是这一篇的', async ({ page }) => {
    await enterFirstArticle(page, SIX);
    const tp = await page.evaluate(() => TASK.todayProgress());
    expect(tp.planned, '今天的分母要真造出来').toBeGreaterThan(0);
    await expect(page.locator('#tbTitle')).toHaveText(`通读 · 今天 ${Math.min(tp.done, tp.planned)}/${tp.planned}`);
    const art0 = await page.evaluate(() => ShadowPlan.articleScope(SECTIONS, 0).size);
    const all = await page.evaluate(() =>
      SECTIONS.reduce((a, s) => a + s.paragraphs.reduce((x, p) => x + p.length, 0), 0));
    expect(art0, '夹具要让第 0 篇句数 ≠ 全局句数，否则分不清今天/本篇').not.toBe(all);
    await expect(page.locator('#tbTitle'), '主行不许再说本篇').not.toContainText('本篇');
  });

  test('辅行=本篇口径：句数与首页卡片同源、覆盖词数与 todayCoverWords() 同源（不写死字面量）', async ({ page }) => {
    await enterFirstArticle(page, SIX);
    const art0 = await page.evaluate(() => ShadowPlan.articleScope(SECTIONS, 0).size);
    const cover = await page.evaluate(() => TASK.todayCoverWords());
    expect(art0, '本篇的分母要来自按篇口径').toBeGreaterThan(0);
    expect(cover, '今天这批句子要真覆盖到目标词，否则这条锁不住覆盖数').toBeGreaterThan(0);
    await expect(page.locator('#tbSub')).toHaveText(`本篇 0/${art0} 句 · 覆盖 ${cover} 词`);
  });

  test('气泡=今天口径：报「今天第 N 句 · 还剩 M 句」，不再报本篇', async ({ page }) => {
    await enterFirstArticle(page, SIX);
    // 拖动/悬停到进度条最右端 = 今天队列最后一句 = 今日任务结束线
    const expected = await page.evaluate(() => {
      const q = TASK.queue;
      return { pos: q.length, qn: q.length };
    });
    expect(expected.qn, '队列要有不止一句，气泡才有位置可言').toBeGreaterThan(1);
    const box = await page.locator('#tbSeek').boundingBox();
    expect(box, '进度条要在屏上').not.toBeNull();
    await page.mouse.move(box!.x + box!.width - 1, box!.y + box!.height / 2);
    const tip = page.locator('#tbTip');
    await expect(tip).toContainText(`今天第 ${expected.pos} 句 · 还剩 0 句`);
    await expect(tip, '气泡不再报本篇口径').not.toContainText('本篇');
  });

  test('学习数据页「今天」块：读了几句 / 学习时长 / 还剩几句，都与 state 同源', async ({ page }) => {    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await waitStatsReady(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));   // 今天读 5 句
    });
    await page.reload();
    await waitStatsReady(page);

    await expect(page.locator('.st-block[data-block="today"]')).toBeVisible();
    await expect(page.locator('.st-block[data-block="today"] > h2')).toContainText('今天');
    expect(await page.locator('.st-block[data-block="today"] .st-num').count(), '今天块三个数').toBe(3);

    const tp = await page.evaluate(() => TASK.todayProgress());
    expect(tp.done, '夹具要真读几句，否则这条什么都没测').toBeGreaterThan(0);
    const num = (k: string) => page.locator(`.st-num[data-k="${k}"] b`).innerText().then((t) => Number(t.replace('%', '')));
    expect(await num('today-sent')).toBe(tp.done);
    expect(await num('today-min')).toBe(tp.minutes);
    expect(await num('today-left')).toBe(tp.left);
  });

  test('① 走完 → 遍间小结「开始答题」→ ② 文内挖空（PRD §4.4 / §13.1）', async ({ page }) => {
    await enterFirstArticle(page, SIXQ);

    // ① 这一批全部读完 → 再点推进键 = finishPass(1)，小结端上来
    await page.evaluate(() => { TASK.queue.map((x) => x.i).forEach((i) => TASK.readDone(i)); });
    await page.evaluate(() => TASK.next());
    const summary = page.locator('#passCard .pass-summary');
    await expect(summary).toBeVisible();
    await expect(summary).toContainText('通读完成');
    const go = summary.locator('.go');
    await expect(go).toContainText('答题');
    await go.click();

    // ② 就位：pass=2、任务条切成挖空态、正文里真的长出空，点空能弹出题
    await expect.poll(() => page.evaluate(() => TASK.pass())).toBe(2);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'quiz');
    await expect(page.locator('#art .qz-blank').first()).toBeVisible();
    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop')).toBeVisible();
  });
});

/* 2026-09-25 链路排查：数据页「今日学习时长」以前读 dayplan 事件里的【计划分钟数】
   （计划 15、实读 3 也显示 15 —— 假数）。现在读 LS_ARTICLE.read.ms（任务模式里放完一句/
   答一题各记一笔间隔，按天累计）；还没有真实账时回退计划分钟数。 */
test.describe('「今日学习时长」= 真实用时', () => {
  test('read.ms 有账 → 显示真实分钟；无账 → 回退计划分钟数', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitAppReady(page);
    await page.evaluate(() => {
      const w = window as unknown as { __day: string };
      TASK.resetV2(); TASK.initPlan(15);
      // 天键（4AM 边界）不能本地拼（UTC 会串日）—— 从 ROOT2.planned 的快照键里拿，就是今天
      const root = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
      w.__day = Object.keys(root.planned)[0];
    });
    // 直接种真实账：今天真实读了 3 分钟（180s），计划 15 分钟
    await page.evaluate(() => {
      const w = window as unknown as { __day: string };
      const raw = localStorage.getItem('ielts.app3.article');
      const o = raw ? JSON.parse(raw) : { reps: {}, pass2: {}, listen: {}, read: {} };
      o.read = { ms: { [w.__day]: 180000 } };
      localStorage.setItem('ielts.app3.article', JSON.stringify(o));
    });
    await page.reload();
    await waitAppReady(page);
    const tp = await page.evaluate(() => TASK.todayProgress());
    expect(tp.minutes, '有真实账 → 显示 3 分钟，不是计划的 15').toBe(3);
    // 数据页同源：导航过去看「今天」块
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await waitStatsReady(page);
    await expect(page.locator('.st-num[data-k="today-min"] b')).toHaveText('3');

    // 无账的旧天：回退计划分钟数（升级后不显示 0，也不丢历史）
    await page.evaluate(() => {
      const raw = localStorage.getItem('ielts.app3.article');
      const o = JSON.parse(raw!);
      const w = window as unknown as { __day: string };
      delete o.read.ms[w.__day];
      localStorage.setItem('ielts.app3.article', JSON.stringify(o));
    });
    await page.reload();
    await waitAppReady(page);
    const tp2 = await page.evaluate(() => TASK.todayProgress());
    expect(tp2.minutes, '无真实账 → 回退计划分钟数').toBeGreaterThan(0);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await waitStatsReady(page);
    await expect(page.locator('.st-num[data-k="today-min"] b')).not.toHaveText('0');
  });
});
