// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 6)
// 界面不变量。这两条是「回归锁」：现状用 CSS 藏掉上一句/下一句、
// 并把同一个进度数字在任务栏和播放条各写一遍。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

interface QI { kind: string; pass: number; s: number | string; w: string; pool: string }
declare const TASK: {
  buildQueue(): void; enterTaskMode(): void; exitTaskMode(): void; active: boolean;
  resetV2(): void; initPlan(minutes: number): void;
  todayPlan(): { queue: { i: number; kind: string; pool: string; sec: number }[];
                 items: QI[]; words: string[]; stats: Record<string, unknown> };
  state(): { words: Record<string, { stage: string; reps: number }>; daily: Record<string, Record<string, number>> };
  events(): { type: string }[];
  readDone(i: number): void; relearn(w: string): void;
  openPanel(): void; setView(v: string): void;
};
declare const ShadowPlan: { dayKey(ts: number, h: number): string };

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const PLAN_KEY = 'ielts-task-plan';
const pad = (n: number) => String(n).padStart(2, '0');
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

async function startPlanAndTaskMode(page: import('@playwright/test').Page, baseURL: string) {
  await page.goto(`${baseURL}/index.html`);
  await expect(page.locator('.sent').first()).toBeVisible();
  await page.locator('#btnToday').click();
  await page.locator('.ps-start').click();
  await page.keyboard.press('Escape');
  expect(await page.evaluate((k) => !!localStorage.getItem(k), PLAN_KEY)).toBe(true);
  await page.evaluate(() => TASK.enterTaskMode());
  await expect(page.locator('#taskBar')).toBeVisible();
}

test.describe('task mode · UI invariants', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test('step controls stay visible and usable inside task mode', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    await expect(page.locator('.audiobar .ab-step')).toHaveCount(2);
    for (const name of ['上一句', '下一句']) {
      const btn = page.locator('.audiobar').getByRole('button', { name });
      await expect(btn).toBeVisible();
      await expect(btn).toBeEnabled();
    }
    // 退出后位置不变：肌肉记忆不该被模式切换作废
    await page.evaluate(() => TASK.exitTaskMode());
    await expect(page.locator('.audiobar').getByRole('button', { name: '上一句' })).toBeVisible();
  });

  test('the progress readout appears once on the page, not twice', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    const got = await page.evaluate(() => {
      const bar = document.getElementById('taskBar');
      const ab = document.getElementById('abTitle');
      const grab = (el: Element | null) => (el && el.textContent) || '';
      const t = grab(bar), a = grab(ab);
      const rx = /\d+\s*\/\s*\d+/g;
      const hits = t.match(rx) || [];
      // 播放条允许报「读到第几句」，但不得重复任务栏那个「今日 done/total」
      const prog = hits[0] ? hits[0].replace(/\s+/g, '') : '';
      return { dupProgress: hits.length, abTitle: a,
               sameInAb: prog ? a.replace(/\s+/g, '').includes(prog) : false };
    });
    expect(got.dupProgress).toBeLessThanOrEqual(1);
    expect(got.sameInAb).toBe(false);
  });
});

