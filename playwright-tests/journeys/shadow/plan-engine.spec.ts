// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 1)
// 排程引擎的单元测试。引擎是无 DOM 的纯逻辑（shadow/js/plan-engine.js），
// 页面以经典脚本方式加载，所以 page.evaluate 里能直接看到全局 ShadowPlan。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { waitShadowReady } from '../../utils/app-ready';

interface WordSlot { stage: string; reps: number; err: number; due: number; leech: boolean; ctx: Record<string, number> }

// 页面里 TASK 是脚本顶层的 const —— 顶层 const 不挂到 window 上，
// 所以只能像其他用例那样按名字引用它，写成 window.TASK 会恒为 undefined。
declare const TASK: {
  sentTotal(): number;
  sentWordsOf(i: number): string[];
  blankQuizFor(s: number | string, w: string, from?: number): unknown;
};

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
    items: { kind: string; pass: number; s: number | string; w: string; pool: string; from?: number }[];
    words: string[];
    stats: Record<string, unknown>;
  };
  recallQuiz(o: unknown): { kind: string; blank: string; initial: string; len: number; pos: string; colFirst: string; answer: string };
  meaningQuiz(o: unknown): { kind: string; opts: string[]; answer: string } | null;
  blankQuiz(o: unknown): {
    kind: string; s: number | string; w: string; answer: string; opts: string[];
    sense: string; pos: string; prompt: string;
  } | null;
  judgeRecall(input: string, answer: string): boolean;
  editDistance(a: string, b: string): number;
  mkPromote(w: string, from: string, to: string, at: number, day: string): unknown;
  replay(events: unknown[], opts: unknown): {
    words: Record<string, WordSlot>;
    sents: Record<string | number, { lastReadAt: number }>;
    daily: Record<string, Record<string, number>>;
    eventsSeen: number;
  };
  countPassed: (st: any) => number;
  estimateDays: (state: any, minutes: number, opts: any) => {
    passedNow: number; total: number; done: boolean; days: number | null;
    doneAt: number | null; atHorizon: { days: number; passed: number; at: number } | null;
    capped: boolean; empty: boolean;
  };
  articleScope(sections: unknown, article: number): Set<number>;
  wordArticle(sections: unknown, word: string): number[];
  countStagesOf(state: unknown, scope: Set<number> | null, wordsOf?: (i: number) => string[]):
    { seen: number; recognized: number; owned: number; graduated: number; leech: number };
};

