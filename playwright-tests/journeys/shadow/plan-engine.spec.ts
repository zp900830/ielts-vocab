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
  assemble(state: unknown, opts: unknown): {
    queue: { kind: string; i: number; pool: string; sec: number; words: string[] }[];
    items: { kind: string; pass: number; s: number | string; w: string; pool: string }[];
    words: string[];
    stats: Record<string, unknown>;
  };
  recallQuiz(o: unknown): { kind: string; blank: string; initial: string; len: number; pos: string; colFirst: string; answer: string };
  meaningQuiz(o: unknown): { kind: string; opts: string[]; answer: string } | null;
  judgeRecall(input: string, answer: string): boolean;
  editDistance(a: string, b: string): number;
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


// 夹具：60 句 × 每句 2 个词。0–9 句已毕业，10–49 句到期，50 句以后全新。
const FIXTURE = `(function (mkContact, mkQuiz, DAY_MS) {
  const ev = [];
  const now = Date.parse('2026-09-20T09:00:00');
  const at = (d, h) => now - d * DAY_MS + (h || 0) * 36e5;
  for (let i = 0; i < 60; i++) {
    const ws = ['w' + i + 'a', 'w' + i + 'b'];
    for (const w of ws) {
      if (i < 10) {
        for (let k = 0; k < 21; k++) ev.push(mkContact(w, i, at(60 - k), 'day-' + k));
        ev.push(mkQuiz(w, i, 'mc4zh', true, at(5), 'day-x'));
      } else if (i < 50) {                           // 到期复习：40 句 × 2 个词
        ev.push(mkContact(w, i, at(10), 'old'));
      }
    }
  }
  return ev;
})`;

test.describe('plan engine · time budget', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
  });

  const run = (page: import('@playwright/test').Page, minutes: number) =>
    page.evaluate(([mins, src]) => {
      const ev = (new Function('return ' + src)())(
        ShadowPlan.mkContact, ShadowPlan.mkQuiz, ShadowPlan.DAY_MS);
      const st = ShadowPlan.replay(ev, {
        boundaryHour: 4,
        wordsOf: (i: number) => (i >= 0 && i < 60 ? ['w' + i + 'a', 'w' + i + 'b'] : []),
      });
      return ShadowPlan.assemble(st, {
        now: Date.parse('2026-09-20T09:00:00'), todayMinutes: mins, rate: 1,
        secNew: 25, secReview: 8, secQuiz: 6,
        wordsOf: (i: number) => (i >= 0 && i < 60 ? ['w' + i + 'a', 'w' + i + 'b'] : []),
        totalSents: 60, boundaryHour: 4,
      });
    }, [minutes, FIXTURE] as [number, string]);

  test('a 10-minute day fits 10 minutes and says how much it had to leave out', async ({ page }) => {
    const got = await run(page, 10);
    expect(got.queue.length).toBeGreaterThan(0);
    expect(got.queue.length).toBeLessThan(40);   // 40 句到期，10 分钟装不下
    expect((got.stats as Record<string, number>).usedSec).toBeLessThanOrEqual(601);
    expect((got.stats as Record<string, number>).droppedA).toBeGreaterThan(0);
    expect((got.stats as Record<string, number>).dueWords).toBeGreaterThan(0);
  });

  test('more time only ever adds sentences', async ({ page }) => {
    const a = await run(page, 10);
    const b = await run(page, 30);
    const ai = a.queue.map(q => q.i), bi = b.queue.map(q => q.i);
    expect(bi.length).toBeGreaterThan(ai.length);
    expect(ai.every(i => bi.indexOf(i) >= 0)).toBe(true);
    expect((b.stats as Record<string, number>).usedSec).toBeLessThanOrEqual(1801);
  });

  test('new words only show up when the review did not eat the day', async ({ page }) => {
    const tight = await run(page, 8);
    const loose = await run(page, 45);
    expect(tight.queue.some(q => q.pool === 'C')).toBe(false);
    expect(loose.queue.some(q => q.pool === 'C')).toBe(true);
  });

  test('quiz slots and reading time add up to exactly what the budget reports', async ({ page }) => {
    const got = await run(page, 20);
    const read = got.queue.reduce((a, q) => a + q.sec, 0);
    expect((got.stats as Record<string, number>).usedSec).toBe(read + got.items.length * 6);
    expect(got.items.filter(x => x.pass === 2).length).toBeGreaterThanOrEqual(got.queue.length);
    expect(got.items.filter(x => x.pass === 3).length).toBe(got.queue.length);
  });

  test('a zero-minute day still serves the floor task instead of nothing', async ({ page }) => {
    const got = await run(page, 0);
    expect(got.stats.floor).toBe(true);
    expect(got.queue.length).toBe(1);
    expect(got.items.length).toBeGreaterThan(0);
  });

  test('the plan carries no debt-shaped field anywhere', async ({ page }) => {
    const got = await run(page, 12);
    const dump = JSON.stringify(got);
    expect(/debt|backlog|pending|overdue/i.test(dump)).toBe(false);
    expect(got.queue.every(q => q.kind === 'sent')).toBe(true);
    expect(got.items.every(x => x.kind === 'quiz')).toBe(true);
  });
});

