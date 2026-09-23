// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 6)
// 界面不变量：今日进度这个数字全页只说一次、任务模式底部只剩一条通栏任务条 +（① 态）一条极窄播放行、
// 播放条标题那一行在任务模式里归任务栏。
//
// 底栏口径 2026-09-21 照原型重排：依据是 docs/prototype/2026-09-20-任务模式原型.html:248-253（① 通读
// = 通栏任务条 + 一条 playrow）、:283-284（② 做题 = 只有任务条），以及他 2026-09-21 的缺陷报告
// 「说好的隐藏播放条、保留底部通栏的任务条，一直没改」（排查记录：work/任务模式底栏排查_2026-09-21.md）。
// 原型 :382 那一步「③ 选义」已于 2026-09-22 两步制整步删除（docs/superpowers/specs/2026-09-22-任务模式两步制.md），
// 所以这个文件里所有做题态的断言现在都只针对 ②。
// 旧版注释把相反口径写成「他拍的板：播放条不藏」，那句话在 docs/ 里查不到任何出处（只有 agent 写的注释），
// 已作废 —— 别再拿它当依据。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

interface QI { kind: string; pass: number; s: number | string; w: string; pool: string; from?: number }
interface BlankQ { kind: string; w: string; answer: string; opts: string[]; sense: string; pos: string; s: number | string }
declare const TASK: {
  buildQueue(): void; enterTaskMode(): void; exitTaskMode(): void; active: boolean;
  resetV2(): void; initPlan(minutes: number): void;
  todayPlan(force?: boolean): { queue: { i: number; kind: string; pool: string; sec: number }[];
                 items: QI[]; words: string[]; stats: Record<string, unknown> };
  state(): { words: Record<string, { stage: string; reps: number; due: number; ctx: object; ok3: number }>; daily: Record<string, Record<string, number>> };
  events(): { type: string; w?: string; s?: number | string; ok?: boolean }[];
  readDone(i: number): void; relearn(w: string): void;
  openPanel(): void; setView(v: string): void;
  pass(): number; setPass(n: number): void; advance(): void; finished(): boolean;
  currentQuiz(): BlankQ | null; answerQuiz(choice: string): boolean; nextQuiz(): void;
  quizDone(): number; quizWrong(): number; quizTotal(): number;
  blankQuizFor(s: number | string, w: string): BlankQ | null;
  updateBtn(): void;
};
declare const ShadowPlan: { dayKey(ts: number, h: number): string };
declare const VOCAB: Record<string, { m?: string; ex?: string }>;

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
    // 循环/A-B/书签/倍速 这四颗现在住在任务条第二行里 —— 用 closest 确认真的搬进来了，不是只"碰巧可见"
    const inBar = (id: string) => page.evaluate((i) =>
      document.getElementById(i)!.closest('#taskBar') !== null, id);
    for (const id of ['btnLoop', 'btnAB', 'markBtn', 'rateCycle']) {
      await expect(page.locator('#' + id)).toBeVisible();
      expect(await inBar(id)).toBe(true);
    }
    /* ▶ 在任务模式里撤掉了（他 2026-09-23：「播放按钮得删掉，不点不放」）。
       仍然要求它被搬进了任务条 —— 退出模式时靠这一搬回到播放条，别退化成"消失了找不回来"。 */
    await expect(page.locator('#btnPlay')).not.toBeVisible();
    expect(await inBar('btnPlay')).toBe(true);
    await expect(page.locator('#rateCycle')).toBeEnabled();   // 倍速旧版被整条藏掉、全页无第二个入口，这条守它别再丢
    // 原型 :250：上一句 / 放这一句 同一条通栏右侧，不再拆在两条栏上
    await expect(page.locator('#tbPrev')).toBeVisible();
    await expect(page.locator('#tbNext')).toBeVisible();
    await expect(page.locator('button:visible', { hasText: '放这一句' })).toHaveCount(1);
    await expect(page.locator('button:visible', { hasText: '下一句' })).toHaveCount(0);
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

/* ---- 两步流程（docs/superpowers/specs/2026-09-22-任务模式两步制.md） ----
   ③「看英文选中文」整步删除，②「挖空选择」改成四选一，并接手 ③ 的毕业凭据 ok3（D1）。
   这里锁三件事：只有两步、② 是四选一且唯一正确项、凑不出合格干扰项的句子不弹题。 */