// 影子跟读页的顶层数据（经典脚本的全局绑定，不在 window 上但 evaluate 里按名字可引用）
declare const SECTIONS: { paragraphs: string[][] }[];

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

  test('② 答对既记语境也记 ok3；接触够门槛 + ok3 才毕业（门槛的具体数字锁在下面那条）', async ({ page }) => {
    // 两步制（docs/superpowers/specs/2026-09-22-任务模式两步制.md D1）：毕业凭据 mc4zh 事件
    // 由 ② 挖空选择产生（原来是 ③ 选义）。字段名 ok3 与 stageOf 的判据一个字都没改。
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
        ctxBanked: after.words.gaze.ctx['1500'] || 0,
        gradInterval: ShadowPlan.wordInterval(after.words.gaze.reps),
      };
    });
    expect(got.beforeReps).toBe(25);
    expect(got.beforeStage).toBe('seen');          // 没答对过 ② 就不许毕业（判据没动）
    expect(got.ctxBanked).toBe(1);                 // 答对同时把这一个语境记上：认得出与直连是同一道题给的
    expect(got.afterStage).toBe('graduated');
    expect(got.gradInterval).toBe(14);
  });

  /* 门槛这个数本期从 20 改到 12（决策记录 scheduling-decisions-round3 第 1 条），
     上面那条用 25 次接触，改门槛它照样绿 —— 等于没锁。这条专门卡在边界上：
     谁再动 MASTER_REPS，要么这里是红的，要么他得同时来改这条，逼他看见这个决定。 */
  test('毕业门槛锁死在 12 次：差一次不毕业，够一次才毕业', async ({ page }) => {
    const got = await page.evaluate((gate: number) => {
      const t0 = Date.parse('2026-01-05T09:00:00');
      const build = (reps) => {
        const ev: unknown[] = [];
        for (let d = 0; d < reps; d++) {
          const ts = t0 + d * 864e5;
          ev.push(ShadowPlan.mkContact('gk', 0, ts, ShadowPlan.dayKey(ts, 4)));
        }
        const q = t0 + 60 * 864e5;                    // ② 遥遥放在最后，不与接触同日
        ev.push(ShadowPlan.mkQuiz('gk', 0, 'mc4zh', true, q, ShadowPlan.dayKey(q, 4)));
        return ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: () => ['gk'] }).words.gk.stage;
      };
      return { at: build(gate), oneShort: build(gate - 1), engineGate: ShadowPlan.MASTER_REPS };
    }, 12);
    expect(got.engineGate).toBe(12);
    expect(got.at).toBe('graduated');
    expect(got.oneShort).toBe('owned');               // 答对过 ② 但差一次接触 → 还不能毕业
  });

  test('② 答错只记 err，既不给语境也不给毕业凭据', async ({ page }) => {
    const got = await page.evaluate(() => {
      const at = Date.parse('2026-09-20T09:00:00');
      const st = ShadowPlan.replay([
        ShadowPlan.mkContact('gaze', 1500, at, '2026-09-20'),
        ShadowPlan.mkQuiz('gaze', 1500, 'mc4zh', false, at + 60000, '2026-09-20'),
      ], { boundaryHour: 4, wordsOf: () => ['gaze'] });
      return { stage: st.words.gaze.stage, ctx: Object.keys(st.words.gaze.ctx).length,
               err: st.words.gaze.err, ok3: st.words.gaze.ok3, dueToday: st.words.gaze.due <= at + 864e5 };
    });
    expect(got).toEqual({ stage: 'seen', ctx: 0, err: 1, ok3: 0, dueToday: true });
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
        secNew: 25, secReview: 8,
        wordsOf: (i: number) => (i >= 0 && i < 60 ? ['w' + i + 'a', 'w' + i + 'b'] : []),
        totalSents: 60, boundaryHour: 4,
      });
    }, [minutes, FIXTURE] as [number, string]);

  test('一个短日子装不下全部到期词时，必须说清漏了多少', async ({ page }) => {
    // D10 后一句只算通读时间（8 秒），5 分钟 = 300 秒最多装 37 句 —— 40 句到期仍然装不下。
    // 这条守的不是"10 分钟"或"5 分钟"这个数，是「装不下的部分要报出来」。
    const got = await run(page, 5);
    expect(got.queue.length).toBeGreaterThan(0);
    expect(got.queue.length).toBeLessThan(40);   // 40 句到期，5 分钟装不下
    expect((got.stats as Record<string, number>).usedSec).toBeLessThanOrEqual(301);
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

  test('预算里只有通读时间：做题不占一分钟（D10）', async ({ page }) => {
    const got = await run(page, 20);
    const read = got.queue.reduce((a, q) => a + q.sec, 0);
    // D10 前是 usedSec = 句时 + 题数 × 每题；现在题目照出（一句一题），但【不占预算】。
    // 他原话：「这个时间用通读时间算，不加挖空选词了」。别把 6 秒加回去 —— 那会让工期数字又变吓人。
    expect((got.stats as Record<string, number>).usedSec).toBe(read);
    expect(got.items.every(x => x.pass === 2)).toBe(true);
    expect(got.items.filter(x => x.s !== 'ex').length).toBe(got.queue.length);
    expect(got.items.filter(x => x.pass === 3).length).toBe(0);
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

  /* ---------- ② 挖空选择（两步制规格 §2 / D4 / D5）----------
     与 ③ 共用同一台四选一机器：候选必须是目标词、同词性、且出自这个词的已裁决辨析组
     （组不足三个再补同段目标词，PRD §7.2 的两档供给）。义项与答案在这一句里重叠的
     候选等于「填进去也对」，一律不许进选项；凑不满四个 → 返回 null = 这道题不出。 */
  const BLANK_FIXTURE = {
    sent: 1500, word: 'peer', card: { m: 'v. 凝视；费力看' },
    sense: 'v. 凝视', sentZh: '他凝视着路面。',
    // 辨析组里的兄弟词义项都跟「凝视」不重叠，才有资格当干扰项（重叠 = 填进去也对）
    groupCards: { gaze: { m: 'v. 注视' }, stare: { m: 'v. 盯着看' }, glance: { m: 'v. 一瞥' } },
    paraCards: { road: { m: 'n. 路，道路' }, wet: { m: 'adj. 潮湿的' } },
  };

  test('② 出四个英文候选，正确答案就是被挖掉的那个词头', async ({ page }) => {
    const got = await page.evaluate((f) => ShadowPlan.blankQuiz(f), BLANK_FIXTURE as any) as
      { kind: string; w: string; answer: string; opts: string[]; sense: string; pos: string };
    expect(got.kind).toBe('mc4zh');                 // D1：② 答对记的就是原 ③ 的那个事件类型
    expect(got.answer).toBe('peer');
    expect(got.w).toBe('peer');
    expect(got.pos).toBe('v.');
    expect(got.sense).toBe('v. 凝视');               // 提示要用：译文里下划线的就是它
    expect(got.opts.length).toBe(4);
    expect(new Set(got.opts).size).toBe(4);
    expect(got.opts.filter(o => o === 'peer').length).toBe(1);
    expect(got.opts.every(o => /^[a-z ]+$/.test(o))).toBe(true);   // 选项是英文词，不是中文义项
  });

  test('② 的候选优先取自该词的已裁决辨析组，组里凑够就不动补池', async ({ page }) => {
    const got = await page.evaluate((f) => {
      const q = ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: { gaze: { m: 'v. 注视' }, stare: { m: 'v. 盯着看' }, glance: { m: 'v. 一瞥' } },
        paraCards: { peek: { m: 'v. 偷看' }, peep: { m: 'v. 瞥见' } },
      }));
      const noGroup = ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: {}, paraCards: { gaze: { m: 'v. 注视' }, stare: { m: 'v. 盯着看' }, glance: { m: 'v. 一瞥' } },
      }));
      return { withGroup: q && q.opts, onlyPool: noGroup && noGroup.opts };
    }, BLANK_FIXTURE as any);
    // 组内三个成员全进，补池一个都不进 —— 补池只是组不够时的第二档（PRD §7.2）
    expect(got.withGroup).toEqual(expect.arrayContaining(['peer', 'gaze', 'stare', 'glance']));
    expect(got.withGroup).not.toContain('peek');
    expect(got.withGroup).not.toContain('peep');
    expect(got.onlyPool).toEqual(expect.arrayContaining(['peer', 'gaze', 'stare', 'glance']));
  });

  test('② 不许把词性不合、或义项与本句重叠（填进去也对）的词当干扰项', async ({ page }) => {
    const got = await page.evaluate((f) => {
      const pos = ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: { gaze: { m: 'v. 注视' }, stare: { m: 'v. 盯着看' }, glance: { m: 'v. 一瞥' } },
        paraCards: { road: { m: 'n. 路，道路' } },
      }));
      const clash = ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: { gaze: { m: 'v. 注视' }, stare: { m: 'v. 盯着看' }, look: { m: 'v. 看；凝视' } },
        paraCards: { glance: { m: 'v. 一瞥' } },
      }));
      return { pos: pos && pos.opts, clash: clash && clash.opts };
    }, BLANK_FIXTURE as any);
    expect(got.pos).toBeTruthy();
    expect(got.pos).not.toContain('road');          // n. 填不进动词位
    expect(got.clash).toBeTruthy();
    expect(got.clash).not.toContain('look');        // 义项与本句重叠 = 两个都对 = 双解题
  });

  test('② 凑不出三个合格干扰项就返回 null（不出题，也不降级成默写）', async ({ page }) => {
    const got = await page.evaluate((f) => ({
      short: ShadowPlan.blankQuiz(Object.assign({}, f, { groupCards: { gaze: { m: 'v. 凝视' } }, paraCards: {} })),
      noSense: ShadowPlan.blankQuiz(Object.assign({}, f, { sense: '', card: {} })),
    }), BLANK_FIXTURE as any);
    expect(got.short).toBe(null);
    expect(got.noSense).toBe(null);                 // 连「这一句里的意思」都挑不出来 → 无法证明唯一 → 不出
  });

  test('② 的选项顺序是确定性的：同句同词永远同一个排布', async ({ page }) => {
    const got = await page.evaluate((f) => [
      ShadowPlan.blankQuiz(f).opts.join('|'), ShadowPlan.blankQuiz(f).opts.join('|'),
    ], BLANK_FIXTURE as any);
    expect(got[0]).toBe(got[1]);
  });

  /* 补考换序（他 2026-09-22 拍：补考不许和原题长一模一样，否则考的是"记得哪个位置"）。
     salt 只许动排法：候选池、三道闸、答案本体都不许跟着变；不传 salt 的老路径一个字不许动。
     "顺序一定不同"不能靠运气 —— 换种子有 1/24 的概率恰好洗回原样，所以引擎撞上就左旋一格；
     下面那 60 个 (句,词) 组合就是在验这条保证有没有漏网的。 */
  test('② 的 salt 只换排法：同一批四个词、顺序必不同、不传 salt 的排布不许变', async ({ page }) => {
    const got = await page.evaluate((f) => {
      const J = (a: string[]) => a.slice().sort().join('|');
      const base = ShadowPlan.blankQuiz(f);
      const plain = ShadowPlan.blankQuiz(Object.assign({}, f, { salt: '' }));
      const salted = ShadowPlan.blankQuiz(Object.assign({}, f, { salt: 'retake' }));
      const bad: string[] = [];
      for (let n = 0; n < 60; n++) {
        const b = ShadowPlan.blankQuiz(Object.assign({}, f, { sent: n }));
        const s = ShadowPlan.blankQuiz(Object.assign({}, f, { sent: n, salt: 'retake' }));
        if (!b || !s) { bad.push('null:' + n); continue; }
        if (b.opts.join('|') === s.opts.join('|')) bad.push('same-order:' + n);
        if (J(b.opts) !== J(s.opts)) bad.push('changed-set:' + n);
      }
      return {
        base: base && base.opts.join('|'), plain: plain && plain.opts.join('|'),
        salted: salted && salted.opts.join('|'), saltedSorted: salted && J(salted.opts),
        baseSorted: base && J(base.opts), bad,
        answerSame: !!base && !!salted && base.answer === salted.answer,
      };
    }, BLANK_FIXTURE as any);
    expect(got.base).toBeTruthy();
    expect(got.plain).toBe(got.base);                       // 空 salt ≡ 不传：既有排布没被打扰
    expect(got.salted).not.toBe(got.base);                  // 补考看得见不同的排法
    expect(got.saltedSorted).toBe(got.baseSorted);          // 但还是那四个词
    expect(got.answerSame).toBe(true);
    expect(got.bad).toEqual([]);
  });

  test('② 组与同段都不够三个时，用整本同词性的词补第三档（仍受词性闸与双解闸管）', async ({ page }) => {
    const got = await page.evaluate((f) => ({
      noBook: ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: { gaze: { m: 'v. 注视' } }, paraCards: { road: { m: 'n. 路' } },
      })),
      withBook: ShadowPlan.blankQuiz(Object.assign({}, f, {
        groupCards: { gaze: { m: 'v. 注视' } }, paraCards: { road: { m: 'n. 路' } },
        bookCards: {
          peek: { m: 'v. 偷看' }, peep: { m: 'v. 瞥见' }, scan: { m: 'v. 扫描' },
          stare: { m: 'v. 盯着看' }, asphalt: { m: 'n. 柏油路' }, look: { m: 'v. 看；凝视' },
        },
      })),
    }), BLANK_FIXTURE as any);
    expect(got.noBook).toBe(null);                      // 没有第三档 = 这种词一局题都出不了
    expect(got.withBook).toBeTruthy();
    const opts: string[] = got.withBook.opts;
    expect(opts.length).toBe(4);
    expect(opts).not.toContain('asphalt');              // n. 填不进动词位
    expect(opts).not.toContain('look');                 // 义项与本句重叠 = 两个都对
    expect(opts.filter(o => ['gaze', 'peek', 'peep', 'scan', 'stare'].indexOf(o) >= 0).length).toBe(3);
  });

  /* 全库不变式。为什么值得为它单跑一遍全表（约十秒）：
     estimateDays 的模拟默认「排进来的每道题都出得出来」，而界面规则是凑不满四个
     合格干扰项就不出题。两者一旦不一致，那些词永远拿不到毕业凭据，界面上那句
     「全部过约 2028 年 6 月」就是空头承诺 —— 而这个偏差在界面上看不出来。
     余量 5 个：实测全书只剩 million / billion（num. 卡太少，凑不满四个同词性选项）。 */
  test('全库不变式：几乎每个词都至少有一处出得了题，否则工期数字是假的', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 12);
    await page.goto(`${baseURL}/index.html`);
    await expect.poll(() => page.evaluate(() =>
      (typeof TASK === 'undefined' || !TASK.sentTotal) ? 0 : TASK.sentTotal()),
      { timeout: 30_000 }).toBeGreaterThan(1000);
    const r = await page.evaluate(() => {
      const byWord: Record<string, number[]> = {};
      for (let i = 0; i < TASK.sentTotal(); i++) {
        (TASK.sentWordsOf(i) || []).forEach((w: string) => { (byWord[w] = byWord[w] || []).push(i); });
      }
      const dead: string[] = [];
      Object.keys(byWord).forEach((w) => {
        for (const i of byWord[w]) if (TASK.blankQuizFor(i, w)) return;
        dead.push(w);
      });
      return { words: Object.keys(byWord).length, dead };
    });
    expect(r.words).toBeGreaterThan(3000);              // 确实扫到了全表，不是空跑
    expect(r.dead.length).toBeLessThanOrEqual(5);
    expect(r.dead.every(w => ['million', 'billion'].indexOf(w) >= 0)).toBe(true);
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
      // 外加 6 个「回炉词」每天 contact + 一题回忆 + 一题四选一（mc4zh）各一次 —— 毕业判据是
      // reps>=MASTER_REPS && ok3>=1（本期门槛 20→12）；两步制后 mc4zh 由 ② 产生（D1），
      // 事件类型与判据都没改，
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

