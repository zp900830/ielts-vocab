// 3.0 M1 Task 3：首页六张文章卡片（熟练度 / 阶段 / 已毕业词数 / 最近学习）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；8931 那台服务的是 shadow/ 树，
// 而 /app/ 在仓库根，所以和 shell.spec.ts / smoke.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { waitShadowReady } from '../../utils/app-ready';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  sentWordsOf(i: number): string[];
};
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
};
declare const SECTIONS: unknown[];
declare const APP3: { renderHome?: unknown };

const rootUrl = process.env.E2E_ROOT_URL || '';

/* M6 抖动根治：首页卡片由 **defer 的 app.js** 里的 renderHome 渲，而 appReady 类闸门只等
   内联脚本的 dataReady/sents。全量并行、静态服务器被拖慢时，5s 的 locator 自动等待会撞上
   「app.js 还没执行 / #appView 还是空」→ toHaveCount(6) 偶发红（实测 14× 0 elements）。
   条件等待到 renderHome 就位 + 卡片真的渲出来（20s 上限，不是 sleep）。 */
async function waitHomeReady(page: import('@playwright/test').Page) {
  await waitShadowReady(page);
  await page.waitForFunction(() => {
    if (!(window as unknown as { APP3?: { renderHome?: unknown } }).APP3 ||
        typeof (window as unknown as { APP3: { renderHome?: unknown } }).APP3.renderHome !== 'function') return false;
    return document.querySelectorAll('.art-card').length > 0;
  }, undefined, { timeout: 20000 });
}

