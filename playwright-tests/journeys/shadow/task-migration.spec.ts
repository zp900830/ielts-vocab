// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 4)
// 老进度（按句记 reps）搬到新模型（按词记接触）。折扣与封顶都是刻意的，见引擎注释。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

declare const ShadowPlan: {
  migrate(oldPlan: unknown, oldProg: unknown, now: number, wordsOf: (i: number) => string[]): {
    events: unknown[]; report: Record<string, number>;
    state: { v: number; plan: Record<string, unknown>; words: Record<string, { stage: string; reps: number }>;
             daily: Record<string, Record<string, number>>; legacy: Record<string, unknown> };
  };
};

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const NOW = Date.parse('2026-09-20T09:00:00');

test.describe('progress migration: sentences → words', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
  });


  test('sentence reps become halved word contacts, and mastered never survives as mastered', async ({ page }) => {
    const got = await page.evaluate(([now, bySent]) => {
      const wordsOf = (i) => bySent[String(i)] || [];
      return ShadowPlan.migrate(
        { startDate: '2026-09-01', totalDays: 30, dailyMinutes: 15, newPerDay: 8 },
        { sentences: { 5: { reps: 6, phase: 'mastered' }, 6: { reps: 2, phase: 'learning' } },
          daily: {}, streak: 4, cycleCount: 3, pace: { new: 25, review: 8, samples: 60 } },
        now, wordsOf);
    }, [NOW, { 5: ['damp', 'humid'], 6: ['mist'] }] as [number, Record<string, string[]>]);
    expect(got.report.contacts).toBe(6 + 1);       // 5 号句 3 天 × 2 词 + 6 号句 1 次 × 1 词
    expect(got.report.cappedWords).toBe(2);        // 5 号句那两个词本来「mastered」
    expect(got.report.minutes).toBe(15);
    expect(Object.keys(got.state.words).sort()).toEqual(['damp', 'humid', 'mist']);
    expect(got.state.words.damp.reps).toBe(3);
    expect(new Set(Object.values(got.state.words).map(x => x.stage))).toEqual(new Set(['seen']));
    expect(got.state.plan.todayMinutes).toBe(15);
    expect(got.state.legacy.streak).toBe(4);
    expect(got.state.legacy.cycleCount).toBe(3);   // 「轮」转为只读快照，界面不再显示
  });

  test('migrating the same input twice produces the same state', async ({ page }) => {
    const got = await page.evaluate(([now]) => {
      const wordsOf = (i) => (i < 10 ? ['a' + i, 'b' + i] : []);
      const old = { sentences: { 1: { reps: 5 }, 2: { reps: 5 }, 3: { reps: 0 } }, daily: {}, streak: 1 };
      const p = { startDate: '2026-09-01', totalDays: 20, dailyMinutes: 20 };
      const a = ShadowPlan.migrate(p, old, now, wordsOf);
      const b = ShadowPlan.migrate(p, old, now, wordsOf);
      return { same: JSON.stringify(a.state) === JSON.stringify(b.state), n: a.events.length };
    }, [NOW] as [number]);
    expect(got.same).toBe(true);
    expect(got.n).toBe(8);                          // 4 次接触 × 2 词，3 号句 reps 0 不搬
  });

  test('empty, half-missing and garbage input all migrate without throwing', async ({ page }) => {
    const got = await page.evaluate(([now]) => {
      const wordsOf = () => ['x'];
      const cases = [[null, null], [{}, {}], [null, { sentences: {} }],
        [{ startDate: 'not-a-date', dailyMinutes: 0 }, { sentences: { 3: { reps: -5 }, bad: { reps: 9 }, 7: { reps: 99 } } }]];
      return cases.map(c => {
        try {
          const r = ShadowPlan.migrate(c[0], c[1], now, wordsOf);
          return r.state.v === 2 && r.events.length >= 0 && r.state.plan.todayMinutes >= 5 ? 'ok' : 'bad';
        } catch (e) { return 'threw: ' + e.message; }
      });
    }, [NOW] as [number]);
    expect(got).toEqual(['ok', 'ok', 'ok', 'ok']);
  });

  test('old daily history is kept as a legacy count, not silently dropped', async ({ page }) => {
    const got = await page.evaluate(([now]) => {
      const wordsOf = (i) => ['w' + i];
      return ShadowPlan.migrate({ dailyMinutes: 10 }, {
        sentences: {}, daily: { '2026-09-18': { reps: 12 }, '2026-09-19': { reps: 0 } }, streak: 3,
      }, now, wordsOf).state.daily;
    }, [NOW] as [number]);
    expect(got['2026-09-18'].legacyReps).toBe(12);
    expect(got['2026-09-19'] === undefined || got['2026-09-19'].legacyReps === undefined).toBe(true);
  });
});