/* ---------- Task 2：estimateDays —— 全项目唯一那份「要多久」的算式（规格 §4.1） ----------
   夹具沿用上面 time-budget 那套写法（60 句 × 每句 2 词 = 120 词），不另造词表。
   est() 从空 state 冷启动；分钟数之外只注入 maxDays / accuracy。 */
test.describe('estimateDays', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  const est = (page: any, minutes: number, extra?: any) => page.evaluate((a: any) => {
    const st = ShadowPlan.replay([], { boundaryHour: 4 });
    return ShadowPlan.estimateDays(st, a.minutes, {
      totalSents: 60, wordsOf: (i: number) => ['w' + (i * 2), 'w' + (i * 2 + 1)],
      totalWords: 120, now: Date.UTC(2026, 8, 21), boundaryHour: 4, plan: null,
      maxDays: a.maxDays, accuracy: a.accuracy,   // 不传就走引擎默认（1095）：默认值只许有一份
    });
  }, { minutes, ...extra });

  test('冷启动（空 state）也必须给得出有限结果，不许抛', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    const r = await est(page, 30);
    expect(r.passedNow).toBe(0);
    expect(r.total).toBe(120);
    expect(typeof r.capped).toBe('boolean');
    if (r.done) { expect(r.days).toBeGreaterThan(0); expect(r.doneAt).toBeGreaterThan(0); }
  });

  test('单调性：分钟加倍，天数严格不增', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    const a = await est(page, 15), b = await est(page, 30), c = await est(page, 60);
    const d = (x: any) => (x.done ? x.days : 1e9);
    expect(d(c)).toBeLessThanOrEqual(d(b));
    expect(d(b)).toBeLessThanOrEqual(d(a));
    // 看门狗：三档至少有一档真走到达标（全 capped 时 d()≡1e9，上面两条就是空断言）。
    expect(Math.min(d(a), d(b), d(c))).toBeLessThan(1e9);
  });

  test('同一份输入跑两次结果逐字段相等（禁 Math.random 的看门狗）', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    expect(await est(page, 20)).toEqual(await est(page, 20));
  });

  test('封顶分支：maxDays 太小 → capped=true 且 done=false，days 必须是 null', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    // D10 之后通读口径下 15 分钟一天排 36 句 = 72 个词，上限给到 5 天已经不算"太小"，
    // 所以压到 0 天（只留第 0 天那 72 个词，120 个词的表到不了）。
    // 这条同时守着一个引擎坑：`o.maxDays || 1095` 会把合法的 0 吃掉，那样封顶分支永远走不到。
    const r = await est(page, 15, { maxDays: 0 });
    expect(r.done).toBe(false);
    expect(r.capped).toBe(true);
    expect(r.days).toBe(null);
    expect(r.doneAt).toBe(null);
  });

  test('里程碑与完工日是同一次行走的读数，不许再跑第二遍', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    const r = await est(page, 60, { maxDays: 1095 });
    expect(r.atHorizon).not.toBe(null);
    const h = r.atHorizon as { days: number; passed: number; at: number };
    expect(h.days).toBe(365);
    expect(h.passed).toBeGreaterThan(0);
    if (r.done) expect(h.passed).toBeLessThanOrEqual(r.total);
  });

  // D10（他 2026-09-22）：「这个时间用通读时间算，不加挖空选词了，我希望是快速刷词」。
  // 旧口径把「过完」数成毕业（reps≥20 且 ② 答对过），15 分钟档在界面上就说成了
  // 「一年只过完 48 个词」—— 与他每天真读进去几十个词的体感差一个量级，压力全来自这里。
  test('「过完」数的是通读到过几个词：② 答错、没毕业，也算过完了一遍', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    const out = await page.evaluate(() => {
      const at = Date.UTC(2026, 8, 21);
      const st = ShadowPlan.replay([
        ShadowPlan.mkContact('alpha', 0, at, '2026-09-21'),
        ShadowPlan.mkQuiz('alpha', 0, 'mc4zh', false, at, '2026-09-21'),
        ShadowPlan.mkContact('beta', 1, at, '2026-09-21'),
      ], { boundaryHour: 4 });
      const grad = (s: any) => Object.keys(s.words).filter((k) => s.words[k].stage === 'graduated').length;
      return { passed: ShadowPlan.countPassed(st), graduated: grad(st), alphaStage: st.words['alpha'].stage };
    });
    expect(out.alphaStage).toBe('seen');          // 读到过一次、② 还答错了 → 离毕业远得很
    expect(out.graduated).toBe(0);
    expect(out.passed).toBe(2);                   // 但这两个词都算「过完了一遍」
  });

  // 附录 B 第 2 条（规格 §7 第 6 条）：分母是入参，界面那行「全部 X 个词」实时跟它走。
  test('分母来自入参，不许写死 3245', async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    const t = await page.evaluate(() => ShadowPlan.estimateDays(ShadowPlan.replay([], {}), 30,
      { totalSents: 60, wordsOf: () => [], totalWords: 777 }).total);
    expect(t).toBe(777);
  });
});