test.describe('two passes', () => {
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

  test('② masks exactly the target word and is a four-choice with one right answer', async ({ page }) => {
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)); TASK.setPass(2); });
    await expect(page.locator('.qz-opts')).toBeVisible();
    const got = await page.evaluate(() => {
      const q = TASK.currentQuiz();
      return { w: q.w, kind: q.kind, opts: q.opts, answer: q.answer, sense: q.sense,
               text: document.querySelector('.qz-sent').innerText,
               zh: (document.querySelector('.qz-zh u') || {}).textContent || '',
               n: document.querySelectorAll('.qz-opt').length,
               card: !document.getElementById('taskCard').hidden };
    });
    expect(got.kind).toBe('mc4zh');               // D1：② 答对记的就是这个事件类型，判据没换名字
    expect(got.card).toBe(true);
    expect(got.n).toBe(4);
    expect(got.opts.length).toBe(4);
    expect(new Set(got.opts).size).toBe(4);       // 四个各不相同的候选
    expect(got.opts.filter(o => o === got.answer).length).toBe(1);   // 有且仅有一个正确项
    expect(got.answer.toLowerCase()).toBe(got.w.toLowerCase());
    expect(got.text.toLowerCase()).not.toContain(got.w.toLowerCase());  // 空格处不许把答案写出来
    expect(got.sense.length).toBeGreaterThan(0);
    expect(got.zh.length).toBeGreaterThan(0);     // 译文里被下划线标出的那个意思 = 把答案锁成唯一一个的提示
  });

  /* 干扰项资格（规格 D5）：候选必须是目标词、与空格要求的词性一致，
     并且出自这个词的已裁决辨析组（vocab.cmp）；组里凑不够才从同段目标词补（PRD §7.2 的两档）。
     义项与答案在这一句里重叠的候选算「填进去也对」，一律不许进选项。 */
  test('每个候选都是同段/同辨析组的目标词，且与答案同词性', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      if (!q) return { skip: true };
      const POS = /\b(n|v|vt|vi|adj|adv|prep|conj|pron|num|int|abbr)\./ig;
      const posSet = (m: string) => { const s: string[] = []; let x; while ((x = POS.exec(String(m || '')))) s.push(x[1].toLowerCase() + '.'); return s; };
      // 辨析组成员（反向索引：谁的卡上 cmp 里出现了这个词）
      const grouped = (a: string, b: string) => Object.keys(VOCAB).some((k) => {
        const c = (VOCAB[k] as { cmp?: { items?: { w: string }[] } }).cmp;
        if (!c || !c.items) return false;
        const mem = [k.toLowerCase()].concat(c.items.map(i => String(i.w || '').toLowerCase()));
        return mem.indexOf(a) >= 0 && mem.indexOf(b) >= 0;
      });
      // 同段：正文里已经按段渲染，句子里的目标词都带 data-w；取这一句所在段的词头集合
      const paraWords = new Set<string>();
      document.querySelectorAll('.sent').forEach((el) => {
        el.querySelectorAll('.w').forEach((w) => paraWords.add((((w as HTMLElement).dataset || {}).w || '').toLowerCase()));
      });
      return {
        skip: false, pos: q.pos, sense: q.sense,
        opts: q.opts,
        allHaveCards: q.opts.every(o => !!VOCAB[o.toLowerCase()]),
        samePos: q.opts.filter(o => o.toLowerCase() !== q.w.toLowerCase())
          .every(o => posSet((VOCAB[o.toLowerCase()] || {}).m).indexOf(q.pos) >= 0),
        inCorpus: q.opts.every(o => paraWords.has(o.toLowerCase()) || grouped(q.w.toLowerCase(), o.toLowerCase())),
        senseOfAnswer: posSet(q.sense).length > 0,
      };
    });
    test.skip(got.skip === true, '这一批一个都凑不出合格干扰项 —— 按规格不弹题');
    expect(got.allHaveCards).toBe(true);      // 原则 10：选项一律是有卡的目标词
    expect(got.samePos).toBe(true);           // 同词性（L2）
    expect(got.inCorpus).toBe(true);
    expect(got.senseOfAnswer).toBe(true);     // 提示得带词性，否则无法判「同词性」
  });

  test('凑不出三个合格干扰项的句子不弹题（宁缺毋滥，也不降级成默写）', async ({ page }) => {
    const got = await page.evaluate(() => {
      // 全库扫一遍：① 至少存在出不了题的 (句, 词) —— 闸门真的会落下；
      // ② 任何能出题的 (句, 词) 必须是恰好 4 个候选、1 个正确项。
      const wordsOf = (i: number) => Array.from(document.querySelectorAll('.sent')[i]
        ? Array.from(document.querySelectorAll('.sent')[i].querySelectorAll('.w'))
            .map((w) => (((w as HTMLElement).dataset || {}).w || '').toLowerCase()).filter(Boolean) : []);
      let built = 0, refused = 0, bad = 0;
      const n = document.querySelectorAll('.sent').length;
      for (let i = 0; i < n; i++) {
        wordsOf(i).forEach((w) => {
          const q = TASK.blankQuizFor(i, w);
          if (!q) { refused++; return; }
          built++;
          if (q.opts.length !== 4 || q.opts.filter(o => o === q.answer).length !== 1
              || new Set(q.opts).size !== 4) bad++;
        });
      }
      return { built, refused, bad, n };
    });
    expect(got.bad).toBe(0);
    expect(got.built).toBeGreaterThan(0);
    expect(got.refused).toBeGreaterThan(0);   // 闸门不是一次都没落下的死代码
    // 弹题率 = 出题的句占比；这一条只锁「有题可出且不合格的一律不弹」，比例不许掉到没法毕业
    expect(got.built / (got.built + got.refused)).toBeGreaterThan(0.5);
  });

  test('a wrong ② answer never downgrades the word and costs no progress', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      const before = TASK.state().words[q.w].stage;
      const ok = TASK.answerQuiz('definitely-not-this-word');
      const w = TASK.state().words[q.w];
      return { ok, before, stage: w.stage, due: w.due, answered: TASK.quizDone(), wrong: TASK.quizWrong(), ok3: w.ok3 };
    });
    expect(got.ok).toBe(false);
    expect(got.stage).toBe(got.before);              // 答错不倒退（原则 2 / D7）
    expect(got.due).toBeLessThan(Date.now() + 60000); // 但今天之内要再见一次
    expect(got.answered).toBe(1);
    expect(got.wrong).toBe(1);
    expect(got.ok3).toBe(0);                          // 答错不算毕业凭据
  });

  /* 走查 2026-09-22「下一批」#1 + #2（各钉一条）：
     #1 推进按钮全页只剩任务条那一颗 —— 做题卡里那颗 .qz-go 已删（同屏两颗同名按钮，
        末题两处文字还会不一致）；末题任务条那颗写「小结」。
     #2 答错过的词在本遍末尾补考一次、只补一次；补考走的是同一份 quizList()/answerQuiz() 账，
        所以分母 N 一起涨（分子分母同一份，不会出现 3/2），事件也只有一本。 */
  test('② 答错的词在本遍末尾补考一次（只补一次），推进只剩任务条那一颗', async ({ page }) => {
    const got = await page.evaluate(() => {
      /* 先抓一份今天的批次（此刻一句没读，等于 enterTaskMode 里的快照）：读完之后队列会滚动，
         再调 todayPlan(true) 拿到的已经不是出题的那批了。 */
      const snap = TASK.todayPlan(true).items.slice();
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const first = TASK.currentQuiz();
      if (!first) return { skip: true } as { skip: boolean };
      // 批次里同一「词 + 句」出现两次的话，下面的判重会误判 —— 这条用例只锁补考，不锁那种批次
      const dupes = snap.filter(x => x.w === first.w && String(x.s) === String(first.s)).length;
      const baseN = TASK.quizTotal();
      const origOpts = first.opts.slice();
      TASK.answerQuiz((first.opts.find(o => o !== first.answer) || 'x') as string);   // 第一题故意答错
      const nAfterWrong = TASK.quizTotal();
      const goInCard = document.querySelectorAll('.qz-go').length;
      const labels: string[] = [];
      let served = 0, retakeAt = 0, guard = 0;
      let retakeOpts: string[] = [];
      TASK.nextQuiz();
      while (guard++ < 400 && !TASK.finished()) {
        const q = TASK.currentQuiz();
        if (!q) break;
        served++;
        // 原题在进循环前已经答过这一次了，所以再碰到同一「词 + 句」就是那道补考 —— 它再答错一次，
        // 用来验证「补考只补一次」。别的题一律答对，保证整遍只多出那一道题。
        const isRetake = q.w === first.w && q.s === first.s;
        if (isRetake) { retakeAt = served; retakeOpts = q.opts.slice(); }
        TASK.answerQuiz((isRetake ? q.opts.find(o => o !== q.answer) : q.answer) as string);
        labels.push((document.getElementById('tbNext')!.textContent || '').trim());
        TASK.nextQuiz();
      }
      const evs = TASK.events().filter(e => e.type === 'quiz');
      const forFirst = evs.filter(e => e.w === first.w && e.s === first.s).length;
      const sub = document.querySelector('.pass-summary .sub');
      return { skip: false, dupes, baseN, nAfterWrong, goInCard, served, retakeAt,
               origOpts, retakeOpts,
               nEnd: TASK.quizTotal(), finished: TASK.finished(), labels,
               wrong: TASK.quizWrong(), answered: TASK.quizDone(), events: evs.length, forFirst,
               summarySub: (sub && sub.textContent) || '' };
    });
    expect(got.skip).toBe(false);
    expect(got.dupes).toBe(1);
    expect(got.goInCard, '做题卡里不许再有第二颗推进按钮').toBe(0);
    expect(got.nAfterWrong, '补考进同一份清单：分母 +1').toBe(got.baseN + 1);
    expect(got.nEnd, '补考再错也不再补：整遍最多只多这一道题').toBe(got.baseN + 1);
    expect(got.retakeAt, '补考排在整遍（含自己）的最末尾').toBe(got.served);
    // 补考不许和原题长一模一样：还是那四个词，但排法必须不同（他 2026-09-22 拍的第二条）
    expect(got.retakeOpts.length, '补考那道确实出出来了').toBe(4);
    expect(got.retakeOpts.slice().sort().join('|'), '换的是排法，不是候选池').toBe(got.origOpts.slice().sort().join('|'));
    expect(got.retakeOpts.join('|'), '顺序与原题相同 = 补考在考"记得哪个位置"，不是考词').not.toBe(got.origOpts.join('|'));
    expect(got.finished, '补考只一轮，收工路径照样到得了').toBe(true);
    expect(got.forFirst, '原题 + 补考，各一道事件，没有第二条记账路径').toBe(2);
    expect(got.events).toBe(got.answered);
    // 进循环前那道原题也答了一次，所以 served（循环里答的题数）比总答题数少 1
    expect(got.answered).toBe(got.served + 1);
    expect(got.wrong, '「错 N」不双记：同一个词补考再错算一次').toBe(1);
    expect(got.labels[got.labels.length - 1], '末题任务条那颗写「小结」').toBe('小结');
    expect(got.labels, '中途仍然写「下一题」').toContain('下一题');
    expect(got.summarySub).toContain('补考 1 个，对 0 个');
    expect(/欠|待补|积压/.test(got.summarySub), '补考不是欠账').toBe(false);
  });

  test('② 答对就是毕业凭据：ok3 由 ② 写入，走完 ② 今天就算完', async ({ page }) => {
    const got = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      const before = Object.keys(TASK.state().words[q.w].ctx).length;
      TASK.answerQuiz(q.answer);
      const w = TASK.state().words[q.w];
      let guard = 0;
      while (!TASK.finished() && guard++ < 200) { if (TASK.currentQuiz()) TASK.nextQuiz(); else break; }
      const all = TASK.state().words;
      return { before, ctx: Object.keys(w.ctx).length, ok3: w.ok3, stage: w.stage,
               pass: TASK.pass(), finished: TASK.finished(),
               // 攒满两个语境的词，状态必须已经越过「已见面」
               recognizedOk: Object.keys(all).filter(k => Object.keys(all[k].ctx).length >= 2)
                                        .every(k => all[k].stage !== 'seen' && all[k].stage !== 'fresh') };
    });
    expect(got.ok3).toBeGreaterThan(0);            // D1：毕业信号搬到了 ②
    expect(got.ctx).toBeGreaterThan(got.before);   // 同一个语境也记账
    expect(got.recognizedOk).toBe(true);
    expect(got.pass).toBeLessThanOrEqual(2);       // 没有第三步可走
    expect(got.finished).toBe(true);
  });

  test('the plan never produces a third pass, and setPass(3) cannot open one', async ({ page }) => {
    const got = await page.evaluate(() => {
      const items = TASK.todayPlan(true).items;
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(3);
      const afterForced = TASK.pass();
      TASK.setPass(2);
      const d = TASK.state().daily[ShadowPlan.dayKey(Date.now(), 4)];
      return { passes: Array.from(new Set(items.map(x => x.pass))).sort().join(','),
               exItems: items.filter(x => x.s === 'ex').every(x => x.pass === 2),
               afterForced, bar: document.getElementById('taskBar').dataset.state,
               quizTotal: TASK.quizTotal(), done: (d || {}).quizDone };
    });
    expect(got.passes).toBe('2');                                  // 只剩一步题
    expect(got.exItems).toBe(true);                                // 例句二次确认题也在 ②
    expect(got.afterForced).toBeLessThanOrEqual(2);                // 旧的第三步入口点不动
    expect(got.bar).toBe('quiz');
  });

  test('界面上不许留任何「第三步 / ③ 选义」字样（D8）', async ({ page }) => {
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)); TASK.setPass(2); });
    const seen: string[] = [];
    seen.push((await page.locator('#taskBar').innerText()) || '');
    seen.push((await page.locator('#taskCard').innerText()) || '');
    for (const view of ['today', 'plan', 'book'] as const) {
      await page.evaluate((v) => { TASK.setView(v); TASK.openPanel(); }, view);
      await expect(page.locator('#todayPanel')).toBeVisible();
      seen.push((await page.locator('#todayPanel').innerText()) || '');
      await page.evaluate(() => TASK.closePanel());
    }
    await page.evaluate(() => { TASK.setPass(1); });
    seen.push((await page.locator('#taskBar').innerText()) || '');
    const all = seen.join(' ');
    for (const banned of ['③', '第三步', '选义', '看英文选中文', '三遍']) {
      expect(all, `界面上还留着「${banned}」`).not.toContain(banned);
    }
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

  test('② marks the picked wrong option red and the right one green', async ({ page }) => {
    const idx = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      TASK.setPass(2);
      const q = TASK.currentQuiz();
      return q && q.opts ? q.opts.findIndex(o => o !== q.answer) : -1;
    });
    test.skip(idx < 0, '这一批凑不出合格的四个候选 —— ② 按规格跳过');
    await expect(page.locator('.qz-opts')).toBeVisible();
    await page.locator('.qz-opt').nth(idx).click();
    expect(await page.locator('.qz-opt.wrong').count()).toBe(1);
    expect(await page.locator('.qz-opt.right').count()).toBe(1);
    expect(await page.locator('.qz-note').innerText()).toContain('正确的那一个是');
  });

  test('① → ② rolls through and the day is finished at the end', async ({ page }) => {
    const got = await page.evaluate(() => {
      const log: string[] = [];
      TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i));
      for (let g = 0; g < 200; g++) {
        log.push('p' + TASK.pass());
        const q = TASK.currentQuiz();
        if (!q) { if (TASK.pass() === 1) TASK.setPass(2); else break; continue; }
        TASK.answerQuiz(q.answer);
        TASK.nextQuiz();
      }
      const d = TASK.state().daily[Object.keys(TASK.state().daily).pop()];
      return { passes: Array.from(new Set(log)).join(','), done: TASK.finished(), quizDone: d.quizDone, correct: d.correct };
    });
    expect(got.passes).toBe('p1,p2');
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
  /* 底栏口径：2026-09-21 他先定「播放条的所有功能都放在通栏任务条上」，2026-09-22 又改一次
     「所有操作按钮一行展示，最重要的在最右、依次往左排」。以最后一句为准：一条通栏、一行按钮。
     所以断言一律以 #taskBar 为家 —— 别再拿 #audiobar 的可见性当依据。 */
  test('任务模式底栏只有一条、**一行**：所有操作按钮同一行，下一句在最右、退出在最左', async ({ page }) => {
    test.setTimeout(currentTimeout());   // hook 给了 12 分钟；这条本地 5 秒内该完
    // ① 通读：播放条整条不显示，它的功能全部住在任务条里
    await expect(page.locator('#audiobar')).not.toBeVisible();
    await expect(page.locator('#btnPlay')).not.toBeVisible();   // 2026-09-23：任务模式里 ▶ 撤掉了
    expect(await page.evaluate(() => document.getElementById('btnPlay')!.closest('#taskBar') !== null)).toBe(true);
    await expect(page.locator('.ab-left > .btn.ab-step:visible')).toHaveCount(0);
    await expect(page.locator('.ab-left > .btn.ab-step-fwd')).toHaveCount(1);       // 让出去的那颗还在 DOM 里，只是不显示
    await expect(page.locator('button:visible', { hasText: '放这一句' })).toHaveCount(1);
    await expect(page.locator('button:visible', { hasText: '上一句' })).toHaveCount(1);
    await expect(page.locator('#tbPrev')).toBeVisible();
    await expect(page.locator('#tbNext')).toBeVisible();
    await expect(page.locator('#tbExit')).toBeVisible();
    // 倍速旧版被 `body.task-mode .rate-wrap{display:none}` 整条藏掉、全页无第二个入口，这条守它别再丢
    await expect(page.locator('#rateCycle')).toBeVisible();
    await expect(page.locator('#btnLoop')).toBeVisible();
    await expect(page.locator('#btnAB')).toBeVisible();

    /* 他 2026-09-22 第二次改口（覆盖上一条口径）：「文字双行展示位于任务条左侧（核心信息在上、
       辅助信息下）；所有按钮位于任务条右侧；关闭按钮位于任务条右上方」。所以量四件事：
       ① 播放那一组住在按钮堆里；② 操作按钮垂直中心同一行；③ 从右往左 下一句→再来→上一句→播放；
       ④ 关闭在右上角 —— 它在按钮排的【上方】且贴右缘，不再跟它们抢同一行。 */
    const geo = await page.evaluate(() => {
      const ids = ['tbExit', 'btnPlay', 'btnLoop', 'rateCycle', 'tbPrev', 'tbAgain', 'tbNext'];
      const r: Record<string, { x: number; y: number; top: number; right: number }> = {};
      ids.forEach((id) => {
        const el = document.getElementById(id);
        if (!el) return;
        const b = el.getBoundingClientRect();
        r[id] = { x: b.left, y: b.top + b.height / 2, top: b.top, right: b.right };
      });
      /* btnPlay 不在这一排里量：任务模式撤掉了它（display:none → 量出来是 0×0 的方框，
         会把"同一行"和"从右往左"两把尺子一起带歪）。它仍在 DOM 里、仍住在 #tbPlay，上面已单独验过。 */
      const row = ['btnLoop', 'rateCycle', 'tbPrev', 'tbAgain', 'tbNext'].map((k) => r[k].y);
      const ab = document.querySelector('.tb-play .ab-right') as HTMLElement | null;
      const bar = document.getElementById('taskBar')!.getBoundingClientRect();
      const txt = document.querySelector('.tb-text')!.getBoundingClientRect();
      return {
        r,
        inBtns: !!document.getElementById('tbPlay')?.closest('.tb-btns'),
        spread: Math.max(...row) - Math.min(...row),
        abRightShown: !!ab && getComputedStyle(ab).display !== 'none',
        // 文字在左、按钮在右：文字块整体不许越过按钮排的左缘
        textLeftOfBtns: txt.right <= r.tbNext.x + 1,
        textTwoLines: document.querySelectorAll('.tb-text > *').length >= 2
          && (document.querySelector('.tb-title')!.getBoundingClientRect().top
              < document.querySelector('.tb-line2')!.getBoundingClientRect().top),
        exitAbove: r.tbExit.top < Math.min(...row),
        exitRight: bar.right - r.tbExit.right < 12,
      };
    });
    expect(geo.inBtns, '播放控件必须住在按钮行里（#tbPlay 在 .tb-btns 内），不许再单独占一行').toBe(true);
    expect(geo.abRightShown, '「读到第 N 句」那格在按钮排里没有位置，必须藏掉').toBe(false);
    expect(geo.spread, '所有操作按钮的垂直中心必须落在同一行').toBeLessThan(6);
    expect(geo.textTwoLines, '文字必须双行：核心在上、辅助在下').toBe(true);
    expect(geo.textLeftOfBtns, '文字靠左、按钮靠右：两者不许挤同一行的同一块地方').toBe(true);
    expect(geo.exitAbove, '关闭在任务条右上方，必须在按钮排的上面').toBe(true);
    expect(geo.exitRight, '关闭贴右上角').toBe(true);
    const order = ['tbNext', 'tbAgain', 'tbPrev'].map((k) => geo.r[k].x);
    expect(order, '从右往左：放这一句 → 再来 → 上一句').toEqual([...order].sort((a, b) => b - a));
    // 关闭这颗只留图标，名字由悬浮提示与 aria-label 说（他：鼠标悬浮要提示「退出任务模式」）
    await expect(page.locator('#tbExit')).toHaveAttribute('title', '退出任务模式');
    await expect(page.locator('#tbExit')).toHaveAttribute('aria-label', '退出任务模式');
    expect((await page.locator('#tbExit').innerText()).trim(), '关闭不许再占宽度写文字').toBe('');

    // ② 做题态：第二行整行消失（原型 :283-284 底部只有任务条一条；:382 那一步已随两步制删除）
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

  /* 2026-09-22 第二次改口后的四条锁（规格：docs/superpowers/specs/2026-09-22-任务模式底栏第二版.md）。
     前两条守的是他当场报的那个 bug：「只能跟着下一句走，上一句没反应」。 */
  /* 这四条不写 test.setTimeout：beforeEach 已经给了 currentTimeout()*6。
     上一版照抄邻居那条把超时压回 2 分钟，结果并发跑时被饿死在第一个 click 上 —— 假红。 */
  /* 2026-09-23 口径改了（他：「不点不放，点一句放一句」）：那颗键改名「放这一句」，放的是屏幕上这一句，
     放完才记完成、才前进。旧口径是点一下 = 把当前这句记成完成 + 跳下一句 —— 于是「上一句」退回去
     再点，会悄悄跳过退回的那句。这条用例改量新契约，但守的还是原来那个坑：队列位置与高亮必须对齐。 */
  test('当前句只有一套高亮，且「放这一句」放的是这一句：播完才前进，「上一句」退得回去', async ({ page }) => {
    // 全站不再有第二套「当前句」标记（描边那套已删，高亮回归常规模式的浅绿底纹）
    expect(await page.locator('.sent.task-current').count()).toBe(0);
    const playingIdx = () => page.evaluate(() => {
      const all = Array.from(document.querySelectorAll('.sent'));
      const on = all.findIndex((e) => e.classList.contains('playing'));
      return { on, n: all.filter((e) => e.classList.contains('playing')).length };
    });
    const title = () => page.evaluate(() => document.getElementById('tbTitle')!.textContent);
    // 把朗读引擎换成录音笔：__finish() 手动兑现「这一句放完了」，否则 headless 里永远等不到
    await page.evaluate(() => {
      const w = window as unknown as {
        speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[]; __finish: () => void;
      };
      w.__cbs = [];
      w.speak = function (_t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
      w.__finish = () => { const cb = w.__cbs.shift(); if (cb) cb(); };
    });

    const first = await playingIdx();
    expect(first.n, '同一时刻只能有一句被标成当前').toBe(1);

    await page.locator('#tbNext').click();
    expect((await playingIdx()).on, '「放这一句」放的就是这一句，高亮不许提前跑').toBe(first.on);

    const doneBefore = await title();
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await expect.poll(async () => (await playingIdx()).on).not.toBe(first.on);   // 放完才前进
    expect(await title(), '放完这一句，条上那个数要动').not.toBe(doneBefore);

    // 往回：高亮必须跟着回来（旧实现只搬正文高亮，队列位置留在原句）
    const fwd = (await playingIdx()).on;
    await page.locator('#tbPrev').click();
    await expect.poll(async () => (await playingIdx()).on).toBe(fwd - 1);
    // 退回后再点：放的必须是你退回的那句，而不是跳到它后面没听过的 —— 这一条只有队列位置真的对齐了才成立
    await page.locator('#tbNext').click();
    expect((await playingIdx()).on, '退回后点「放这一句」要放退回的这句').toBe(fwd - 1);
  });

  test('点 ✕ 先问一句：不退出、换成「继续做 / 退出」，两条出口都算数', async ({ page }) => {
    await page.locator('#tbExit').click();
    expect(await page.evaluate(() => document.getElementById('taskBar')!.dataset.state)).toBe('exit');
    expect(await page.evaluate(() => document.body.classList.contains('task-mode')), '问一句的时候还在任务模式里').toBe(true);
    await expect(page.locator('#tbStay')).toBeVisible();
    await expect(page.locator('#tbQuit')).toBeVisible();
    await expect(page.locator('#tbNext'), '问句这一态要把正文那排操作让出来').not.toBeVisible();
    await page.locator('#tbStay').click();
    expect(await page.evaluate(() => document.getElementById('taskBar')!.dataset.state)).toBe('read');
    expect(await page.evaluate(() => document.body.classList.contains('task-mode'))).toBe(true);
    await page.locator('#tbExit').click();
    await page.locator('#tbQuit').click();
    expect(await page.evaluate(() => document.body.classList.contains('task-mode')), '点「退出」才真的退出').toBe(false);
  });

  test('② 做题态也报「还剩几分钟」，且这个数来自他自己刚才的速度而不是编的', async ({ page }) => {
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach((x: any) => TASK.readDone(x.i)); TASK.setPass(2); TASK.next(); });
    await expect.poll(() => page.evaluate(() => document.body.classList.contains('quiz-mode'))).toBe(true);
    // 一题没答完：只报题数，不许凭空给一个分钟数
    const sub = () => page.evaluate(() => document.getElementById('tbSub')!.textContent || '');
    expect(await sub()).toMatch(/^还剩 \d+ 题/);
    expect(await sub(), '没有样本时不许编一个"约几分钟"').not.toMatch(/还剩 ~/);
    const q = await page.evaluate(() => { const x = TASK.currentQuiz(); return x ? x.answer : null; });
    expect(q, '这条用例要有题可答').toBeTruthy();
    await page.evaluate((a) => TASK.answerQuiz(a), q as string);
    await expect.poll(async () => (await sub()).includes('按你刚才的速度')).toBe(true);
    expect(await sub()).toMatch(/还剩 ~[^\d]*\d/);
  });

  test('底栏与播放条同一套玻璃；「本次多久」上了界面', async ({ page }) => {
    await page.evaluate(() => (TASK as any).setSessionStartForTest(Date.now() - 5 * 60000));
    const look = await page.evaluate(() => {
      const cs = (id: string) => getComputedStyle(document.getElementById(id)!);
      return {
        barBlur: cs('taskBar').backdropFilter, cardRadius: cs('taskBar').borderRadius,
        barBlur2: cs('audiobar').backdropFilter, cardRadius2: cs('audiobar').borderRadius,
        clock: document.getElementById('tbClock')!.textContent || '',
        sub: document.getElementById('tbSub')!.textContent || '',
      };
    });
    expect(look.barBlur, '任务条必须与播放条同款模糊玻璃').not.toBe('none');
    expect(look.cardRadius).toBe(look.cardRadius2);
    expect(look.clock, '本次多久挂在辅行右端的小表上（他 2026-09-22：条上只留三个数）').toMatch(/本次 \d+/);
    expect(look.sub, '「还剩」和「本次」不许挤在一起 —— 一边一个端').not.toMatch(/本次/);
  });

  /* 2026-09-22 全量走查（work/task_mode_audit.mjs + 代码审计）抓到的四个真问题，各钉一条。
     规格见 docs/superpowers/specs/2026-09-22-任务模式走查.md。 */
  test('走查修复：② 里点「继续任务」不拍回 ①、键盘 → 真的记进度、倍速不把句数平方、0 点日界线真的生效', async ({ page }) => {
    test.setTimeout(currentTimeout());

    /* (1) 键盘 → 必须等于屏幕上那颗「放这一句」。以前它直接 step(1)：能刷完整篇而 0/24 一动不动。
       2026-09-23 起计数搬到「这一句放完了」那一刻，所以这里要手动兑现一次"放完"才看得到数在动 ——
       守的还是原来那件事：键盘这条路不许绕过记账。 */
    const num = () => page.evaluate(() => ((document.getElementById('tbTitle') as HTMLElement).textContent || '').match(/\d+\s*\/\s*\d+/)?.[0]);
    await page.evaluate(() => {
      const w = window as unknown as {
        speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[]; __finish: () => void;
      };
      w.__cbs = [];
      w.speak = function (_t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
      w.__finish = () => { const cb = w.__cbs.shift(); if (cb) cb(); };
    });
    const before = await num();
    await page.keyboard.press('ArrowRight');
    await page.evaluate(() => (window as unknown as { __finish: () => void }).__finish());
    await expect.poll(() => num()).not.toBe(before);

    // (2) 已经在任务模式里，今日面板那颗写着「继续任务」—— 再点一次不许把流程拍回 ①、
    //     也不许让挂着的题卡变成四颗哑按钮（旧实现重拍批次 + pass=1，选项点了没反应）
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach((x: any) => TASK.readDone(x.i)); TASK.setPass(2); TASK.next(); });
    await expect.poll(() => page.evaluate(() => TASK.pass())).toBe(2);
    const optsBefore = await page.evaluate(() => document.querySelectorAll('#taskCard .qz-opt').length);
    await page.evaluate(() => TASK.enterTaskMode());
    expect(await page.evaluate(() => TASK.pass())).toBe(2);
    if (optsBefore) {
      expect(await page.evaluate(() => document.querySelectorAll('#taskCard .qz-opt').length)).toBe(optsBefore);
      // 出题后焦点要进卡：整块换 innerHTML 的卡片不主动接手，键盘就只能靠 1–4
      expect(await page.evaluate(() => !!(document.activeElement && document.activeElement.closest('#taskCard')))).toBe(true);
    }

    // (3) 倍速只许除一次。旧写法 host 传 secNew()（已除过）又传 rate，引擎再除一遍 → 1.5× 排 2.25 倍句子
    const rateLoad = await page.evaluate(() => {
      const set = (window as unknown as { setRate: (r: number) => void }).setRate;
      set(1); const one = TASK.todayPlan(true).queue.length;
      set(1.5); const fast = TASK.todayPlan(true).queue.length;
      set(1); return { one, fast };
    });
    expect(rateLoad.one).toBeGreaterThan(0);
    expect(rateLoad.fast).toBeLessThanOrEqual(Math.ceil(rateLoad.one * 1.6));   // 平方会到 2.25 倍

    // (4) 「几点算换一天」选 0 点得真的生效：以前宿主写 `boundaryHour || 4`，0 被吞回 4 点，
    //     而另一批读原始值的地方按 0 点算 —— 凌晨开工时两套账分叉
    const bd = await page.evaluate(() => {
      TASK.setBoundary(0);
      const got = TASK.todayPlan(true).stats.day;
      const want = ShadowPlan.dayKey(Date.now(), 0);
      TASK.setBoundary(4);
      return { got, want };
    });
    expect(bd.got).toBe(bd.want);
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

  /* 他 2026-09-23 拍的口径：「每次都提（只要今天没完成）」。
     起因是他 iPad 上报「页面刷新有时候出现两个条，有时是一个播放器的条」—— 量下来不是重叠也不是 bug：
     多出来那条是续读卡，而旧逻辑用 sessionStorage 记「这一趟提过没有」，于是同一标签页第二次刷新就只剩一条。
     一次提一次不提，读起来就像时好时坏。判据换成只看今天的活做完没有：没做完就每趟刷新都提，
     做完就不提。上面那条「今天先不做」的用例是这件事的另一半 —— 他主动按下的那颗，当天仍然算数。 */
  test('只要今天没做完，同一趟里连着刷新也每次都提（不再"这趟提过了"就收声）', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout());
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.resumeDay');   // 别拿上一轮残留的那把锁当前提
      TASK.resetV2(); TASK.initPlan(20);
      TASK.todayPlan(true).queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
    });
    for (const n of [1, 2, 3]) {                            // 三趟刷新，趟趟都在
      await page.reload();
      await expect(page.locator('#taskBar'), `第 ${n} 次刷新就该提`).toBeVisible();
      expect(await barState(page)).toBe('resume');
    }
    // 反向别踩：今天这批读完了就不该再提 —— 否则这条卡就成了赶不走的常驻栏
    await page.evaluate(() => { TASK.todayPlan(true).queue.forEach(x => TASK.readDone(x.i)); });
    await page.reload();
    await expect(page.locator('#taskBar')).not.toBeVisible();
  });

  /* 走查 2026-09-22「下一批」#5 + #4：
     #5 全新的一天（一句没读）首屏也得给一条能点的提示 —— 以前被 `doneN > 0` 挡着，界面零提示；
     #4 顶栏那颗绿点的判据与条上那个 n/N 同源（都读 todayLeftN()），不再走旧句子账。 */
  test('今天一句没读：首屏给一条能点的「今天 N 句」，绿点与进度同源', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout());
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    // 唯一能让它不提的是「今天先不做」那把按天的锁；上一轮万一留着，这里清掉，别拿残留当前提
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.resumeDay');
      TASK.resetV2(); TASK.initPlan(20);
    });
    await page.reload();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await barState(page)).toBe('resume');
    await expect(page.locator('#tbTitle')).toContainText(/今天 \d+ 句/);
    await expect(page.locator('#tbNext')).toContainText('开始');
    expect(await page.evaluate(() => document.getElementById('tbSub')!.textContent?.trim()),
      '开跑那一屏不给第二个数').toBe('');
    // 绿点：今天还有没读完的 → 亮
    expect(await page.evaluate(() => document.getElementById('btnToday')!.classList.contains('has-task'))).toBe(true);
    await page.locator('#tbNext').click();                      // 一步开跑
    await expect.poll(() => page.evaluate(() => TASK.active)).toBe(true);
    await page.evaluate(() => TASK.exitTaskMode());
    // 把今天这批读完：绿点跟着灭 —— 它读的就是条上那个 n/N 的同一份账
    const after = await page.evaluate(() => {
      TASK.todayPlan(true).queue.forEach((x: any) => TASK.readDone(x.i));
      TASK.updateBtn();
      return { dot: document.getElementById('btnToday')!.classList.contains('has-task'),
               left: ((document.getElementById('tbTitle')!.textContent || '').match(/\d+\s*\/\s*\d+/) || [''])[0] };
    });
    expect(after.dot, `今天读完了（条上 ${after.left}）绿点还亮着，就是两本账又分叉了`).toBe(false);
  });
});
