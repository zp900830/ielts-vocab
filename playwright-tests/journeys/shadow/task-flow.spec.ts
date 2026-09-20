// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 6)
// 界面不变量：控件位置跨模式零变化、今日进度这个数字全页只说一次、
// 播放条标题那一行在任务模式里归任务栏。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

interface QI { kind: string; pass: number; s: number | string; w: string; pool: string }
declare const TASK: {
  buildQueue(): void; enterTaskMode(): void; exitTaskMode(): void; active: boolean;
  resetV2(): void; initPlan(minutes: number): void;
  todayPlan(force?: boolean): { queue: { i: number; kind: string; pool: string; sec: number }[];
                 items: QI[]; words: string[]; stats: Record<string, unknown> };
  state(): { words: Record<string, { stage: string; reps: number; due: number; ctx: object }>; daily: Record<string, Record<string, number>> };
  events(): { type: string }[];
  readDone(i: number): void; relearn(w: string): void;
  openPanel(): void; setView(v: string): void;
  pass(): number; setPass(n: number): void; advance(): void; finished(): boolean;
  currentQuiz(): { kind: string; w: string; answer: string; opts?: string[]; blank: string } | null;
  answerQuiz(choice: string): boolean; nextQuiz(): void; quizDone(): number; quizWrong(): number;
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

  // 真机走查抓到的：读完几句后播放条重绘把「读到第 N 句」盖回了「第1章 5/339」
  test('a playback repaint never reclaims the title line from the task bar', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    const next = page.locator('#tbNext');
    await next.click();
    await next.click();
    await expect(page.locator('#abTitle')).toContainText('读到第');
    await page.locator('.audiobar').getByRole('button', { name: '上一句' }).click();
    await expect(page.locator('#abTitle')).toContainText('读到第');
    // 退出任务模式后这一行要还给播放条，不能留在任务栏的说法上
    await page.evaluate(() => TASK.exitTaskMode());
    await expect(page.locator('#abTitle')).toContainText(/^第\d+章/);
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
    const got = await page.evaluate(() => {
      TASK.setView('plan'); TASK.openPanel();
      return {
        root: JSON.parse(localStorage.getItem('ielts.shadow.v2') || 'null'),
        minutes: TASK.todayPlan().stats.todayMinutes,
        words: Object.keys(TASK.state().words).length,
        noticed: localStorage.getItem('ielts.shadow.migNotice'),
        planNote: [...document.querySelectorAll('#todayPanel .tp-note')].map(e => e.textContent).join(' '),
      };
    });
    expect(got.root).toBeTruthy();
    expect(got.root.state.legacy.streak).toBe(5);
    expect(got.minutes).toBe(20);
    expect(got.words).toBeGreaterThan(0);
    expect(got.root.state.migratedAt).toBeGreaterThan(0);
    // 迁移不能静默（PRD R4）：说一次，并且在计划页留一行可回看
    expect(got.noticed).toBe('1');
    expect(got.planNote).toContain('按词记');
    expect(got.planNote).toMatch(/个词从句子账搬过来/);
  });
});

