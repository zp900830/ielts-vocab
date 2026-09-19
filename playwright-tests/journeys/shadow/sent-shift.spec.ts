// Compiled from: tests/e2e/shadow/sent-shift.md
// Compiled at: 2026-09-19
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals. Top-level `const` in a classic script is reachable by bare name
// in page scope but is NOT a window property; function declarations are.
declare const SENT_SHIFTS: {
  id: string;
  after: number;
  delta: number;
  chapter: number;
  localAfter: number;
}[];

interface Seed {
  a: number; // before the chosen insertion — need not stay put any more
  b: number; // the anchor sentence itself
  c: number; // after the anchor insertion
  d: number;
  local: number; // chapter-local index, after localAfter
  delta: number;
  id: string;
  chapter: number;
  // Expected post-migration indices, computed by replaying the WHOLE ledger.
  // With one entry this was `+delta`; with 20+ entries an index can be moved by
  // several of them, so a single-entry model silently asserts the wrong thing.
  exp: Record<string, number>;
  nLedger: number;
}
interface Snap {
  marks: { i: number; u: number }[];
  loops: { start: number; end: number; name?: string; u: number }[];
  prog: {
    sentences: Record<string, { reps: number }>;
    cycleSeen: Record<string, number>;
    streak: number;
  };
  done: string[];
}

const readSnap = (page: import('@playwright/test').Page): Promise<Snap> =>
  page.evaluate(
    () =>
      ({
        marks: JSON.parse(localStorage.getItem('ielts-marks') || '[]'),
        loops: JSON.parse(localStorage.getItem('ielts-ab-loops') || '[]'),
        prog: JSON.parse(localStorage.getItem('ielts-task-progress') || '{}'),
        done: JSON.parse(localStorage.getItem('ielts-sent-shift') || '[]'),
      }) as Snap,
  );

