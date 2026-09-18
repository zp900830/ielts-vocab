// Hand-written alongside tests/e2e/shadow/carryover-queue.md
// Covers fix A1 (2026-09-18): buildQueue 的新句窗口改为按进度游标推进，不再按日历。
// 这是该引擎的第一条测试 —— 此前 SRS/计划逻辑 0 覆盖。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// 顶层 const，页面作用域可见但不是 window 属性（与 loop-mode.spec.ts 同理）
declare const TASK: {
  buildQueue(): void;
  readonly queue: Array<{ i: number; type: string }>;
  readonly progress: { sentences: Record<string, Record<string, number>> };
};

const PLAN_KEY = 'ielts-task-plan';
const PROG_KEY = 'ielts-task-progress';

const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

test.describe('Missed days carry over instead of skipping content', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/carryover-queue.md',
    });

    await test.step('Setup 1: create a plan through the UI', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
      await page.locator('#btnToday').click();
      await page.locator('.ps-start').click();
      await page.keyboard.press('Escape');
      expect(
        await page.evaluate((k) => !!localStorage.getItem(k), PLAN_KEY),
      ).toBe(true);
    });

    await test.step('Setup 2: roll startDate back 5 days, clear sentence progress', async () => {
      const back = ymd(new Date(Date.now() - 5 * 864e5));
      await page.evaluate(
        ([planKey, progKey, startDate]) => {
          const plan = JSON.parse(localStorage.getItem(planKey) || '{}');
          plan.startDate = startDate;
          localStorage.setItem(planKey, JSON.stringify(plan));
          const prog = JSON.parse(localStorage.getItem(progKey) || 'null');
          if (prog) {
            prog.sentences = {};
            localStorage.setItem(progKey, JSON.stringify(prog));
          }
        },
        [PLAN_KEY, PROG_KEY, back] as const,
      );
      await page.reload();
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  test(
    '5 days elapsed with zero progress still serves window one',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      const got = await page.evaluate((planKey) => {
        TASK.buildQueue();
        const perDay = JSON.parse(localStorage.getItem(planKey) || '{}').newPerDay;
        const news = TASK.queue.filter((x) => x.type === 'new').map((x) => x.i);
        return { perDay, min: Math.min(...news), max: Math.max(...news), count: news.length };
      }, PLAN_KEY);

      // 回归点：旧实现这里会是 5 * newPerDay，那 5 天的句子被永久跳过
      expect(got.min).toBe(0);
      expect(got.count).toBe(got.perDay);
      expect(got.max).toBe(got.perDay - 1);
    },
  );

  test(
    'cursor advances only after the window has been opened',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      const got = await page.evaluate((planKey) => {
        const perDay = JSON.parse(localStorage.getItem(planKey) || '{}').newPerDay;
        for (let i = 0; i < perDay; i++) TASK.progress.sentences[i] = { reps: 1 };
        TASK.buildQueue();
        const news = TASK.queue.filter((x) => x.type === 'new').map((x) => x.i);
        return { perDay, min: Math.min(...news), max: Math.max(...news), count: news.length };
      }, PLAN_KEY);

      expect(got.min).toBe(got.perDay);
      expect(got.count).toBe(got.perDay);
      expect(got.max).toBeLessThan(got.perDay * 2);
    },
  );
});
