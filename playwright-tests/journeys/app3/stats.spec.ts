// 3.0 M2：学习数据页（PRD §5）。服务器归 global-setup.ts 起停（仓库根 8932）；
// /app/ 在仓库根，所以和 shell.spec.ts / home.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  seedDailyForTest(back: number): void;
  seedArticleForTest(a: number, o: { quizOk?: number; quizNo?: number; reps?: number; pass2?: boolean }): void;
  state(): {
    daily: Record<string, { sentDone?: number; quizDone?: number; minutes?: number }>;
    words: Record<string, unknown>;
    sents: Record<number, { lastReadAt: number }>;
  };
  todayStats(): { streak: number; graduated: number; targetWords: number };
  countStages(): { graduated: number; leech: number };
  listenStat(): { totalSents: number; totalMs: number; byArticle: Record<string, number>; last: Record<string, number> };
};
declare const ShadowPlan: {
  articleScope(sections: unknown, a: number): Set<number>;
  newWord(): Record<string, unknown>;
  dayKey(ts: number, b: number): string;
  DAY_MS: number;
};
declare const SECTIONS: unknown[];
declare const APP3: {
  articleStat(a: number): { progress: number; stage: string; ever: number; total: number };
  route(): void;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 6 篇小壳（与 home.spec.ts 同款）：第 0 篇 24 句、30 个不同目标词，其余 2 句。
   既让数据页拿到 6 篇，又不再多渲一页 1833 句 + 3242 词（并行时那份额外负载会压出 shadow 偶发红）。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number, extra: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) =>
      `Sentence ${i} about [[w${i}:w${i}]].${i < extra ? ` Plus [[x${i}:x${i}]].` : ''}`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 24 : 2, i === 0 ? 6 : 0))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 应用就绪闸门（评审 Important①）。两层：
   ① waitShadowReady：dataReady + sents 已渲（utils/app-ready 的条件等待，与 playback-resume 同一把闸）；
   ② 等 #appView 真的渲出学习数据页（.stats-page 或有计划前的 .st-empty-start）——
      只等 ① 不够（dataReady/sents 由**内联脚本**设置，renderStats 却在 defer 的 app.js 里），
      高并发下 #appView 会停在「正在载入…」/空，5s 的 locator 自动等待会偶发红。
   2026-09-24 根因修复后去掉 M2 的「有界重载重试」：那个重试是为绕开 blob-URL SW 不生效、
   app.js 偶发丢而加的缓解，会把以后 app.js 的真故障一起吞掉。现在 SW 是真实文件
   /app/sw.js（network-first + 缓存兜底），app.js 有可靠保障，不需要重试。 */
async function waitStatsReady(page: import('@playwright/test').Page) {
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    const w = window as unknown as { APP3?: { renderStats?: unknown } };
    if (!(w.APP3 && typeof w.APP3.renderStats === 'function')) return false;
    const v = document.getElementById('appView');
    return !!(v && (v.querySelector('.stats-page') || v.querySelector('.st-empty-start')));
  }, undefined, { timeout: 20000 });
}

async function gotoStats(page: import('@playwright/test').Page) {
  await page.goto(`${rootUrl}/app/index.html#/stats`);
  await waitStatsReady(page);
}
/* reload 之后同样要过闸（defer 的 app.js 可能还没跑，5s 的 locator 自动等待不够）。 */
async function reloadStats(page: import('@playwright/test').Page) {
  await page.reload();
  await waitStatsReady(page);
}