test.describe('quiz builder', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 4);
    await page.goto(`${baseURL}/index.html`);
  });

  test('recall keeps the word length and shows the answer only in the answer field', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.recallQuiz({
      sent: 72, word: 'damp', disp: 'damp',
      sentZh: '深夜里，外套被雨打湿，摸上去还是又冷又潮。',
      card: { m: 'adj. 潮湿的', note: '词伙：damp clay' },
    }));
    expect(got.kind).toBe('recall');
    expect(got.blank).toBe('d _ _ _');
    expect(got.initial).toBe('d');
    expect(got.len).toBe(4);
    expect(got.pos).toBe('adj.');
    expect(got.colFirst).toBe('damp');
    expect(got.answer).toBe('damp');
  });

  test('meaning quiz takes distractors from the same paragraph and rejects overlapping senses', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.meaningQuiz({
      sent: 1500, word: 'peer',
      card: { m: 'v. 凝视；费力看；n. 同辈' },
      paraCards: { gaze: 'n. 凝视；注视', steady: 'adj. 稳定的；使稳住', road: 'n. 路，道路' },
    }));
    expect(got).not.toBeNull();
    const q = got as { kind: string; opts: string[]; answer: string };
    expect(q.kind).toBe('mc4zh');
    expect(q.opts.length).toBe(4);
    expect(q.opts).toContain(q.answer);
    expect(new Set(q.opts).size).toBe(4);
  });

  test('meaning quiz refuses to build when four clean options are not available', async ({ page }) => {
    const got = await page.evaluate(() => ShadowPlan.meaningQuiz({
      sent: 26, word: 'mist', card: { m: 'n. 薄雾' }, paraCards: { bay: 'n. 海湾' },
    }));
    expect(got).toBe(null);
  });

  test('recall judging tolerates one typo but not a different word', async ({ page }) => {
    const got = await page.evaluate(() => ({
      exact: ShadowPlan.judgeRecall('DAMP', 'damp'),
      spaced: ShadowPlan.judgeRecall(' damp ', 'damp'),
      inflect: ShadowPlan.judgeRecall('damps', 'damp'),
      near: ShadowPlan.judgeRecall('wet', 'damp'),
      far: ShadowPlan.judgeRecall('humid', 'damp'),
      empty: ShadowPlan.judgeRecall('', 'damp'),
      dist: [ShadowPlan.editDistance('kitten', 'sitting'), ShadowPlan.editDistance('a', 'a')],
    }));
    expect(got).toEqual({ exact: true, spaced: true, inflect: true, near: false,
                          far: false, empty: false, dist: [3, 0] });
  });
});

