// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 1)
// 排程引擎的单元测试。引擎是无 DOM 的纯逻辑（shadow/js/plan-engine.js），
// 页面以经典脚本方式加载，所以 page.evaluate 里能直接看到全局 ShadowPlan。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

declare const ShadowPlan: {
  DAY_MS: number;
  WORD_INTERVALS: number[];
  STAGES: string[];
  dayKey(ts: number, boundaryHour: number): string;
  dayDiff(a: string, b: string): number;
  wordInterval(reps: number): number;
  emptyState(): { words: Record<string, unknown> };
};

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('plan engine · day boundary', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  // currentTimeout() 只能在 test 作用域内调用（它读 test.info()），放 describe 里会直接崩收集
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
  });

  test('loads as a global with the documented surface', async ({ page }) => {
    const shape = await page.evaluate(() => ({
      hasDay: typeof ShadowPlan.dayKey === 'function',
      dayMs: ShadowPlan.DAY_MS,
      intervals: ShadowPlan.WORD_INTERVALS.length,
      stages: ShadowPlan.STAGES.join('>'),
    }));
    expect(shape.hasDay).toBe(true);
    expect(shape.dayMs).toBe(86400000);
    // 原表 21 档，末尾那档 14 天已挪进 GRADUATED_INTERVALS，所以这里是 20
    expect(shape.intervals).toBe(20);
    expect(shape.stages).toBe('fresh>seen>recognized>owned>graduated');
  });

  test('04:00 boundary keeps 03:50 on the previous day', async ({ page }) => {
    const got = await page.evaluate(() => {
      const before = new Date(2026, 8, 20, 3, 50, 0).getTime();
      const after = new Date(2026, 8, 20, 4, 10, 0).getTime();
      return [ShadowPlan.dayKey(before, 4), ShadowPlan.dayKey(after, 4)];
    });
    expect(got).toEqual(['2026-09-19', '2026-09-20']);
  });

  test('boundaryHour 0 is plain midnight and dayDiff counts calendar days', async ({ page }) => {
    const got = await page.evaluate(() => {
      const late = new Date(2026, 8, 20, 23, 30, 0).getTime();
      const early = new Date(2026, 8, 21, 0, 30, 0).getTime();
      return [ShadowPlan.dayKey(late, 0), ShadowPlan.dayKey(early, 0),
              ShadowPlan.dayDiff(ShadowPlan.dayKey(late, 0), ShadowPlan.dayKey(early, 0))];
    });
    expect(got).toEqual(['2026-09-20', '2026-09-21', 1]);
  });

  test('word interval saturates instead of running off the table', async ({ page }) => {
    const got = await page.evaluate(() => [
      ShadowPlan.wordInterval(0), ShadowPlan.wordInterval(3),
      ShadowPlan.wordInterval(20), ShadowPlan.wordInterval(999),
    ]);
    expect(got).toEqual([0, 1, 14, 14]);
  });
});