test.describe('today panel · new spec', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 10);
    await page.goto(`${baseURL}/index.html`);
  });

  test('one plan input (minutes) drives the queue, and reading a sentence moves the numbers', async ({ page }) => {
    await page.evaluate(() => TASK.resetV2());
    await page.evaluate(() => TASK.initPlan(12));
    const a = await page.evaluate(() => TASK.todayPlan());
    expect(a.queue.length).toBeGreaterThan(0);
    expect((a.stats.usedSec as number)).toBeLessThanOrEqual(12 * 60 + 1);
    expect(a.queue.every(q => q.kind === 'sent')).toBe(true);
    expect(a.items.every(x => x.kind === 'quiz')).toBe(true);

    await page.evaluate(() => TASK.readDone(TASK.todayPlan().queue[0].i));
    const b = await page.evaluate(() => ({ st: TASK.state(), ev: TASK.events().length }));
    const learned = Object.keys(b.st.words).length;
    expect(learned).toBeGreaterThan(0);
    expect(b.ev).toBeGreaterThan(0);
    const day = await page.evaluate(() => ShadowPlan.dayKey(Date.now(), 4));
    expect(b.st.daily[day].sentDone).toBe(1);
  });

  test('panel keeps 今日 and 词汇 as two columns and never speaks of 轮 or debt', async ({ page }) => {
    await page.evaluate(() => TASK.resetV2());
    await page.evaluate(() => TASK.initPlan(15));
    await page.locator('#btnToday').click();
    await expect(page.locator('.tp-col-today')).toBeVisible();
    await expect(page.locator('.tp-col-words')).toBeVisible();
    const txt = await page.locator('#todayPanel').innerText();
    expect(txt).toContain('今天 15 分钟');
    expect(txt).toMatch(/个词到期/);
    expect(/轮|欠|待补|积压|已读 \d/.test(txt)).toBe(false);
  });

  test('reading moves the 今日 number even though the queue rolls', async ({ page }) => {
    await page.evaluate(() => TASK.resetV2());
    await page.evaluate(() => TASK.initPlan(15));
    const q = await page.evaluate(() => TASK.todayPlan().queue.slice(0, 4).map(x => x.i));
    await page.evaluate((list) => list.forEach((i: number) => TASK.readDone(i)), q);
    await page.locator('#btnToday').click();
    const got = await page.evaluate(() => {
      const p = document.getElementById('todayPanel');
      const col = p.querySelector('.tp-col-today');
      return {
        big: col.querySelector('.tp-num').textContent.trim(),
        width: (col.querySelector('.tp-prog-fill') as HTMLElement).style.width,
        // 新口径：进队列的新词只报今天真的排进去的那些，不报全库
        newWords: Number((p.querySelector('.tp-note .sm') as HTMLElement).textContent.match(/(\d+) 个新词/)?.[1]),
      };
    });
    expect(got.big.startsWith('4 /')).toBe(true);
    expect(got.width).not.toBe('0%');
    expect(got.newWords).toBeLessThan(200);
  });

  test('the word book filters by stage and relearn pushes a word back', async ({ page }) => {
    await page.evaluate(() => TASK.resetV2());
    await page.evaluate(() => TASK.initPlan(15));
    const w = await page.evaluate(() => {
      TASK.todayPlan().queue.slice(0, 3).forEach(q => TASK.readDone(q.i));
      const ws = Object.keys(TASK.state().words);
      return ws[0];
    });
    await page.locator('#btnToday').click();
    await page.locator('.tp-tab[data-view="book"]').click();
    await expect(page.locator('.tp-book')).toBeVisible();
    await page.locator('.tp-filters .pill').nth(1).click();
    expect(await page.locator('.tp-book-row').count()).toBeGreaterThan(0);
    const after = await page.evaluate((word) => {
      TASK.relearn(word);
      return TASK.state().words[word].stage;
    }, w);
    expect(['fresh', 'seen']).toContain(after);
  });

  test('an existing plan migrates on first load instead of starting from zero', async ({ page }) => {
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.setItem('ielts-task-plan', JSON.stringify({ startDate: '2026-09-01', totalDays: 30, dailyMinutes: 20, newPerDay: 8, paused: false }));
      localStorage.setItem('ielts-task-progress', JSON.stringify({
        sentences: { 3: { reps: 8, phase: 'solid' }, 4: { reps: 2, phase: 'learning' } },
        daily: {}, streak: 5, cycleCount: 1, cycleSeen: {}, pace: { new: 22, review: 7, samples: 40 },
      }));
    });
    await page.reload();
    await page.locator('.sent').first().waitFor();
    const got = await page.evaluate(() => ({
      root: JSON.parse(localStorage.getItem('ielts.shadow.v2') || 'null'),
      minutes: TASK.todayPlan().stats.todayMinutes,
      words: Object.keys(TASK.state().words).length,
    }));
    expect(got.root).toBeTruthy();
    expect(got.root.state.legacy.streak).toBe(5);
    expect(got.minutes).toBe(20);
    expect(got.words).toBeGreaterThan(0);
    expect(got.root.state.migratedAt).toBeGreaterThan(0);
  });
});