/* ---------- Task 1：replay 的「接着算」入口（docs/superpowers/plans/2026-09-21 §Task 1） ----------
   引擎侧唯一的改动是给 replay 加一个可选 opts.state。不传 = 与今天逐字一致（从空重建），
   所以上面那批旧用例一条都不该被动到 —— 那本身就是本任务的一半验收。 */
test.describe('replay 续算（opts.state）', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('只喂新事件 ≡ 全量重放，最终毕业数必须逐词相等', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const out = await page.evaluate(() => {
      const ev: unknown[] = [];
      const t0 = Date.now();
      const PER_DAY = 24;                       // 6 个只露一面的新词 + 6 个回炉词 ×3 条事件
      // 30 天。每天见 6 个全新词（撑大词表，让 sameKeys 不是个空检查），
      // 外加 6 个「回炉词」每天 contact + ② + ③ 各一次 —— 毕业判据是 reps>=20 && ok3>=1，
      // 只露一面的新词永远毕不了业，没有这 6 个回炉词的话末尾那条 fullGrad>0 就是空断言。
      for (let d = 0; d < 30; d++) {
        const ts = t0 + d * 864e5;
        const day = ShadowPlan.dayKey(ts, 4);
        for (let k = 0; k < 6; k++) {
          ev.push(ShadowPlan.mkContact('w' + (d * 6 + k), d * 6 + k, ts, day));
        }
        for (let k = 0; k < 6; k++) {
          const w = 'c' + k;
          ev.push(ShadowPlan.mkContact(w, 1000 + k, ts, day));
          ev.push(ShadowPlan.mkQuiz(w, 1000 + k, 'recall', true, ts, day));
          ev.push(ShadowPlan.mkQuiz(w, 1000 + k, 'mc4zh', true, ts, day));
        }
      }
      const full = ShadowPlan.replay(ev, { boundaryHour: 4 });
      let inc = ShadowPlan.emptyState();
      for (let d = 0; d < 30; d++) {
        inc = ShadowPlan.replay(ev.slice(d * PER_DAY, (d + 1) * PER_DAY), { state: inc, boundaryHour: 4 });
      }
      const grad = (s: any) => Object.keys(s.words).filter((k) => s.words[k].stage === 'graduated').length;
      return {
        fullGrad: grad(full), incGrad: grad(inc),
        sameKeys: JSON.stringify(Object.keys(full.words).sort()) === JSON.stringify(Object.keys(inc.words).sort()),
      };
    });
    expect(out.sameKeys).toBe(true);
    expect(out.incGrad).toBe(out.fullGrad);
    expect(out.fullGrad).toBeGreaterThan(0);      // 都为 0 的话这条断言是空的
  });

  // 契约测试（不是"待修的坏行为"）：传了 opts.state 就是**原地续算**，replay 不替你深拷。
  // 故意的 —— estimateDays 要在一上千天的循环里天天调它，内部深拷等于每天重拷一份 3245 词的表。
  // 所以"先自己拷一份再喂进来"是调用方的责任（Task 2 计划里「两条不能省」第 ① 条）。
  // 哪天有人给 replay 加了内部深拷，这条会红：那是性能回退，不是 bug 被修好了。
  test('replay 带 opts.state 是原地续算：深拷是调用方的责任', async ({ page, baseURL }) => {
    await page.goto(`${baseURL}/index.html`);
    const mutated = await page.evaluate(() => {
      const base = ShadowPlan.replay([ShadowPlan.mkContact('alpha', 1, Date.now(), '2026-09-21')], { boundaryHour: 4 });
      const snap = JSON.stringify(base);
      ShadowPlan.replay([ShadowPlan.mkContact('beta', 2, Date.now() + 864e5, '2026-09-22')], { state: base, boundaryHour: 4 });
      return JSON.stringify(base) !== snap;
    });
    expect(mutated).toBe(true);
  });
});