test.describe('3.0 学习数据页（M2，PRD §5）', () => {
  test('未开始：一句话 + 一个按钮，点了打开「我的」浮窗，不内嵌计划表单', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await reloadStats(page);

    const start = page.locator('.st-empty-start');
    await expect(start).toBeVisible();
    await expect(start.locator('h1')).toHaveText('开始你的学习计划');
    expect((await start.locator('p').innerText()).length, '未开始态要有一句说明').toBeGreaterThan(0);
    // 不内嵌计划表单：数据页里不得出现 renderSetup 的 .ps-start
    expect(await page.locator('#appView .ps-start').count(), '未开始态不得内嵌计划表单').toBe(0);

    // 按钮 → 打开「我的」浮窗（不是跳设置屏）
    await page.locator('.st-open-me').click();
    await expect(page.locator('#mePop')).toBeVisible();
    await expect(page.locator('#mePop [data-me-theme]'), '「我的」浮窗真的开了').toBeVisible();
    expect(await page.locator('#appView .ps-start').count(), '点按钮也不许内嵌表单').toBe(0);
  });

  /* 评审 blocker 的回归锁：从空态「我的 → 设置学习计划 → 开始这个计划」建完计划，
     学习数据页必须**自己翻面**成进行中数据视图，不靠刷新/导航。修前：initPlan 不 route，
     #appView 一直停在 .st-empty-start（hasPlan 已 true）。 */
  test('空态建计划后：学习数据页自己切到进行中视图（blocker 回归锁）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await reloadStats(page);
    await expect(page.locator('.st-empty-start')).toBeVisible();
    expect(await page.evaluate(() => TASK.hasPlan), '起点必须没计划').toBe(false);

    // 空态按钮 →「我的」浮窗 → CTA「设置学习计划」→ 设置屏
    await page.locator('.st-open-me').click();
    await expect(page.locator('#mePop')).toBeVisible();
    await page.locator('#mePop .mp-cta').click();
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();

    // 建计划：这一刻起 hasPlan 变 true，页面必须跟着翻
    await page.locator('#setupSheet .ps-start').click();
    expect(await page.evaluate(() => TASK.hasPlan), '建完计划 hasPlan 应为 true').toBe(true);
    await expect(page.locator('.st-empty-start'), '空态必须消失，不许停在未开始').toHaveCount(0);
    await expect(page.locator('.st-block[data-block="overview"]'), '数据块必须自己出现').toBeVisible();
  });

  test('进行中：学习总览 5 个数与 state 同源', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));  // 今天读 5 句
      TASK.seedDailyForTest(1);                                   // 昨天：sentDone 5、minutes 15（必须在 readDone 之后）
    });
    await reloadStats(page);

    await expect(page.locator('.st-block[data-block="overview"]')).toBeVisible();
    const expected = await page.evaluate(() => {
      const st = TASK.state();
      const daily = st.daily || {};
      const keys = Object.keys(daily);
      let minutes = 0, acts = 0;
      keys.forEach((k) => { const d = daily[k] || {}; minutes += d.minutes || 0; acts += (d.sentDone || 0) + (d.quizDone || 0); });
      let arts = 0;
      for (let a = 0; a < SECTIONS.length; a++) { const s = APP3.articleStat(a).stage; if (s === 'done' || s === 'pro') arts++; }
      return { days: keys.length, minutes, streak: TASK.todayStats().streak, arts, acts };
    });
    const num = (k: string) => page.locator(`.st-num[data-k="${k}"] b`).innerText().then((t) => Number(t.replace('%', '')));
    expect(await num('days')).toBe(expected.days);
    expect(await num('minutes')).toBe(expected.minutes);
    expect(await num('streak')).toBe(expected.streak);
    expect(await num('arts')).toBe(expected.arts);
    expect(await num('acts')).toBe(expected.acts);
    expect(expected.days, '夹具要真造出日账，否则这条什么都没测').toBeGreaterThanOrEqual(2);
    expect(expected.acts, '夹具要真造出学习次数').toBeGreaterThan(0);
  });

  test('文章学习：6 篇小卡数字与首页卡片同源；点小卡 → 回首页并高亮', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 20).forEach((i) => TASK.readDone(i));
    });
    await reloadStats(page);

    await expect(page.locator('.st-art')).toHaveCount(6);
    // 与 APP3.articleStat 同源（真断言，不写死字面量）
    const stats = await page.evaluate(() => Array.from({ length: SECTIONS.length }, (_, a) => APP3.articleStat(a).progress));
    for (let a = 0; a < 6; a++) {
      await expect(page.locator(`.st-art[data-a="${a}"] .sa-pct`), `第 ${a} 篇小卡百分比`).toHaveText(stats[a] + '%');
    }
    // 首页卡片同一个数：切到首页比对
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await expect(page.locator('.art-card[data-a="0"] .a-pct')).toHaveText(stats[0] + '%');

    // 点第 0 篇小卡 → 回首页且该卡片被高亮
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.locator('.st-art[data-a="0"]').click();
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('.art-card[data-a="0"]')).toHaveClass(/hl/);
  });

  test('单词掌握：4 个数与 countStages/state 同源', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 8).forEach((i) => TASK.readDone(i));
      TASK.seedArticleForTest(0, { quizOk: 2 });     // 造点词状态，别让 4 个数全 0
    });
    await reloadStats(page);

    const expected = await page.evaluate(() => {
      const c = TASK.countStages();
      const st = TASK.state();
      const learned = Object.keys(st.words || {}).length;
      const total = TASK.todayStats().targetWords;
      return { learned, grad: c.graduated, leech: c.leech, rate: total ? Math.round((c.graduated / total) * 100) : 0 };
    });
    const num = (k: string) => page.locator(`.st-num[data-k="${k}"] b`).innerText().then((t) => Number(t.replace('%', '')));
    expect(await num('learned')).toBe(expected.learned);
    expect(await num('grad')).toBe(expected.grad);
    expect(await num('leech')).toBe(expected.leech);
    expect(await num('rate')).toBe(expected.rate);
    expect(expected.learned, '夹具要真造出词状态').toBeGreaterThan(0);
  });

  test('学习趋势：14 天柱状 + SVG 折线，有文本替代，无图表库', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));
      TASK.seedDailyForTest(1); TASK.seedDailyForTest(2);   // 造出跨天日账（必须在 readDone 之后），柱/线才有形状
    });
    await reloadStats(page);

    const wrap = page.locator('.tr-wrap');
    await expect(wrap).toBeVisible();
    expect(await page.locator('.tr-bar').count(), '近 14 天 = 14 根柱').toBe(14);
    expect(await page.locator('.tr-wrap svg.tr-line polyline').count(), '一条折线').toBe(1);
    // 两个端点：CSS 圆点（不是会被拉伸的 SVG <circle>，评审 Minor）
    expect(await page.locator('.tr-wrap .tr-dot').count(), '折线两个端点').toBe(2);
    // 文本替代：role=img + aria-label
    await expect(wrap).toHaveAttribute('role', 'img');
    expect(await wrap.getAttribute('aria-label')).toContain('近 14 天');
    // 无图表库（回归锁：有人引 Chart.js / ECharts 就红）
    expect(await page.evaluate(() => typeof (window as unknown as { Chart?: unknown }).Chart)).toBe('undefined');
    expect(await page.evaluate(() => typeof (window as unknown as { echarts?: unknown }).echarts)).toBe('undefined');
  });

  test('随身听块：显示真数据（收听句数/时长/最近收听），不再有空态占位（§5.7）', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await reloadStats(page);
    // M2 的空态占位被 M4 的真数据彻底取代
    await expect(page.locator('.st-empty[data-empty="listen"]')).toHaveCount(0);
    const block = page.locator('.st-block[data-block="listen"]');
    await expect(block).toBeVisible();
    const expected = await page.evaluate(() => {
      const s = TASK.listenStat();
      return { sents: s.totalSents, min: Math.round(s.totalMs / 60000) };
    });
    await expect(block.locator('.st-num[data-k="listen-sents"] b')).toHaveText(String(expected.sents));
    await expect(block.locator('.st-num[data-k="listen-min"] b')).toHaveText(String(expected.min));
    // §5.7：不得出现「收听掌握度」这类伪造指标
    expect(await block.innerText()).not.toContain('收听掌握度');
  });

  test('待加强：2–3 条建议，每条按钮落到正确入口', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const arr = Array.from(ShadowPlan.articleScope(SECTIONS, 0));
      arr.slice(0, 3).forEach((i) => TASK.readDone(i));      // 已开始但没读完 → continue
      const st = TASK.state();
      const old = Date.now() - 3 * 864e5;
      arr.slice(0, 3).forEach((i) => { st.sents[i].lastReadAt = old; });   // 3 天没学 → stale
      st.words['__leech__'] = Object.assign(ShadowPlan.newWord(), { stage: 'seen', reps: 1, leech: true, due: Date.now() - 1000 });  // 重点词到期 → leech
      APP3.route();
    });

    await expect(page.locator('.st-tip')).toHaveCount(3);
    await expect(page.locator('.st-tip[data-tip="continue"]')).toContainText('还差');
    await expect(page.locator('.st-tip[data-tip="leech"]')).toContainText('重点词');
    await expect(page.locator('.st-tip[data-tip="stale"]')).toContainText('天没学');

    // leech → 单词本
    await page.locator('.st-tip[data-tip="leech"] .tip-go').click();
    await expect(page).toHaveURL(/#\/words/);
    // continue → 回首页并高亮第 0 篇
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.locator('.st-tip[data-tip="continue"] .tip-go').click();
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('.art-card[data-a="0"]')).toHaveClass(/hl/);
    // stale → 回首页并高亮第 0 篇
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.locator('.st-tip[data-tip="stale"] .tip-go').click();
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('.art-card[data-a="0"]')).toHaveClass(/hl/);
  });

  /* 评审 Minor：兜底建议（start / words）与 .st-art 触摸目标过去没锁。 */
  test('兜底建议落点 + 小卡触摸目标 ≥44px', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    // 全新计划、零活动 → 只有兜底两条：start（还有 6 篇没开始）+ words（去单词本）
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); APP3.route(); });
    await expect(page.locator('.st-tip[data-tip="start"]')).toContainText('没开始');
    await expect(page.locator('.st-tip[data-tip="words"]')).toContainText('单词本');
    expect(await page.locator('.st-tip').count(), '兜底也应有 2 条可点建议').toBe(2);
    // .st-art 的 min-height 是触摸目标下限
    const mh = await page.locator('.st-art').first().evaluate((el) => getComputedStyle(el).minHeight);
    expect(mh, '.st-art 的 min-height ≥44px（触摸目标）').toBe('44px');
    // start → 回首页并高亮第一篇未开始（a=0）
    await page.locator('.st-tip[data-tip="start"] .tip-go').click();
    await expect(page).toHaveURL(/#\/home/);
    await expect(page.locator('.art-card[data-a="0"]')).toHaveClass(/hl/);
    // words → 单词本
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.locator('.st-tip[data-tip="words"] .tip-go').click();
    await expect(page).toHaveURL(/#\/words/);
  });

  test('深色模式：数据页关键块不是浅色那套（PRD §10.1）', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));
      TASK.seedDailyForTest(1);
    });
    await reloadStats(page);
    await expect(page.locator('.st-num').first()).toBeVisible();

    const light = await page.locator('.st-num').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await page.locator('.st-num').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dark, '深色下卡片底色必须变').not.toBe(light);
    expect(dark, '深色下不能还是白底').not.toBe('rgb(255, 255, 255)');
    // 进度条轨道是**写死的浅色 rgba**，深色下必须换成 token，否则浅绿压暖黑会发脏
    const track = await page.locator('.st-art .sa-bar').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(track, '深色下进度条轨道不能还是浅色那档 rgba(11,84,64,.14)').not.toBe('rgba(11, 84, 64, 0.14)');
  });

  test('无障碍：语义标题层级 + 触摸目标 ≥44px', async ({ page }) => {
    await stubData(page, SIX);
    await gotoStats(page);
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 5).forEach((i) => TASK.readDone(i));
    });
    await reloadStats(page);
    await expect(page.locator('.stats-page > h1')).toHaveCount(1);
    await expect(page.locator('.st-block > h2')).toHaveCount(7);   // 四问四块 + 今天 + 随身听 + 待加强
    const h = await page.locator('.st-tip .tip-go').first().evaluate((el) => el.getBoundingClientRect().height);
    expect(h, '触摸目标 ≥44px').toBeGreaterThanOrEqual(44);
  });
});
