// 3.0 M1 Task 3：首页六张文章卡片（熟练度 / 阶段 / 已毕业词数 / 最近学习）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；8931 那台服务的是 shadow/ 树，
// 而 /app/ 在仓库根，所以和 shell.spec.ts / smoke.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
};
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
};
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 把三份重 JSON 换成 6 篇的小壳：既让首页拿到 6 张卡片，又不再多渲一页 1833 句 + 3242 词
   （和 shell.spec.ts 同一理由：整套并行时那份额外负载会压出 shadow 用例偶发红）。
   第 0 篇给 24 句（> 20），这样造 20 句进度后正好落在「通读中」而不是「已学完」。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[word${i}:word${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 24 : 2))),
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

test.describe('3.0 首页', () => {
  test('六张卡片 + 四档状态 + 卡片数据', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await expect(page.locator('.art-card')).toHaveCount(6);
    await expect(page.locator('.art-card .a-title').first()).toHaveText('地球与生命');
    // 全新用户：六张全是「未开始」
    expect(await page.locator('.art-card[data-stage="todo"]').count()).toBe(6);
    // 造点进度 → 第一篇变「通读中」，且熟练度 > 0
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      const s = ShadowPlan.articleScope(SECTIONS, 0);
      Array.from(s).slice(0, 20).forEach((i: number) => TASK.readDone(i));
    });
    await page.reload();
    const c0 = page.locator('.art-card').first();
    await expect(c0).toHaveAttribute('data-stage', 'reading');
    expect(Number(await c0.locator('.a-pct').innerText().then(t => t.replace('%', '')))).toBeGreaterThan(0);
  });
});