/* 把三份重 JSON 换成 6 篇的小壳：既让首页拿到 6 张卡片，又不再多渲一页 1833 句 + 3242 词
   （和 shell.spec.ts 同一理由：整套并行时那份额外负载会压出 shadow 用例偶发红）。
   第 0 篇 24 句、30 个不同目标词（前 6 句各多一个词）—— 句数 ≠ 词数，锁住「已毕业 X / Y 词」
   的 Y 是**词数**而不是句数（Finding 1）；24 句也让「读 20 句」正好落在「通读中」而非终态。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number, extra: number) => ({
    title,
    zh: title,
    subheads: [''],
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
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

const pctOf = (page: import('@playwright/test').Page) =>
  page.locator('.art-card').first().locator('.a-pct').innerText().then(t => Number(t.replace('%', '')));

test.describe('3.0 首页', () => {
  test('六张卡片 + 四档状态 + 卡片数据', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitHomeReady(page);
    await expect(page.locator('.art-card')).toHaveCount(6);
    await expect(page.locator('.art-card .a-title').first()).toHaveText('地球与生命');

    // —— 全新用户：六张全是「未开始」（灰胶囊 + 0%） ——
    expect(await page.locator('.art-card[data-stage="todo"]').count()).toBe(6);
    const c0 = page.locator('.art-card').first();
    await expect(c0.locator('.a-stage')).toHaveText('未开始');
    await expect(c0.locator('.a-pct')).toHaveText('0%');

    // —— 单词掌握的分母是「词数」不是「句数」（Finding 1 回归锁）——
    const { sentences, words } = await page.evaluate(() => {
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      const set = new Set<string>();
      s.forEach((i) => TASK.sentWordsOf(i).forEach((w) => set.add(w)));
      return { sentences: s.size, words: set.size };
    });
    expect(words, '夹具必须让「词数 ≠ 句数」，否则锁不住 Finding 1').toBeGreaterThan(sentences);
    await expect(c0.locator('.a-meta')).toContainText(`已毕业 0 / ${words} 词`);

    // —— 读前 20 句 → 通读中；熟练度 = round(20/24×40) = 33，落在 (0, 40] ——
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 20).forEach((i: number) => TASK.readDone(i));
    });
    await page.reload();
    await waitHomeReady(page);
    await expect(c0).toHaveAttribute('data-stage', 'reading');
    await expect(c0.locator('.a-stage')).toHaveText('通读中');
    expect(await pctOf(page), '20/24 × 40% 四舍五入 = 33').toBe(33);
    /* 熟练度三项（§9.2）T7 已全实现：通读 ×40 + ② 正确率 ×35 + 精读 ×25。
       此刻 ② 与精读都还是 0，所以只剩第一项在动，33 ≤ 40 是「只通读」这一档的上界。 */
    expect(await pctOf(page), '只通读、没做题没精读时，分数只由第一项给，不得超过 40').toBeLessThanOrEqual(40);

    // —— 读满 24 句 → 「可答题」（§9.4：通读满还没做题，`已学完` 留给通读+② 各一遍）——
    await page.evaluate(() => {
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(20).forEach((i: number) => TASK.readDone(i));
    });
    await page.reload();
    await waitHomeReady(page);
    await expect(c0).toHaveAttribute('data-stage', 'read');
    /* 2026-09-24 用户：卡片胶囊里的圈号去掉 —— 锁两件事：阶段语义文字还在（「可答题」），
       且不再出现任何圈号徽标（回归锁）。 */
    await expect(c0.locator('.a-stage')).toHaveText('可答题');
    await expect(c0.locator('.a-stage')).not.toContainText(/[①②③④⑤]/);
    expect(await pctOf(page), '通读满 → 40%（② / 精读两项都还是 0）').toBe(40);
  });

  // Task 4：顶部「今天该做什么」横幅 + 没计划的空状态（§2.3 / §3.5）。
  // 复用影子跟读现成的 renderSetup（设置屏），落在 #setupSheet 容器里；建完计划横幅改口「继续学」。
  test('没计划 → 横幅给「去设置」；有计划 → 给「继续学」', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await page.reload();
    await waitHomeReady(page);
    await expect(page.locator('#homeBanner .b-go')).toContainText('设置');
    // 点它 → 出设置屏（复用影子跟读的 renderSetup，套在 #setupSheet 里）
    await page.locator('#homeBanner .b-go').click();
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();
    await page.locator('#setupSheet .ps-opt').nth(2).click();      // 15 分钟
    await page.locator('#setupSheet .ps-start').click();
    await expect(page.locator('#homeBanner .b-go')).toContainText('继续学');
    // 建完计划横幅补一条摘要（§3.5 第四类）。W5-2：新建计划当天 streak=0，文案是「今天开始」不是「连续 0 天」
    await expect(page.locator('#homeBanner .hb-sum')).toContainText('今天开始');
    await expect(page.locator('#homeBanner .hb-sum')).toContainText('已毕业');
  });

  /* refine2 ②（2026-09-25 用户）：横幅从「文字在上、通栏按钮在下」改成**左文字块 / 右按钮**；
     窄屏（≤700px）挤不下时退化成上下（按钮仍通栏、触摸 ≥44）。 */
  test('横幅排版：宽屏左文字/右按钮，窄屏退化成上下', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitHomeReady(page);
    const banner = page.locator('#homeBanner .b-go').locator('xpath=..');
    await expect(banner).toBeVisible();

    // 宽屏（桌面档）：row 排，文字块在左、按钮在右，两者垂直居中对齐
    await page.setViewportSize({ width: 1280, height: 800 });
    const wide = await banner.evaluate((el) => {
      const txt = el.querySelector('.hb-text')!.getBoundingClientRect();
      const btn = el.querySelector('.b-go')!.getBoundingClientRect();
      return { dir: getComputedStyle(el).flexDirection, txtRight: txt.right, btnLeft: btn.left,
               txtCy: txt.top + txt.height / 2, btnCy: btn.top + btn.height / 2 };
    });
    expect(wide.dir, '宽屏横幅应左右排（flex-direction: row）').toBe('row');
    expect(wide.btnLeft, '按钮左沿应在文字块右沿之后（左文字 / 右按钮）').toBeGreaterThanOrEqual(wide.txtRight - 1);
    expect(Math.abs(wide.txtCy - wide.btnCy), '左右两块的垂直中心应大致对齐').toBeLessThanOrEqual(2);

    // 窄屏（手机档）：column 排，按钮落到文字块下方且通栏
    await page.setViewportSize({ width: 390, height: 844 });
    const narrow = await banner.evaluate((el) => {
      const txt = el.querySelector('.hb-text')!.getBoundingClientRect();
      const btn = el.querySelector('.b-go')!.getBoundingClientRect();
      const cs = getComputedStyle(el);
      const box = el.getBoundingClientRect();
      const padx = parseFloat(cs.paddingLeft) + parseFloat(cs.paddingRight);
      const bdx = parseFloat(cs.borderLeftWidth) + parseFloat(cs.borderRightWidth);
      return { dir: cs.flexDirection, btnTop: btn.top, txtBottom: txt.bottom,
               btnW: btn.width, inner: box.width - padx - bdx };
    });
    expect(narrow.dir, '窄屏横幅应退化成上下排（flex-direction: column）').toBe('column');
    expect(narrow.btnTop, '窄屏按钮应在文字块下方').toBeGreaterThanOrEqual(narrow.txtBottom - 1);
    expect(Math.abs(narrow.btnW - narrow.inner), '窄屏按钮应通栏').toBeLessThanOrEqual(1);
  });
});
