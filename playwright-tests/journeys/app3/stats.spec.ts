// 3.0 M2：学习数据页（PRD §5）。服务器归 global-setup.ts 起停（仓库根 8932）；
// /app/ 在仓库根，所以和 shell.spec.ts / home.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

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

test.describe('3.0 学习数据页（M2，PRD §5）', () => {
  test('未开始：一句话 + 一个按钮，点了打开「我的」浮窗，不内嵌计划表单', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.v2'));
    await page.reload();

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
});