/* ---- Task 7：三遍流程 ---- */
test.describe('three passes', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);
  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 6);
    await page.goto(`${baseURL}/index.html`);
    await page.locator('.sent').first().waitFor();
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(10); TASK.enterTaskMode(); });
  });

  test('pass 1 asks no questions and starts at ①', async ({ page }) => {
    const got = await page.evaluate(() => ({ p: TASK.pass(), q: TASK.currentQuiz(), bar: document.getElementById('taskBar').dataset.state }));
    expect(got.p).toBe(1);
    expect(got.q).toBe(null);
    expect(got.bar).toBe('read');
  });

  test('② masks exactly the target word —— the answer never shows on screen', async ({ page }) => {
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)); TASK.setPass(2); });
    await expect(page.locator('.qz-blank')).toBeVisible();
    const got = await page.evaluate(() => {
      const q = TASK.currentQuiz();
      return { w: q.w, kind: q.kind, text: document.querySelector('.qz-sent').innerText,
               card: !document.getElementById('taskCard').hidden };
    });
    expect(got.kind).toBe('recall');
    expect(got.card).toBe(true);
    expect(got.text.toLowerCase()).not.toContain(got.w.toLowerCase());
  });

  test('a wrong recall answer never downgrades the word and costs no progress', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      const before = TASK.state().words[q.w].stage;
      const ok = TASK.answerQuiz('definitely-not-this-word');
      const w = TASK.state().words[q.w];
      return { ok, before, stage: w.stage, due: w.due, answered: TASK.quizDone(), wrong: TASK.quizWrong() };
    });
    expect(got.ok).toBe(false);
    expect(got.stage).toBe(got.before);              // 答错不倒退（原则 2）
    expect(got.due).toBeLessThan(Date.now() + 60000); // 但今天之内要再见一次
    expect(got.answered).toBe(1);
    expect(got.wrong).toBe(1);
  });

  test('a right ② answer banks one more context for that word', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      const before = Object.keys(TASK.state().words[q.w].ctx).length;
      TASK.answerQuiz(q.answer);
      const w = TASK.state().words[q.w];
      // 走完 ②：只在这一遍里走，别把 ③ 的分数算进来
      let guard = 0;
      while (TASK.pass() === 2 && guard++ < 80) { TASK.nextQuiz(); }
      const twoCtx = Object.keys(w.ctx).length;
      const all = TASK.state().words;
      return { before, twoCtx,
               stage: w.stage, pass: TASK.pass(),
               // 攒满两个语境的词，状态必须已经越过「已见面」
               recognizedOk: Object.keys(all).filter(k => Object.keys(all[k].ctx).length >= 2)
                                        .every(k => all[k].stage !== 'seen' && all[k].stage !== 'fresh') };
    });
    expect(got.twoCtx).toBeGreaterThan(got.before);
    expect(got.pass).toBe(3);
    expect(got.recognizedOk).toBe(true);
  });

  test('the 今日 denominator never grows while reading', async ({ page }) => {
    const dens = await page.evaluate(() => {
      TASK.initPlan(15); TASK.enterTaskMode();
      const out: string[] = [];
      for (let i = 0; i < 10; i++) {
        document.getElementById('tbNext').click();
        out.push((document.getElementById('tbTitle').textContent.trim().match(/(\d+)\/(\d+)/) || [])[2]);
      }
      return Array.from(new Set(out));
    });
    expect(dens.length).toBe(1);      // 队列会滚动补句，分母跟着涨就是「目标被偷偷抬高」
  });

  test('③ marks the picked wrong option red and the right one green', async ({ page }) => {
    const idx = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(3);
      const q = TASK.currentQuiz();
      return q && q.opts ? q.opts.findIndex(o => o !== q.answer) : -1;
    });
    test.skip(idx < 0, '这一批凑不出干净的四个义项 —— ③ 按规格跳过');
    await expect(page.locator('.qz-opts')).toBeVisible();
    await page.locator('.qz-opt').nth(idx).click();
    expect(await page.locator('.qz-opt.wrong').count()).toBe(1);
    expect(await page.locator('.qz-opt.right').count()).toBe(1);
    expect(await page.locator('.qz-note').innerText()).toContain('正确的那一个是');
  });

  test('① → ② → ③ rolls through and the day is finished at the end', async ({ page }) => {
    const got = await page.evaluate(() => {
      const log: string[] = [];
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      for (let g = 0; g < 200; g++) {
        log.push('p' + TASK.pass());
        const q = TASK.currentQuiz();
        if (!q) { if (TASK.pass() === 1) TASK.setPass(2); else if (TASK.pass() === 2) TASK.setPass(3); else break; continue; }
        TASK.answerQuiz(q.answer);
        TASK.nextQuiz();
      }
      const d = TASK.state().daily[Object.keys(TASK.state().daily).pop()];
      return { passes: Array.from(new Set(log)).join(','), done: TASK.finished(), quizDone: d.quizDone, correct: d.correct };
    });
    expect(got.passes).toBe('p1,p2,p3');
    expect(got.done).toBe(true);
    expect(got.quizDone).toBeGreaterThan(3);
    expect(got.correct).toBe(got.quizDone);
  });

  test('the between-pass summary is the only place these three numbers live', async ({ page }) => {
    await page.evaluate(() => TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)));
    await page.evaluate(() => TASK.advance());
    const card = page.locator('.pass-summary');
    await expect(card).toBeVisible();
    const txt = await card.innerText();
    expect((txt.match(/\d+/g) || []).length).toBeLessThanOrEqual(5);
    expect(/欠|待补|积压|轮/.test(txt)).toBe(false);
    expect(await page.locator('.pass-summary .go').innerText()).toContain('②');
  });
});