/* ---------------- 保温：毕业 ≠ 永不再见（第一期 Task 2） ----------------
   出处：docs/superpowers/plans/2026-09-22-保温第一期.md §4 Task 2。
   配额那一档（cap=8 句/天、15 分钟以下不保温）不是拍的：判据是「工期比不保温拖长 ≤10% 的最大档」，
   数在 work/保温预算-实测-2026-09-22.md §8（现行成本模型复测）。
   这一族两半都要锁：① 毕业词回得来；② 回得来的量有上限 —— 只做完①就是实测里那一列
   「不限配额：连每天 60 分钟都三年到不了终点」。 */
test.describe('plan engine · 保温（毕业后回池）', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
  });

  /* 造「各自独占一句、都已毕业」的词：一句只放一个词，才分得清哪句是"专为回炉排进来的"。
     毕业凭据 = 12 次接触（门槛本期从 20 降到 12）+ 一次 ② 答对；接触按天给，
     因为引擎按「词|句|日」记功，同一天同一句读十遍只算一次。
     ⚠️ 句号必须从 0 起、并且 ≤ 用例传的 totalSents：assemble 是 `for (i = 0; i < totalSents; i++)`
     遍历句表的，句子号超出 totalSents 就等于那个词在引擎眼里不存在 —— 这种夹具会静默测了个空。
     ⚠️ "今天"取第 26 天而不是第 25 天：最后一次接触在第 11 天，毕业后 due 顺延 14 天 = 第 25 天整，
     与"今天"撞上就成了 due === now 的相等边界（判据是 due <= now，引擎算到期，读数却像没到期）。 */
  const gradScene = `(function (names) {
    const base = Date.parse('2026-01-05T09:00:00');
    const sentOf = {}; names.forEach((w, k) => { sentOf[w] = k; });
    const ev = [];
    for (let d = 0; d < ShadowPlan.MASTER_REPS; d++) {
      const ts = base + d * 864e5, day = ShadowPlan.dayKey(ts, 4);
      names.forEach((w) => ev.push(ShadowPlan.mkContact(w, sentOf[w], ts, day)));
    }
    const last = base + (ShadowPlan.MASTER_REPS - 1) * 864e5;
    names.forEach((w) => ev.push(ShadowPlan.mkQuiz(w, sentOf[w], 'mc4zh', true, last, ShadowPlan.dayKey(last, 4))));
    const st = ShadowPlan.replay(ev, { boundaryHour: 4,
      wordsOf: (i) => names.filter((w) => sentOf[w] === i) });
    return { st, base, sentOf, DAY: 26, dueAt: st.words[names[0]].due };
  })`;

  test('到期毕业词回池：独占一句、进队列、并计入今天的保温负载', async ({ page }) => {
    const got = await page.evaluate((src: any) => {
      const mk = eval(src);
      const sc = mk(['glen']);
      const now = sc.base + sc.DAY * 864e5;
      const plan = { todayMinutes: 60, boundaryHour: 4, pausedNew: false, baowenCap: 8 };
      const r = ShadowPlan.assemble(sc.st, {
        now: now, todayMinutes: 60, rate: 1, secNew: 25, secReview: 8,
        totalSents: 1, wordsOf: (i) => (i === 0 ? ['glen'] : []), plan: plan,
      });
      const st = sc.st.words.glen;
      return { stage: st.stage, due: st.due, at: now,
        len: r.queue.length, pools: r.queue.map((q) => q.pool), sent: r.stats.baowenSent,
        words: r.stats.retentionWords, cap: r.stats.baowenCap, items: r.items.length,
        dueWords: r.stats.dueWords };
    }, gradScene);
    expect(got.stage).toBe('graduated');
    expect(got.due).toBeLessThan(got.at);                 // 确实到期了
    expect(got.len).toBe(1);
    expect(got.words).toBe(1);
    expect(got.sent).toBe(1);
    expect(got.cap).toBe(8);
    // 回炉句照常出一题（②），题目词就是那个毕业词 —— 不然是"读到了但不算练过"
    expect(got.items).toBe(1);
    expect(got.pools).toEqual(['A']);
    // dueWords 只数未毕业的到期词：界面那行是「N 个词到期 · K 个词是回炉保温」，两批人不重复计
    expect(got.dueWords).toBe(0);
  });

  test('没到期（14 天以内）不回池，也不许偷偷进 B 池吃预算', async ({ page }) => {
    const got = await page.evaluate((src: any) => {
      const mk = eval(src);
      const sc = mk(['glen']);
      const plan = { todayMinutes: 60, boundaryHour: 4, pausedNew: false, baowenCap: 8 };
      const r = ShadowPlan.assemble(sc.st, {
        now: sc.dueAt - 6 * 864e5, todayMinutes: 60, rate: 1, secNew: 25, secReview: 8,
        totalSents: 1, wordsOf: (i) => (i === 0 ? ['glen'] : []), plan: plan,
      });
      return { len: r.queue.length, sent: r.stats.baowenSent, words: r.stats.retentionWords,
        dueWords: r.stats.dueWords, newPool: r.stats.newPool, floor: r.stats.floor };
    }, gradScene);
    expect(got.len).toBe(0);
    expect(got.sent).toBe(0);
    /* 这几条是"偷偷漏"的探测器：没到期的毕业词不该算到期数、不该进新词池，
       也不该被兜底机制当成"今天还有事做"硬塞一句 —— floor 那一格专门盯这个。 */
    expect(got.dueWords).toBe(0);
    expect(got.newPool).toBe(0);
    expect(got.floor).toBe(false);
  });

  test('每日配额是硬上限：20 个词到期也只排 cap 句', async ({ page }) => {
    const got = await page.evaluate(([src, cap]: any) => {
      const mk = eval(src);
      const names = []; for (let k = 0; k < 20; k++) names.push('g' + k);
      const sc = mk(names);
      const plan = { todayMinutes: 60, boundaryHour: 4, pausedNew: false, baowenCap: cap };
      const r = ShadowPlan.assemble(sc.st, {
        now: sc.base + sc.DAY * 864e5, todayMinutes: 60, rate: 1, secNew: 25, secReview: 8,
        totalSents: 20, wordsOf: (i) => names.filter((w) => sc.sentOf[w] === i), plan: plan,
      });
      return { len: r.queue.length, sent: r.stats.baowenSent, dropped: r.stats.retentionDropped,
        words: r.stats.retentionWords, budgetSec: r.stats.budgetSec, used: r.stats.usedSec };
    }, [gradScene, 8]);
    expect(got.len).toBe(8);
    expect(got.sent).toBe(8);
    expect(got.words).toBe(8);
    expect(got.dropped).toBe(12);
    // 预算充足（3600 秒）却只排了 64 秒 —— 这就是"上限"的样子，不是排不动
    expect(got.used).toBeLessThan(got.budgetSec);
  });

  test('句子已为未毕业词排进来时，同句的毕业词免费顺带、不吃配额', async ({ page }) => {
    const got = await page.evaluate((src: any) => {
      const base = Date.parse('2026-01-05T09:00:00');
      const mk = eval(src);
      /* mk(['gride','gfar']) → gride 在句 0、gfar 在句 1，两个都已毕业并已到期。
         keep 只读 3 次、② 没答对 → 未毕业但已到期，**和 gride 同句**（这才是"顺带"）。 */
      const sc = mk(['gride', 'gfar']);
      const wordsOf = (i) => (i === 0 ? ['keep', 'gride'] : (i === 1 ? ['gfar'] : []));
      const ev = [];
      for (let d = 0; d < 3; d++) {
        const ts = base + d * 864e5;
        ev.push(ShadowPlan.mkContact('keep', 0, ts, ShadowPlan.dayKey(ts, 4)));
      }
      const st = ShadowPlan.replay(ev, { boundaryHour: 4, wordsOf: wordsOf });
      ['gride', 'gfar'].forEach((w) => { st.words[w] = sc.st.words[w]; });   // 引擎跑出来的真毕业状态，不手搓字段
      const run = (cap) => {
        const plan = { todayMinutes: 60, boundaryHour: 4, pausedNew: false, baowenCap: cap };
        const r = ShadowPlan.assemble(st, { now: base + 26 * 864e5, todayMinutes: 60, rate: 1,
          secNew: 25, secReview: 8, totalSents: 2, wordsOf: wordsOf, plan: plan });
        return { len: r.queue.length, sent: r.stats.baowenSent, words: r.stats.retentionWords,
          dropped: r.stats.retentionDropped, sents: r.queue.map((q) => q.i), quizOn: r.items.map((x) => x.w) };
      };
      return { cap1: run(1), cap0: run(0) };
    }, gradScene);
    // cap=1：句 0 为 keep 排进来，gride 免费搭车；句 1 的 gfar 用掉那一句配额
    expect(got.cap1.sents).toEqual([0, 1]);
    expect(got.cap1.sent).toBe(1);
    expect(got.cap1.words).toBe(2);           // 两个毕业词今天都被读到了，只花了一句的预算
    expect(got.cap1.dropped).toBe(0);
    // cap=0（5/10 分钟那一档）：搭车的照旧免费，专为回炉新排的才停
    expect(got.cap0.sents).toEqual([0]);
    expect(got.cap0.sent).toBe(0);
    expect(got.cap0.words).toBe(1);
    expect(got.cap0.dropped).toBe(1);
    // ② 的题目词该是那句里**还没毕业**的那个 —— 毕业词不该把练习位抢走
    expect(got.cap1.quizOn).toContain('keep');
  });

  test('每天 10 分钟这一档不保温，并且如实报出上限是 0', async ({ page }) => {
    const got = await page.evaluate((src: any) => {
      const mk = eval(src);
      const names = []; for (let k = 0; k < 6; k++) names.push('g' + k);
      const sc = mk(names);
      const wordsOf = (i) => names.filter((w) => sc.sentOf[w] === i);
      const run = (mins) => {
        const plan = { todayMinutes: mins, boundaryHour: 4, pausedNew: false, baowenCap: 8 };
        const r = ShadowPlan.assemble(sc.st, { now: sc.base + sc.DAY * 864e5, todayMinutes: mins,
          rate: 1, secNew: 25, secReview: 8, totalSents: 6, wordsOf: wordsOf, plan: plan });
        return { len: r.queue.length, cap: r.stats.baowenCap, sent: r.stats.baowenSent,
          dropped: r.stats.retentionDropped };
      };
      return { low: run(10), high: run(15) };
    }, gradScene);
    expect(got.low.cap).toBe(0);
    expect(got.low.sent).toBe(0);
    expect(got.low.dropped).toBe(6);          // 6 个都到期了，但这一档一个都不排
    expect(got.low.len).toBe(0);              // 今天没有正事可排：时间太少，先只顾新词
    expect(got.high.cap).toBe(8);             // 15 分钟起才保温（判据见实测 §8）
    expect(got.high.sent).toBe(6);
  });

  test('回炉读到要进账：reps 续加、due 再顺延 14 天、stage 不回退', async ({ page }) => {
    const got = await page.evaluate((src: any) => {
      const mk = eval(src);
      const sc = mk(['glen']);
      const before = { reps: sc.st.words.glen.reps, stage: sc.st.words.glen.stage, due: sc.st.words.glen.due };
      const at = sc.base + sc.DAY * 864e5, day = ShadowPlan.dayKey(at, 4);
      const after = ShadowPlan.replay(
        [ShadowPlan.mkContact('glen', 0, at, day)],
        { state: JSON.parse(JSON.stringify(sc.st)), boundaryHour: 4, wordsOf: () => ['glen'] });
      const w = after.words.glen;
      return { before, reps: w.reps, stage: w.stage, due: w.due, at,
        interval: ShadowPlan.wordInterval(w.reps) };
    }, gradScene);
    expect(got.stage).toBe('graduated');                    // 毕业态不回落（回落是 Task 5，等他拍）
    expect(got.reps).toBe(got.before.reps + 1);             // 但这一遍读是实打实的接触，进账
    expect(got.due - got.at).toBe(14 * 864e5);              // 顺延到下一次回访，不再天天占位
    expect(got.interval).toBe(14);
  });
});

