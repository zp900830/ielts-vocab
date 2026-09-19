// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 1)
// 排程引擎的单元测试。引擎是无 DOM 的纯逻辑（shadow/js/plan-engine.js），
// 页面以经典脚本方式加载，所以 page.evaluate 里能直接看到全局 ShadowPlan。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

interface WordSlot { stage: string; reps: number; err: number; due: number; leech: boolean; ctx: Record<string, number> }

declare const ShadowPlan: {
  DAY_MS: number;
  WORD_INTERVALS: number[];
  STAGES: string[];
  dayKey(ts: number, boundaryHour: number): string;
  dayDiff(a: string, b: string): number;
  wordInterval(reps: number): number;
  emptyState(): { words: Record<string, unknown> };
  newWord(): WordSlot;
  eventId(ev: unknown): string;
  mkContact(w: string, s: number | string, at: number, day: string): unknown;
  mkQuiz(w: string, s: number | string, kind: string, ok: boolean, at: number, day: string): unknown;
  mkPromote(w: string, from: string, to: string, at: number, day: string): unknown;
  replay(events: unknown[], opts: unknown): {
    words: Record<string, WordSlot>;
    sents: Record<string | number, { lastReadAt: number }>;
    daily: Record<string, Record<string, number>>;
    eventsSeen: number;
  };
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


interface Ev { w: string; s: number | string; ts: number; day: string }

test.describe('plan engine · word state reducer', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
  });

  test('reading a sentence credits every unfinished word in it, once per day', async ({ page }) => {
    const got = await page.evaluate(() => {
      const at = new Date(2026, 8, 20, 9, 0, 0).getTime();
      const bySent: Record<number, string[]> = { 5: ['damp', 'humid'], 6: ['mist'] };
      const ev = [
        ShadowPlan.mkContact('damp', 5, at, '2026-09-20'),
        ShadowPlan.mkContact('humid', 5, at, '2026-09-20'),
        // 同一句在同一天重播：不该再记一次接触，否则重播 20 遍能把词刷毕业
        ShadowPlan.mkContact('damp', 5, at + 30000, '2026-09-20'),
        ShadowPlan.mkContact('damp', 5, at + 60000, '2026-09-20'),
        ShadowPlan.mkContact('damp', 5, at + 864e5, '2026-09-21'),
        ShadowPlan.mkContact('mist', 6, at, '2026-09-20'),
      ];
      const st = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: (i: number) => bySent[i] || [] });
      return {
        damp: st.words.damp.reps, humid: st.words.humid.reps, mist: st.words.mist.reps,
        dampStage: st.words.damp.stage,
        sent5: !!st.sents['5'], daily: st.daily['2026-09-20'].sentDone,
      };
    });
    expect(got).toEqual({ damp: 2, humid: 1, mist: 1, dampStage: 'seen', sent5: true, daily: 2 });
  });

  test('recognized needs two different contexts, and a wrong answer never downgrades', async ({ page }) => {
    const got = await page.evaluate(() => {
      const T = (d: number, h = 9) => new Date(2026, 8, d, h, 0, 0).getTime();
      const wordsOf = () => ['peer'];
      const ev: unknown[] = [
        ShadowPlan.mkContact('peer', 1500, T(20), '2026-09-20'),
        ShadowPlan.mkQuiz('peer', 1500, 'recall', true, T(20, 10), '2026-09-20'),
      ];
      const half = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf });
      const withWrong = ev.concat([
        ShadowPlan.mkContact('peer', 1500, T(21), '2026-09-21'),
        ShadowPlan.mkQuiz('peer', 1500, 'recall', false, T(21, 10), '2026-09-21'),
      ]);
      const afterWrong = ShadowPlan.replay(withWrong, { boundaryHour: 4, wordsOf });
      const both = withWrong.concat([
        ShadowPlan.mkContact('peer', 1500, T(22), '2026-09-22'),
        ShadowPlan.mkQuiz('peer', 'ex', 'recall', true, T(22, 10), '2026-09-22'),
      ]);
      const two = ShadowPlan.replay(both, { boundaryHour: 4, wordsOf });
      return {
        halfStage: half.words.peer.stage,
        wrongKeepsStage: afterWrong.words.peer.stage,
        wrongErr: afterWrong.words.peer.err,
        duePulledBack: afterWrong.words.peer.due <= T(21, 23),
        twoCtxStage: two.words.peer.stage,
        ctxes: Object.keys(two.words.peer.ctx).sort().join(','),
      };
    });
    expect(got.halfStage).toBe('seen');
    expect(got.wrongKeepsStage).toBe('seen');            // 答错不倒退
    expect(got.wrongErr).toBe(1);
    expect(got.duePulledBack).toBe(true);                // 但今天之内要再见一次
    expect(got.twoCtxStage).toBe('recognized');
    expect(got.ctxes).toBe('1500,ex');
  });

  test('③ right answer makes it owned; 20 contacts plus ok3 graduates it', async ({ page }) => {
    const got = await page.evaluate(() => {
      const ev: unknown[] = [];
      for (let d = 1; d <= 25; d++) {
        const day = '2026-09-' + String(d).padStart(2, '0');
        ev.push(ShadowPlan.mkContact('gaze', 1500, Date.parse(day + 'T09:00:00'), day));
      }
      const before = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['gaze'] });
      const after = ShadowPlan.replay(
        ev.concat([ShadowPlan.mkQuiz('gaze', 1500, 'mc4zh', true, Date.parse('2026-09-26T10:00:00'), '2026-09-26')]),
        { boundaryHour: 4, wordsOf: () => ['gaze'] },
      );
      return {
        beforeReps: before.words.gaze.reps, beforeStage: before.words.gaze.stage,
        afterStage: after.words.gaze.stage,
        gradInterval: ShadowPlan.wordInterval(after.words.gaze.reps),
      };
    });
    expect(got.beforeReps).toBe(25);
    expect(got.beforeStage).toBe('seen');          // 没答对过 ③ 就不许毕业
    expect(got.afterStage).toBe('graduated');
    expect(got.gradInterval).toBe(14);
  });

  test('three wrong answers flag it as a key word but never hide it', async ({ page }) => {
    const got = await page.evaluate(() => {
      const ev: unknown[] = [];
      for (let i = 0; i < 3; i++) {
        const day = '2026-09-' + String(20 + i).padStart(2, '0');
        const at = Date.parse(day + 'T09:00:00');
        ev.push(ShadowPlan.mkContact('ooze', 1583, at, day));
        ev.push(ShadowPlan.mkQuiz('ooze', 1583, 'recall', false, at + 60000, day));
      }
      const st = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['ooze'] });
      return { err: st.words.ooze.err, leech: !!st.words.ooze.leech, stage: st.words.ooze.stage };
    });
    expect(got).toEqual({ err: 3, leech: true, stage: 'seen' });
  });

  test('event ids are content hashes, so replaying the log twice changes nothing', async ({ page }) => {
    const got = await page.evaluate(() => {
      const a = ShadowPlan.mkContact('mist', 26, 17e11, '2026-09-20');
      const b = ShadowPlan.mkContact('mist', 26, 17e11, '2026-09-20');
      const c = ShadowPlan.mkContact('mist', 27, 17e11, '2026-09-20');
      const st = ShadowPlan.replay([a, b, c, a, c], { boundaryHour: 4, wordsOf: () => ['mist'] });
      return {
        same: ShadowPlan.eventId(a) === ShadowPlan.eventId(b),
        diff: ShadowPlan.eventId(a) !== ShadowPlan.eventId(c),
        reps: st.words.mist.reps, folded: st.eventsSeen,
      };
    });
    expect(got).toEqual({ same: true, diff: true, reps: 2, folded: 2 });
  });

  test('relearn pushes a word back without rewriting history', async ({ page }) => {
    const got = await page.evaluate(() => {
      const at = Date.parse('2026-09-20T09:00:00');
      const base = [
        ShadowPlan.mkContact('peer', 1500, at, '2026-09-20'),
        ShadowPlan.mkQuiz('peer', 1500, 'recall', true, at + 1000, '2026-09-20'),
        ShadowPlan.mkQuiz('peer', 'ex', 'recall', true, at + 2000, '2026-09-20'),
        ShadowPlan.mkQuiz('peer', 1500, 'mc4zh', true, at + 3000, '2026-09-20'),
      ];
      const before = ShadowPlan.replay(base, { boundaryHour: 4, wordsOf: () => ['peer'] });
      const after = ShadowPlan.replay(
        base.concat([{ type: 'relearn', w: 'peer', ts: at + 9000, day: '2026-09-20' }]),
        { boundaryHour: 4, wordsOf: () => ['peer'] },
      );
      return { before: before.words.peer.stage, after: after.words.peer.stage,
               ctxLeft: Object.keys(after.words.peer.ctx).length, hist: after.eventsSeen };
    });
    expect(got.before).toBe('owned');
    expect(got.after).toBe('seen');
    expect(got.ctxLeft).toBe(0);
    expect(got.hist).toBe(5);            // 历史一条没删，只是加了一条用户动作
  });
});
