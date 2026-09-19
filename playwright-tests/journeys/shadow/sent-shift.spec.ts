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
  a: number; // before the insertion point — must not move
  b: number; // the anchor sentence itself — must not move
  c: number; // after the insertion point — must move by delta
  d: number;
  local: number; // chapter-local index, after localAfter
  delta: number;
  id: string;
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
        const st = SENT_SHIFTS[SENT_SHIFTS.length - 1];
        const k: Seed = {
          a: st.after - 20,
          b: st.after,
          c: st.after + 25,
          d: st.after + 28,
          local: st.localAfter + 10,
          delta: st.delta,
          id: st.id,
        };
        const total = document.querySelectorAll('.sent').length;
        if (k.a < 0 || k.d >= total) return 'out-of-range';
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
        const st = SENT_SHIFTS[SENT_SHIFTS.length - 1];
        return {
          a: st.after - 20,
          b: st.after,
          c: st.after + 25,
          d: st.after + 28,
          local: st.localAfter + 10,
          delta: st.delta,
          id: st.id,
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
        expect(byU(1)!.i).toBe(k.a); // 插入点之前：不动
        expect(byU(2)!.i).toBe(k.b); // 锚点句本身：不动
        expect(byU(3)!.i).toBe(k.c + k.delta); // 插入点之后：+1
        const moved = p.loops.find((x) => x.u === 2)!;
        const kept = p.loops.find((x) => x.u === 1)!;
        expect(moved.start).toBe(k.c + k.delta);
        expect(moved.end).toBe(k.d + k.delta);
        expect(moved.name).toBeUndefined(); // 旧序号写死的小标题要作废，否则会说谎
        expect(kept.start).toBe(5);
        expect(kept.name).toBe('保留标题');
        const s = p.prog.sentences;
        expect(s[String(k.a)].reps).toBe(1);
        expect(s[String(k.b)].reps).toBe(2);
        expect(s[String(k.c + k.delta)].reps).toBe(3); // 复习记录跟着走，不是新建一条
        expect(s[String(k.c)]).toBeUndefined(); // 旧键不残留
        expect(p.prog.cycleSeen[String(k.c + k.delta)]).toBe(7);
        expect(p.prog.streak).toBe(9); // 非序号字段原样保留
        expect(p.done).toContain(k.id);
      });

      await test.step('Step 2: The resume slot shifts too (global i and chapter-local index)', async () => {
        // pos 单独验：reload 时上一个文档会在卸载瞬间触发一次自动存档，那是 pos 自身的
        // 既有行为，混进 Step 1 只会让断言测错东西
        const got = await page.evaluate((kk) => {
          localStorage.setItem('ielts-sent-shift', '[]');
          localStorage.setItem(
            'ielts-pos',
            JSON.stringify({ chapter: 5, chapterI: kk.local, i: kk.c, t: 1 }),
          );
          (window as unknown as { applySentShifts: () => void }).applySentShifts();
          return JSON.parse(localStorage.getItem('ielts-pos') || '{}');
        }, k);
        expect(got.i).toBe(k.c + k.delta);
        expect(got.chapterI).toBe(k.local + k.delta);
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