/* ---------- Task 1：引擎按篇化（3.0 M1） ----------
   出处：docs/superpowers/specs/2026-09-24-3.0-article-first-PRD.md §9.3（按篇队列）/ §9.5（三张派生索引）。
   assemble 加 scope 是本次唯一的引擎改动，不带 scope 时行为与 v2.0 逐字一致 —— 老用例不受影响。 */
test.describe('按篇化：scope 与三张派生索引（3.0 M1）', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    /* 本 describe 的用例要读 SECTIONS / TASK.sentWordsOf —— 它们是 loadData() 异步
       fetch 三份 JSON 之后才落地的（见 index.html 1714/1746/1748）。不等就取值会撞上
       boot 屏，SECTIONS=[] / wordsOfSent 恒 [] 让断言偶发红。复用 playback-resume
       同款的就绪闸门，不要用 sleep。 */
    await waitShadowReady(page);
  });

  test('不带 scope 时 assemble 与 v2.0 逐字一致', async ({ page }) => {
    const got = await page.evaluate(() => {
      const st = ShadowPlan.emptyState();
      // 造 3 句、每句 1 个词都读到过 —— 只比「带/不带 scope」的相对差
      for (let i = 0; i < 3; i++) st.words['w' + i] = ShadowPlan.newWord();
      const base = { now: Date.now(), todayMinutes: 15, rate: 1, secNew: 25, secReview: 8,
                     wordsOf: (i: number) => ['w' + i], totalSents: 100, boundaryHour: 4,
                     plan: { todayMinutes: 15, boundaryHour: 4, pausedNew: false } };
      const a = ShadowPlan.assemble(st, base);
      const b = ShadowPlan.assemble(st, Object.assign({}, base, { scope: null }));
      return { qa: a.queue.map((x: { i: number }) => x.i), qb: b.queue.map((x: { i: number }) => x.i) };
    });
    expect(got.qa).toEqual(got.qb);
  });

  test('scope 收窄后只排该篇的句', async ({ page }) => {
    const got = await page.evaluate(() => {
      const st = ShadowPlan.emptyState();
      const scope = ShadowPlan.articleScope(SECTIONS, 0);
      const inScope = Array.from(scope);
      const out = ShadowPlan.assemble(st, { now: Date.now(), todayMinutes: 60, rate: 1,
        // 影子跟读页里有现成的句子→词映射（正文 [[词:形式]] 标记的真实来源），直接用它，
        // 别自己造映射。它由 TASK.sentWordsOf 暴露（wordsOfSent 是 TASK IIFE 的内部函数，不在 window 上）。
        secNew: 25, secReview: 8, wordsOf: (i: number) => TASK.sentWordsOf(i),
        totalSents: 1833, boundaryHour: 4,
        plan: { todayMinutes: 60, boundaryHour: 4, pausedNew: false }, scope });
      return { inScope: inScope.length, queued: out.queue.map((x: { i: number }) => x.i) };
    });
    expect(got.queued.length, '收窄后一句都没排 = 这条什么都没测').toBeGreaterThan(0);
    expect(got.queued.every((i: number) => i < got.inScope), '排出了 scope 外的句').toBe(true);
  });

  test('wordArticle / countStagesOf 与全局对得上', async ({ page }) => {
    const got = await page.evaluate(() => {
      const w = 'volcano';
      const arts = ShadowPlan.wordArticle(SECTIONS, w);
      const st = ShadowPlan.emptyState();
      st.words[w] = ShadowPlan.newWord();
      (st.words[w] as { stage: string }).stage = 'graduated';
      // 按篇统计必须把「句子→词」映射一起喂进去（countStagesOf 是纯函数，不认识 SECTIONS）。
      // 不喂的话它只能数全局 —— 那「六篇之和 = 全局」这条不变式就测不到东西。
      const wordsOf = (i: number) => TASK.sentWordsOf(i);
      const one = ShadowPlan.countStagesOf(st, ShadowPlan.articleScope(SECTIONS, arts[0]), wordsOf);
      let sum = 0;
      for (let a = 0; a < SECTIONS.length; a++) sum += ShadowPlan.countStagesOf(st, ShadowPlan.articleScope(SECTIONS, a), wordsOf).graduated;
      return { arts, oneGrad: one.graduated, sum };
    });
    expect(got.arts.length, '一个目标词应当至少归属一篇').toBeGreaterThan(0);
    expect(got.oneGrad).toBe(1);
    expect(got.sum, '六篇已毕业数之和必须等于全局那 1 个').toBe(1);
  });

  /* 审阅修复 1/5：scope 给了却没给 wordsOf 时，绝不能静默数全局 —— 那会让 app/ 调用方
     拿到「看着对、其实全表」的数。无 scope 的全局统计是合法用途，必须照常。 */
  test('countStagesOf：无 scope 数全局；有 scope 无 wordsOf 必须抛错，不许静默数全局', async ({ page }) => {
    const got = await page.evaluate(() => {
      const st = ShadowPlan.emptyState();
      st.words['volcano'] = ShadowPlan.newWord();
      (st.words['volcano'] as { stage: string }).stage = 'graduated';
      st.words['__not_in_any_article__'] = ShadowPlan.newWord();
      (st.words['__not_in_any_article__'] as { stage: string }).stage = 'graduated';
      const global = ShadowPlan.countStagesOf(st, null);
      let threw = '';
      try {
        // 故意漏掉第三个参数：这条就是在锁「scope 给了但漏了 wordsOf 必须抛」
        ShadowPlan.countStagesOf(st, ShadowPlan.articleScope(SECTIONS, 0));
      } catch (e) { threw = String((e as Error).message || e); }
      const scoped = ShadowPlan.countStagesOf(st, ShadowPlan.articleScope(SECTIONS, 0),
        (i: number) => TASK.sentWordsOf(i));
      return { globalGrad: global.graduated, threw, scopedGrad: scoped.graduated };
    });
    expect(got.globalGrad).toBe(2);          // 无 scope → 全表，合法用途照常
    expect(got.threw).toContain('wordsOf');  // 有 scope 没 wordsOf → 大声报错，不返回"看着对"的数
    expect(got.scopedGrad).toBe(1);          // 有 wordsOf → 只数本篇（volcano），那个假词不算
  });
});
