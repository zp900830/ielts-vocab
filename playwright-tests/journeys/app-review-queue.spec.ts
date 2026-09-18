// Covers fix A2 (2026-09-18): 目标词纳入间隔复习队列。
// 主站业务逻辑此前 0 测试覆盖（smoke.spec.ts 只验标题与两个按钮）。

import { test, expect } from '../fixtures';
import { startRootServer, stopRootServer } from '../utils/root-server';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// 顶层 let/const：页面作用域可见，但不是 window 属性
declare const STORIES: Array<{ id: string }>;
declare const S: {
  fav: Record<string, unknown>;
  rv: Record<string, { due: number; rv: number; src?: string }>;
};
declare const REVIEW: { queue: string[]; total: number } | null;
declare function openStory(id: string): void;
declare function dueWords(): Array<[string, unknown]>;
declare function startReview(): void;
declare function revealReview(): void;
declare function gradeReview(know: boolean): void;

let rootUrl = '';

test.beforeAll(async () => {
  rootUrl = await startRootServer();
});

test.afterAll(async () => {
  await stopRootServer();
});

test.describe('Read story words enter the spaced-review queue', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page }, testInfo) => {
    testInfo.setTimeout(60000);
    await test.step('Setup: fresh profile, wait for data', async () => {
      await page.goto(`${rootUrl}/index.html`);
      await page.evaluate(() => localStorage.clear());
      await page.reload();
      await page.waitForFunction(
        () => typeof STORIES !== 'undefined' && STORIES.length > 0,
        undefined,
        { timeout: 20000 },
      );
    });
  });

  test(
    'opening a story schedules its target words without any favorite',
    { tag: ['@regression', '@positive', '@app'] },
    async ({ page }) => {
      const got = await page.evaluate(async () => {
        openStory(STORIES[0].id);
        await new Promise((r) => setTimeout(r, 500));
        return {
          favCount: Object.keys(S.fav).length,
          rvCount: Object.keys(S.rv).length,
          due: dueWords().length,
        };
      });

      expect(got.favCount).toBe(0);
      // 回归点：旧实现 dueWords() 只遍历 S.fav，这里必然是 0
      expect(got.rvCount).toBeGreaterThan(0);
      expect(got.due).toBe(got.rvCount);
    },
  );

  test(
    'review session grades without throwing and schedules next due',
    { tag: ['@regression', '@positive', '@app'] },
    async ({ page }) => {
    const got = await page.evaluate(async () => {
        openStory(STORIES[0].id);
        await new Promise((r) => setTimeout(r, 400));
        startReview();
        const first = REVIEW!.queue[0];
        const total = REVIEW!.total;
        revealReview();
        gradeReview(true);
        await new Promise((r) => setTimeout(r, 200));
        const known = { rv: S.rv[first].rv, pushed: S.rv[first].due > Date.now() };

        const second = REVIEW!.queue[0];
        revealReview();
        gradeReview(false);
        await new Promise((r) => setTimeout(r, 200));
        return {
          first,
          total,
          known,
          requeued: REVIEW!.queue.includes(second),
          soonAgain: S.rv[second].due - Date.now() < 6 * 60000,
        };
      });

      expect(got.total).toBeGreaterThan(0);
      expect(got.total).toBeLessThanOrEqual(30);
      expect(got.known.rv).toBe(1);
      expect(got.known.pushed).toBe(true);
      expect(got.requeued).toBe(true);
      expect(got.soonAgain).toBe(true);
    },
  );
});
