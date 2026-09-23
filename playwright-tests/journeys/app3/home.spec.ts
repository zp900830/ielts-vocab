// 3.0 M1 Task 3：首页六张文章卡片（熟练度 / 阶段 / 已毕业词数 / 最近学习）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；8931 那台服务的是 shadow/ 树，
// 而 /app/ 在仓库根，所以和 shell.spec.ts / smoke.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

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

const rootUrl = process.env.E2E_ROOT_URL || '';

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
    await expect(c0).toHaveAttribute('data-stage', 'reading');
    await expect(c0.locator('.a-stage')).toHaveText('通读中');
    expect(await pctOf(page), '20/24 × 40% 四舍五入 = 33').toBe(33);
    expect(await pctOf(page), 'M1 只实现第一项，熟练度不得超过 40').toBeLessThanOrEqual(40);

    // —— 读满 24 句 → 「② 可答题」（§9.4：通读满还没做题，`已学完` 留给通读+② 各一遍）——
    await page.evaluate(() => {
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(20).forEach((i: number) => TASK.readDone(i));
    });
    await page.reload();
    await expect(c0).toHaveAttribute('data-stage', 'read');
    await expect(c0.locator('.a-stage')).toHaveText('② 可答题');
    expect(await pctOf(page), '通读满 → 40%（② / 精读两项都还是 0）').toBe(40);
  });

  // Task 4：顶部「今天该做什么」横幅 + 没计划的空状态（§2.3 / §3.5）。
  // 复用影子跟读现成的 renderSetup（设置屏），落在 #setupSheet 容器里；建完计划横幅改口「继续学」。
  test('没计划 → 横幅给「去设置」；有计划 → 给「继续学」', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await page.reload();
    await expect(page.locator('#homeBanner .b-go')).toContainText('设置');
    // 点它 → 出设置屏（复用影子跟读的 renderSetup，套在 #setupSheet 里）
    await page.locator('#homeBanner .b-go').click();
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();
    await page.locator('#setupSheet .ps-opt').nth(2).click();      // 15 分钟
    await page.locator('#setupSheet .ps-start').click();
    await expect(page.locator('#homeBanner .b-go')).toContainText('继续学');
    // 建完计划横幅补一条连续/毕业摘要（§3.5 第四类）
    await expect(page.locator('#homeBanner .hb-sum')).toContainText('连续');
    await expect(page.locator('#homeBanner .hb-sum')).toContainText('已毕业');
  });
});
