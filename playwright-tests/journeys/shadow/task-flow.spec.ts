// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 6)
// 界面不变量：今日进度这个数字全页只说一次、任务模式底部只剩一条通栏任务条 +（① 态）一条极窄播放行、
// 播放条标题那一行在任务模式里归任务栏。
//
// 底栏口径 2026-09-21 照原型重排：依据是 docs/prototype/2026-09-20-任务模式原型.html:248-253（① 通读
// = 通栏任务条 + 一条 playrow）、:283-284（② 挖空 = 只有任务条）、:382（③ 选义 = 只有任务条），
// 以及他 2026-09-21 的缺陷报告「说好的隐藏播放条、保留底部通栏的任务条，一直没改」
// （排查记录：work/任务模式底栏排查_2026-09-21.md）。
// 旧版注释把相反口径写成「他拍的板：播放条不藏」，那句话在 docs/ 里查不到任何出处（只有 agent 写的注释），
// 已作废 —— 别再拿它当依据。
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

  /* 2026-09-21 定稿口径（他原话：「任务模式，播放条的所有功能都放在通栏任务条上」）：
     播放条整条隐藏，它那一排控件搬进任务条；上一句/下一句/退出本来就在任务条上。
     所以下面全部以 #taskBar 为家 —— #audiobar 在任务模式里必须是不可见的。 */
  test('任务模式① 态：播放条整条隐藏、功能全搬到通栏，翻句与退出都在通栏上', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await startPlanAndTaskMode(page, baseURL);
    await expect(page.locator('#audiobar')).not.toBeVisible();
    // 播放/循环/A-B/书签/倍速 这五颗现在住在任务条第二行里 —— 用 closest 确认真的搬进来了，不是只"碰巧可见"
    const inBar = (id: string) => page.evaluate((i) =>
      document.getElementById(i)!.closest('#taskBar') !== null, id);
    for (const id of ['btnPlay', 'btnLoop', 'btnAB', 'markBtn', 'rateCycle']) {
      await expect(page.locator('#' + id)).toBeVisible();
      expect(await inBar(id)).toBe(true);
    }
    await expect(page.locator('#btnPlay')).toBeEnabled();
    await expect(page.locator('#rateCycle')).toBeEnabled();   // 倍速旧版被整条藏掉、全页无第二个入口，这条守它别再丢
    // 原型 :250：上一句 / 下一句 同一条通栏右侧，不再拆在两条栏上
    await expect(page.locator('#tbPrev')).toBeVisible();
    await expect(page.locator('#tbNext')).toBeVisible();
    await expect(page.locator('button:visible', { hasText: '下一句' })).toHaveCount(1);
    await expect(page.locator('button:visible', { hasText: '上一句' })).toHaveCount(1);
    // 搬过来的这一排里，翻句两颗与进度条仍然不显示（否则通栏上会出现两颗同名按钮）
    await expect(page.locator('#tbPlay .btn.ab-step:visible')).toHaveCount(0);
    await expect(page.locator('#tbPlay .ab-seek')).not.toBeVisible();
    await expect(page.locator('#abCollapse')).not.toBeVisible();
    await expect(page.locator('#abExpand')).not.toBeVisible();
    // §10.1 ① 态控件表要求的「退出」，常驻通栏（旧版唯一入口在面板里，手机上要三跳）
    await expect(page.locator('#taskBar #tbExit')).toBeVisible();
    // 整条底栏高度：390×844 实测 99px（旧版两条栏 157px），留 120 的余量防字号变化
    expect((await page.locator('#taskBar').boundingBox()).height).toBeLessThanOrEqual(120);
    await page.evaluate(() => TASK.exitTaskMode());
    await expect(page.locator('.audiobar').getByRole('button', { name: '下一句' })).toBeVisible();
  });

  // 续读条借用的是同一行（data-state=resume，此刻没有 body.task-mode）：新加的退出/上一句两颗都不许露脸
  test('续读条状态下「退出」和「上一句」都不出现，只有播放条照常', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 8);
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(20);
      TASK.todayPlan(true).queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
    });
    await page.reload();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('taskBar').dataset.state)).toBe('resume');
    expect(await page.evaluate(() => document.body.classList.contains('task-mode'))).toBe(false);
    await expect(page.locator('#tbExit')).not.toBeVisible();
    await expect(page.locator('#tbPrev')).not.toBeVisible();
    await expect(page.locator('#tbNext')).toBeVisible();    // 「接着做」
    await expect(page.locator('#tbAgain')).toBeVisible();   // 「今天先不做」
    await expect(page.locator('#audiobar')).toBeVisible();  // 续读条不许把播放条挤掉，也不许把它降级
    expect((await page.locator('#audiobar').boundingBox()).height).toBeGreaterThan(46);
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
    await page.locator('#tbPrev').click();
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

  /* 底栏口径 2026-09-21 已换（见文件头）：旧注释写的是「他拍的板：播放条别整条藏」，
     那句在 docs/ 里查不到出处，守的是三层堆叠的旧现状。
     ② 刷新时有没做完的任务 → 直接占用底部本来就是任务栏的那一行，不弹窗。 */
  const barState = (page: import('@playwright/test').Page) =>
    page.evaluate(() => (document.getElementById('taskBar') as HTMLElement).dataset.state);

  /* beforeEach 已经 initPlan + enterTaskMode，这里别再走 startPlanAndTaskMode：
     那颗 .ps-start 只在「还没有计划」时才存在，计划已建就会点到永远等不到的按钮。
     可见性一律用 Playwright 的 :visible —— 任务栏和播放条都是 position:fixed，
     offsetParent 恒为 null，拿它判可见会把两颗都在屏幕上的按钮读成"不存在"。 */
  /* 底栏口径 2026-09-21 定稿（他原话：「播放条的所有功能都放在通栏任务条上」）：
     播放条整条隐藏，它那一排控件搬进任务条的第二行；②③ 做题态第二行也去掉。
     所以断言一律以 #taskBar 为家 —— 别再拿 #audiobar 的可见性当依据。 */
  test('任务模式底栏只有一条：① 两行全在通栏上、②③ 收成一行，翻句/退出/回看各只一颗', async ({ page }) => {
    test.setTimeout(currentTimeout());   // hook 给了 12 分钟；这条本地 5 秒内该完
    // ① 通读：播放条整条不显示，它的功能全部住在任务条里
    await expect(page.locator('#audiobar')).not.toBeVisible();
    await expect(page.locator('#btnPlay')).toBeVisible();
    expect(await page.evaluate(() => document.getElementById('btnPlay')!.closest('#taskBar') !== null)).toBe(true);
    await expect(page.locator('.ab-left > .btn.ab-step:visible')).toHaveCount(0);
    await expect(page.locator('.ab-left > .btn.ab-step-fwd')).toHaveCount(1);       // 让出去的那颗还在 DOM 里，只是不显示
    await expect(page.locator('button:visible', { hasText: '下一句' })).toHaveCount(1);
    await expect(page.locator('button:visible', { hasText: '上一句' })).toHaveCount(1);
    await expect(page.locator('#tbPrev')).toBeVisible();
    await expect(page.locator('#tbNext')).toBeVisible();
    await expect(page.locator('#tbExit')).toBeVisible();
    // 倍速旧版被 `body.task-mode .rate-wrap{display:none}` 整条藏掉、全页无第二个入口，这条守它别再丢
    await expect(page.locator('#rateCycle')).toBeVisible();
    await expect(page.locator('#btnLoop')).toBeVisible();
    await expect(page.locator('#btnAB')).toBeVisible();

    // ②③ 做题态：第二行整行消失（原型 :283-284、:382 底部只有任务条一条）
    await page.evaluate(() => { TASK.setPass(2); TASK.next(); });
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('quiz-mode'))).toBe(true);
    await expect(page.locator('#tbPlay')).not.toBeVisible();
    await expect(page.locator('#btnPlay')).not.toBeVisible();
    await expect(page.locator('.loop-wrap:visible')).toHaveCount(0);
    // 「回看句子」全页只有一颗，且归任务条（旧口径做题卡里还有一颗同名的，实测 dupBtn:["回看句子"]）
    await expect(page.locator('#taskCard button:visible', { hasText: '回看句子' })).toHaveCount(0);
    await expect(page.locator('button:visible', { hasText: '回看句子' })).toHaveCount(1);
    await expect(page.locator('#tbAgain')).toHaveText(/回看句子/);
    // 卡头不再复述 n/N：今日进度唯一的家是任务栏（PRD §10.1 数字唯一性表）
    const nums = await page.evaluate(() => {
      const rx = /\d+\s*\/\s*\d+/g;
      const grab = (id: string) => ((document.getElementById(id) as HTMLElement) || { textContent: '' }).textContent || '';
      const card = document.getElementById('taskCard')!.querySelector('.qz-head');
      return {
        onBar: (grab('tbTitle').match(rx) || []).length,
        onCard: ((card as HTMLElement) && card.textContent ? card.textContent.match(rx) || [] : []).length,
        tag: ((document.getElementById('taskCard')!.querySelector('.qz-tag') as HTMLElement) || { textContent: '' }).textContent!.trim(),
      };
    });
    expect(nums.onBar).toBe(1);
    expect(nums.onCard).toBe(0);
    expect(nums.tag).not.toMatch(/\d+\s*\/\s*\d+/);
    // 做题卡只给任务条一条让位：--task-card-b ≈ 任务条高（旧口径要多让一条播放条 = 88px）
    const fits = await page.evaluate(() => {
      const px = (v: string) => parseFloat(v) || 0;
      const gap = px(getComputedStyle(document.documentElement).getPropertyValue('--task-card-b'));
      const bar = document.getElementById('taskBar')!.getBoundingClientRect().height;
      return { gap, bar, top: document.getElementById('taskCard')!.getBoundingClientRect().top, inner: innerHeight };
    });
    expect(fits.gap).toBeGreaterThanOrEqual(fits.bar);
    expect(fits.gap).toBeLessThanOrEqual(fits.bar + 40);
    expect(fits.bar + 88).toBeLessThan(fits.inner - fits.top);   // 底部合计里那条播放条确实是没了
  });

  test('刷新时任务没做完：底部那行变成续读条，点「接着做」进任务模式', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout());   // hook 给了 12 分钟；这几条本地 5 秒内该完，卡住就早点红
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    const room = await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(20);
      const q = TASK.todayPlan(true).queue;
      q.slice(0, 2).forEach(x => TASK.readDone(x.i));
      return q.length;
    });
    expect(room).toBeGreaterThan(2);                      // 得真留点没做完的
    await page.reload();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await barState(page)).toBe('resume');
    await expect(page.locator('#tbTitle')).toContainText('还没做完');
    await expect(page.locator('#audiobar')).toBeVisible();  // 续读条不许把播放条挤掉
    await page.locator('#tbNext').click();
    await expect.poll(() => page.evaluate(() => TASK.active)).toBe(true);
    expect(await barState(page)).not.toBe('resume');
  });

  test('「今天先不做」当天就不再提，明天照常', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout());   // hook 给了 12 分钟；这几条本地 5 秒内该完，卡住就早点红
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(20);
      TASK.todayPlan(true).queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
    });
    await page.reload();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.locator('#tbAgain').click();               // 今天先不做
    await expect(page.locator('#taskBar')).not.toBeVisible();
    await page.reload();
    await expect(page.locator('#taskBar')).not.toBeVisible();   // 同一趟不再提
    await page.evaluate(() => { sessionStorage.clear(); });     // 换一趟来：还是不提，因为已经按「今天」记下了
    await page.reload();
    await expect(page.locator('#taskBar')).not.toBeVisible();
    await page.evaluate(() => localStorage.removeItem('ielts.shadow.resumeDay'));
    await page.reload();
    await expect(page.locator('#taskBar')).toBeVisible();       // 换一天（清掉那把锁）就又提得起来
  });
});