// Everything below is seeded in the PRE-insertion numbering, so the app's
// one-shot migration is the only thing that can bring it in line again.
test.describe('Sentence-index shifts follow corpus insertions exactly once', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/sent-shift.md',
    });

    await test.step('Setup 0: Open the app and clear the migration ledger', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
      await page.evaluate(() => localStorage.removeItem('ielts-sent-shift'));
    });

    await test.step('Setup 1: Write learning data using the OLD numbering', async () => {
      const seeded = await page.evaluate(() => {
        if (SENT_SHIFTS.length === 0) return null;
        const total = document.querySelectorAll('.sent').length;
        // 挑一条「后面还有足够句子」的账目当锚点。以前固定用最后一条，
        // 而最后一条现在落在全书末尾附近，锚点序号一越界整条用例就没意义了
        let st = null;
        for (let i = SENT_SHIFTS.length - 1; i >= 0; i--) {
          const c = SENT_SHIFTS[i];
          if (c.after - 20 >= 0 && c.after + 28 < total) { st = c; break; }
        }
        if (!st) return 'no-anchor';
        if (st.after - 20 >= total) return 'out-of-range';
        // 整本账回放，完全照抄前端 applySentShifts 的语义
        const rep = (n: number) => SENT_SHIFTS.reduce((v, s) => (v > s.after ? v + s.delta : v), n);
        const repL = (n: number) =>
          SENT_SHIFTS.filter((s) => s.chapter === st.chapter).reduce(
            (v, s) => (v > s.localAfter ? v + s.delta : v), n);
        const base = {
          a: st.after - 20,
          b: st.after,
          c: st.after + 25,
          d: st.after + 28,
          local: st.localAfter + 10,
          delta: st.delta,
          id: st.id,
          chapter: st.chapter,
          nLedger: SENT_SHIFTS.length,
        };
        const k: Seed = {
          ...base,
          exp: { a: rep(base.a), b: rep(base.b), c: rep(base.c), d: rep(base.d), local: repL(base.local) },
        };
        localStorage.setItem(
          'ielts-marks',
          JSON.stringify([
            { i: k.c, t: '9/1 10:02', u: 3 },
            { i: k.b, t: '9/1 10:01', u: 2 },
            { i: k.a, t: '9/1 10:00', u: 1 },
          ]),
        );
        localStorage.setItem(
          'ielts-pos',
          JSON.stringify({ chapter: 5, chapterI: k.local, i: k.c, t: 1 }),
        );
        localStorage.setItem(
          'ielts-ab-loops',
          JSON.stringify([
            { start: k.c, end: k.d, name: '旧标题', u: 2 },
            { start: 5, end: 8, name: '保留标题', u: 1 },
          ]),
        );
        localStorage.setItem(
          'ielts-task-progress',
          JSON.stringify({
            sentences: {
              [String(k.a)]: { reps: 1 },
              [String(k.b)]: { reps: 2 },
              [String(k.c)]: { reps: 3 },
            },
            cycleSeen: { [String(k.c)]: 7 },
            streak: 9,
          }),
        );
        return k;
      });
      expect(seeded).not.toBeNull();
      expect(seeded).not.toBe('out-of-range');
      expect(seeded).not.toBe('no-anchor');
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'reload shifts only post-insertion indices, then stops',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page, registerTeardown }) => {
      registerTeardown(async () => {
        await page.evaluate(() => {
          [
            'ielts-marks',
            'ielts-pos',
            'ielts-ab-loops',
            'ielts-task-progress',
            'ielts-sent-shift',
          ].forEach((k) => localStorage.removeItem(k));
        });
      });

      const k = (await page.evaluate(() => {
        const total = document.querySelectorAll('.sent').length;
        let st = null;
        for (let i = SENT_SHIFTS.length - 1; i >= 0; i--) {
          const c = SENT_SHIFTS[i];
          if (c.after - 20 >= 0 && c.after + 28 < total) { st = c; break; }
        }
        const rep = (n: number) => SENT_SHIFTS.reduce((v, s) => (v > s.after ? v + s.delta : v), n);
        const repL = (n: number) =>
          SENT_SHIFTS.filter((s) => s.chapter === st.chapter).reduce(
            (v, s) => (v > s.localAfter ? v + s.delta : v), n);
        const base = {
          a: st.after - 20, b: st.after, c: st.after + 25, d: st.after + 28,
          local: st.localAfter + 10, delta: st.delta, id: st.id, chapter: st.chapter,
          nLedger: SENT_SHIFTS.length,
        };
        return {
          ...base,
          exp: { a: rep(base.a), b: rep(base.b), c: rep(base.c), d: rep(base.d), local: repL(base.local) },
        };
      })) as Seed;

      await test.step('Step 1: Reload once and check the shift', async () => {
        await page.reload();
        await expect
          .poll(async () => (await readSnap(page)).done.length, {
            timeout: currentTimeout(),
          })
          .toBeGreaterThan(0);

        const p = await readSnap(page);
        const byU = (u: number) => p.marks.find((m) => m.u === u);
        // 每个序号都按「整本账回放」的期望值核对，而不是简单 +1
        expect(byU(1)!.i).toBe(k.exp.a);
        expect(byU(2)!.i).toBe(k.exp.b);
        expect(byU(3)!.i).toBe(k.exp.c);
        expect(k.exp.c).toBeGreaterThan(k.c); // 锚点之后的序号确实被推走了
        const moved = p.loops.find((x) => x.u === 2)!;
        const kept = p.loops.find((x) => x.u === 1)!;
        expect(moved.start).toBe(k.exp.c);
        expect(moved.end).toBe(k.exp.d);
        expect(moved.name).toBeUndefined(); // 旧序号写死的小标题要作废，否则会说谎
        expect(kept.start).toBe(5);
        expect(kept.name).toBe('保留标题');
        const s = p.prog.sentences;
        expect(s[String(k.exp.a)].reps).toBe(1);
        expect(s[String(k.exp.b)].reps).toBe(2);
        expect(s[String(k.exp.c)].reps).toBe(3); // 复习记录跟着走，不是新建一条
        expect(s[String(k.c)]).toBeUndefined(); // 旧键不残留
        expect(new Set([String(k.exp.a), String(k.exp.b), String(k.exp.c)]).size).toBe(3); // 不许撞键丢记录
        expect(p.prog.cycleSeen[String(k.exp.c)]).toBe(7);
        expect(p.prog.streak).toBe(9); // 非序号字段原样保留
        expect(p.done).toContain(k.id);
        expect(p.done.length).toBe(k.nLedger); // 整本账一次跑完，不漏条
      });

      await test.step('Step 2: The resume slot shifts too (global i and chapter-local index)', async () => {
        // pos 单独验：reload 时上一个文档会在卸载瞬间触发一次自动存档，那是 pos 自身的
        // 既有行为，混进 Step 1 只会让断言测错东西
        const got = await page.evaluate((kk) => {
          localStorage.setItem('ielts-sent-shift', '[]');
          localStorage.setItem(
            'ielts-pos',
            JSON.stringify({ chapter: kk.chapter, chapterI: kk.local, i: kk.c, t: 1 }),
          );
          (window as unknown as { applySentShifts: () => void }).applySentShifts();
          return JSON.parse(localStorage.getItem('ielts-pos') || '{}');
        }, k);
        expect(got.i).toBe(k.exp.c);
        expect(got.chapterI).toBe(k.exp.local);
      });

      await test.step('Step 3: Reload again and check it does not shift twice', async () => {
        const pick = async () => {
          const r = await readSnap(page);
          return JSON.stringify([r.marks, r.loops, r.prog.sentences, r.prog.cycleSeen, r.done]);
        };
        const before = await pick();
        await page.reload();
        await expect(page.locator('.sent').first()).toBeVisible();
        expect(await pick()).toBe(before);
      });
    },
  );
});
