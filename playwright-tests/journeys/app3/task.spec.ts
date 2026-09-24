// 3.0 M1 Task 5：点首页卡片 → 进这一篇的任务模式（按篇队列 + ① 通读）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，所以用 E2E_ROOT_URL。
//
// 数据用 stub 而不用真课文（和 shell.spec / home.spec 同一理由）：真课文一页 1833 句 +
// 3242 词，整套并行时会压出 shadow 用例偶发红。这里要的是「有 [[词:形式]] 标记的真句子」，
// 引擎据此才能排句 —— 六篇句数刻意不等，才能锁住「按篇」而不是「全局」。
import fs from 'node:fs';
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  enterTaskMode(): void;
  setPass(n: number): void;
  readDone(i: number): void;
  next(): void;
  answerQuiz(choice: string): boolean;
  nextQuiz(): void;
  quizTotal(): number;
  quizDone(): number;
  pass(): number;
  currentQuiz(): { opts: string[]; answer: string } | null;
  queue: { i: number }[];
  hasPlan: boolean;
  state(): { daily: Record<string, unknown> };
  events(): unknown[];
  openArticleQuiz(a: number): void;
  seedArticleForTest(a: number, o: { quizOk?: number; quizNo?: number; reps?: number; pass2?: boolean }): void;
  repsOf(a: number): number;
  articlePass2Done(a: number): boolean;
  exportBackup(): void;
};
declare const APP3: { currentBlank(): number; openBlank(bi: number): void };
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
  assemble(state: unknown, opts: unknown): {
    items: { w: string; pool: string; s: number | string; kind?: string; pass?: number; from?: number | string }[];
  };
};
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇，句数刻意不等：第 0 篇 12 句，其余各 2 句 → 全局 22 句。
   每个词带篇号前缀（a0_w0 / a1_w0 …），否则引擎的「一个词只算一次」会把后几篇的
   同名词当成第 0 篇的重复，全局队列缩回第 0 篇 —— 那样就锁不住「按篇」了。
   若任务条拿的是全局句数，N 会是 22；按篇才该是 12。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': '{}',
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

/* 等 app 真正就位：loadData 落地（SECTIONS 非空）+ TASK.init 跑过（ROOT2.state.daily 存在）。
   page.reload() 在 load 事件就返回，而 initApp 的 loadData().then(TASK.init) 还在后面异步跑 ——
   不等这一步，紧跟其后的 page.evaluate(readDone / seedArticleForTest / SECTIONS) 会落在
   尚未初始化的页面上静默空转（全量并行时 loadData 变慢就偶发，单跑几乎撞不上）。 */
async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

/* 造一份「刚建好、还没读」的 15 分钟计划，然后刷新让首页读到它。 */
async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);   // 首次加载也要就位，resetV2 的 indexWords 才拿得到真 SECTIONS
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);   // 刷新后必须等 init 完成，调用方紧接着的 evaluate 才不是空转
}

/* 把朗读引擎换成录音笔：__spoken 记交给了引擎几句，__finish() 手动兑现「这句播完了」。
   headless 里 speechSynthesis 根本不发声，不这么做 taskSentenceFinished（→ bumpArticleRep）
   永远不会被叫到（和 shadow/task-mode-step.spec.ts 同一套 stub）。 */
async function installSpeakStub(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
    w.__cbs = [];
    w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
  });
}
const finishSpeak = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const w = window as unknown as { __cbs: (() => void)[] }; const cb = w.__cbs.shift(); if (cb) cb(); });

test.describe('3.0 文章任务模式（按篇队列）', () => {
  test('点卡片 → 任务模式，n/N 是这一篇的句数（不是全局）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toBeVisible();
    const n = await page.evaluate(() =>
      Number(document.getElementById('tbTitle')!.textContent!.match(/\/\s*(\d+)/)![1]));
    const art0 = await page.evaluate(() => ShadowPlan.articleScope(SECTIONS, 0).size);
    const all = await page.evaluate(() =>
      SECTIONS.reduce((a, s) => a + s.paragraphs.reduce((x, p) => x + p.length, 0), 0));
    expect(art0, '夹具要让第 0 篇句数 ≠ 全局句数，否则锁不住按篇').not.toBe(all);
    expect(n, '任务条的 N 必须是第一篇的句数').toBe(art0);
  });

  test('按篇队列：排出来的句一句都不许出这一篇', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').nth(1).click();   // 第二篇
    await expect(page.locator('#taskBar')).toBeVisible();
    const got = await page.evaluate(() => ({
      q: TASK.queue.map((x) => x.i),
      scope: Array.from(ShadowPlan.articleScope(SECTIONS, 1)),
    }));
    expect(got.q.length, '队列为空 = 这条什么都没测').toBeGreaterThan(0);
    expect(got.q.every((i) => got.scope.includes(i)), `队列混进了第二篇以外的句：${got.q}`).toBe(true);
  });

  test('任务模式里正文是主角：#appShell 让位，#art 可见', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    expect(await page.locator('#appShell').isVisible(), '任务模式里首页外壳必须让位').toBe(false);
    await expect(page.locator('#art')).toBeVisible();
    await expect(page.locator('#art .sent').first()).toBeVisible();
  });

  test('横幅的文章名与「还剩」读的是同一篇（T4）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    const main = page.locator('#homeBanner .hb-main');
    // 先等横幅落地（数据是异步拉的）——不等就 evaluate 读 SECTIONS 会偶发 undefined。
    await expect(main).toContainText('继续学');
    const info = await page.evaluate(() => ({
      title: SECTIONS[0].title,
      size: ShadowPlan.articleScope(SECTIONS, 0).size,
    }));
    await expect(main).toContainText(`《${info.title}》`);
    await expect(main, '「还剩」的 N 必须与文章名同属一篇').toContainText(`还剩 ${info.size} 句`);
  });

  // 审阅 I1：任务模式没有顶栏，光一颗 ✕ 不说明「退出 = 回首页选下一篇」。
  test('任务模式顶栏：文章标题 + 返回首页，点了回首页（I1）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    const top = page.locator('#taskTop');
    await expect(top).toBeVisible();
    // W1 重做：头部照抄主站 .reader-head —— 返回是 .back 圆钮，标题是 .r-title 里的 .tt-zh
    await expect(top.locator('.reader-head .back')).toBeVisible();
    await expect(top.locator('#ttTitle .tt-zh')).toHaveText('地球与生命');
    await expect(top.locator('#ttTitle .r-pos')).toContainText('第 1/6 篇');

    await top.locator('.reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    // 文章内头部只在任务模式现身（一级页面头部是 #shellTop，见 leftovers.spec.ts）
    await expect(page.locator('#taskTop')).toBeHidden();
    await expect(page.locator('.art-card')).toHaveCount(6);
  });

  // 审阅 I2：退出后首页卡片/横幅还停在进任务模式前的进度，要等点导航或刷新才更新。
  test('退出任务模式后首页立即刷新，不用刷新页面（I2）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    // 读前 6 句（12 句的一篇）：熟练度 = round(6/12 × 40) = 20
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).slice(0, 6).forEach((i) => TASK.readDone(i));
    });
    await page.locator('#taskTop .reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card').first().locator('.a-pct')).toHaveText('20%');
  });
});

/* ② 文内挖空要用真四选一：引擎（buildQuiz）凑满 4 个候选才出题，所以这几篇的词必须配
   vocab 卡，且义项互不重叠（n. 苹果 / n. 香蕉 …）—— 否则 blankQuiz 过不了词性/双解闸。
   四个词轮着出现，同段就有 3 个同词性干扰项，四选一必然凑得齐。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + QSENSES[i] }; });
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = QWORDS[(ai + i) % QWORDS.length];
      return `Sentence ${i} about [[${w}:${w}]].`;
    })],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

test.describe('3.0 ② 文内挖空 + 浮窗选择（底部题卡作废）', () => {
  test('② 挖空长在正文里，点空弹浮窗，下一题定位到下一个空', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));

    // 空是正文里的内联元素，且**不存在**底部题卡
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
    expect(await page.locator('#taskCard').count(), '底部题卡必须不存在').toBe(0);

    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
    await page.locator('#blankPop .qz-opt').first().click();
    await expect(page.locator('#art .qz-blank').first()).toHaveClass(/qa-done/);
    await expect(page.locator('#blankPop')).toBeHidden();

    const before = await page.evaluate(() => APP3.currentBlank());
    await page.locator('#tbNext').click();
    expect(await page.evaluate(() => APP3.currentBlank())).not.toBe(before);
  });

  test('390px 宽下浮窗锚在空旁边、不越出屏幕', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));
    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop')).toBeVisible();
    const box = await page.locator('#blankPop').boundingBox();
    expect(box, '浮窗必须有几何位置').not.toBeNull();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  });

  // 审阅 Important 1：② 的分母数了答不了的题（词卡例句题 s==='ex' 没有正文空位可挖）。
  test('② 的分母只数答得出的题：词卡例句题不计入，也不占进度', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    // 往引擎排出的批次里塞一条没有正文空位的 'ex' 题（模拟真实会出现的词卡例句题）
    await page.evaluate(() => {
      const orig = ShadowPlan.assemble;
      ShadowPlan.assemble = function (state, opts) {
        const r = orig(state, opts);
        if (r && r.items && r.items.length) {
          const f = r.items[0];
          r.items.push({ kind: 'quiz', pass: 2, s: 'ex', w: f.w, pool: f.pool, from: f.s });
        }
        return r;
      };
    });
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));
    const raw = await page.evaluate(() => TASK.quizTotal());
    const blanks = await page.locator('#art .sent .qz-blank').count();
    const n = await page.evaluate(() =>
      Number(document.getElementById('tbTitle')!.textContent!.match(/\/\s*(\d+)/)![1]));
    expect(raw, '夹具里必须真有一条答不了的题，否则这条测不到东西').toBeGreaterThan(blanks);
    expect(n, '② 的分母 = 真能挖出来的空数，不是 quizList 原始长度').toBe(blanks);
  });

  // 审阅 Important 2：乱序点空后，「下一题」必须去找下一个未答的空，既不重问也不漏。
  test('下一题 = 下一个未答的空：乱序点空不漏、不重问', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));

    const total = await page.locator('#art .qz-blank').count();
    expect(total, '夹具要有多于一个空，乱序才有意义').toBeGreaterThan(2);
    // 答对（答错会生成补考，而补考本就是「同一空再问一次」，会把这条断言搅浑）
    const answerCorrectly = async () => {
      const idx = await page.evaluate(() => {
        const q = TASK.currentQuiz()!;
        return q.opts.indexOf(q.answer);
      });
      await page.locator('#blankPop .qz-opt').nth(idx).click();
    };

    // 乱序：先答第 3 个空（跳过前两个）
    await page.evaluate(() => APP3.openBlank(3));
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
    await answerCorrectly();
    await expect(page.locator('#art .qz-blank[data-bi="3"]')).toHaveClass(/qa-done/);
    expect(await page.evaluate(() => TASK.quizDone())).toBe(1);

    // 下一题去找下一个未答的空，不会落回刚答过的第 3 个
    const after = await page.evaluate(() => { TASK.next(); return APP3.currentBlank(); });
    expect(after, '下一题不能落回刚答过的空').not.toBe(3);
    expect(await page.evaluate(() => TASK.quizDone()), '重问会多记一条 quiz 事件').toBe(1);

    // 点一个已答过的空：只回看（选项禁用），不再记事件
    await page.evaluate(() => APP3.openBlank(3));
    expect(await page.evaluate(() => TASK.quizDone()), '回看态不许再记一次').toBe(1);
    await expect(page.locator('#blankPop .qz-opt[disabled]')).toHaveCount(4);

    // 一路「下一题 + 答对」直到没有空：每个空恰好答一次，一个都不落下
    for (let guard = 0; guard < total + 5; guard++) {
      await page.evaluate(() => TASK.next());
      const open = await page.locator('#blankPop .qz-opt:not([disabled])').count();
      if (open === 0) break;
      await answerCorrectly();
    }
    await expect(page.locator('#art .qz-blank.qa-done')).toHaveCount(total);
    expect(await page.evaluate(() => TASK.quizDone()), '每个空恰好答一次，没有重复事件').toBe(total);
    await expect(page.locator('#blankPop')).toBeHidden();
  });

  /* ===== Task 7：收工态 + 两条入口 + 存档回归 =====
     入口 1 走真路径（① 完成 → 小结 → ② 答完）；收工态两颗键「回首页 / 看词本」；
     刷新后 daily 不丢，且 repsByArticle 真的落盘、过了 reload 还在（§7.6 的精读次数）。 */
  test('入口 1 收工态：① 走完 → 答题 → 收工「回首页 + 看词本」，刷新 daily 不丢', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();

    /* ① 真路径（不是 readDone 伪造）：点「放这一句」→ 兑现 speak 回调 → 走
       taskSentenceFinished → recordRep + bumpArticleRep，精读次数真的记一笔。 */
    await installSpeakStub(page);
    await page.locator('#tbNext').click();
    await finishSpeak(page);
    // 这一句读完后，后面的读Done会各调一次 push2→recompute2 —— 若没有 copy-back，这一笔就被抹了
    await page.evaluate(() => {
      TASK.queue.map((x) => x.i).forEach((i) => TASK.readDone(i));
    });
    // 再点一下「下一句」：没有未读 → finishPass(1) → 小结
    await page.evaluate(() => TASK.next());
    await expect(page.locator('#passCard .pass-summary .go')).toContainText('答题');

    await page.locator('#passCard .pass-summary .go').click();
    // 答完整批（含末尾补考段）
    await page.evaluate(() => {
      for (let g = 0; g < 300; g++) {
        const q = TASK.currentQuiz();
        if (!q) break;
        TASK.answerQuiz(q.answer);
        TASK.nextQuiz();
      }
    });
    // 收工态：两颗键换成「回首页 / 看词本」，今天完成的摘要还在
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('#tbAgain')).toContainText('回首页');
    await expect(page.locator('#tbNext')).toContainText('看词本');
    await expect(page.locator('#tbTitle')).toContainText('今天完成');
    await expect(page.locator('#tbSub')).toContainText('句');

    // 刷新前：精读次数必须已经记到这一篇上（证明走了 taskSentenceFinished → bumpArticleRep）
    const repsBefore = await page.evaluate(() => TASK.repsOf(0));
    expect(repsBefore, '① 只放真一句，精读次数就该 > 0；还是 0 说明没走 taskSentenceFinished').toBeGreaterThan(0);
    // I2：这份账住 3.0 自己的 key，**不在**共享的 ielts.shadow.v2 里（否则开 /shadow/ 就被抹）
    const shared = await page.evaluate(() => localStorage.getItem('ielts.shadow.v2') || '');
    expect(shared.includes('repsByArticle'), '共享 blob 里不该再有 repsByArticle').toBe(false);
    expect(await page.evaluate(() => !!localStorage.getItem('ielts.app3.article')), '3.0 自己的按篇 key 必须落盘').toBe(true);

    // 存档：刷新后 daily 一字不差，且精读次数原样还在
    const before = await page.evaluate(() => TASK.state().daily);
    await page.reload();
    await page.waitForFunction(() => { try { return !!(TASK.state() && TASK.state().daily); } catch (e) { return false; } });
    const after = await page.evaluate(() => TASK.state().daily);
    expect(after).toEqual(before);
    expect(await page.evaluate(() => TASK.repsOf(0)), '精读次数必须随自己的 key 过 reload').toBe(repsBefore);
  });

  /* §9.2 第二、三项各自的回归锁：只动一项输入，断言 progress 等于把公式算出来的数。
     算术写在断言里，谁改了权重或输入来源，这两条就 RED。 */
  test('熟练度公式：② 正确率（×35）与精读重复度（×25）各自单独动数（§9.2）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // 第 0 篇 8 句：通读满 → 第一项 = 40（后面两项的基准）
    const phase = async (seed: { quizOk: number; quizNo: number; reps: number }, expected: string) => {
      await waitAppReady(page);   // goto/上一次 reload 之后 init 可能还没跑完，evaluate 会空转
      await page.evaluate((sd) => {
        TASK.resetV2(); TASK.initPlan(15);
        Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i: number) => TASK.readDone(i));
        TASK.seedArticleForTest(0, sd);
      }, seed);
      await page.reload();
      await expect(page.locator('.art-card').first().locator('.a-pct')).toHaveText(expected);
    };
    /* 只动第二项：8 题 4 对 4 错 → quizRate = 4/8 = 0.5
       progress = round(8/8×40 + 0.5×35 + 0×25) = round(40 + 17.5) = round(57.5) = 58 */
    await phase({ quizOk: 4, quizNo: 4, reps: 0 }, '58%');
    /* 只动第三项：quiz 清零，精读 8 次（= 句数）→ min(8/(8×2),1) = 0.5
       progress = round(8/8×40 + 0×35 + 0.5×25) = round(40 + 12.5) = round(52.5) = 53 */
    await phase({ quizOk: 0, quizNo: 0, reps: 8 }, '53%');
  });

  // 收工态两颗键各自去哪：看词本 → #/words 占位屏；回首页 → 首页六张卡片。
  test('收工态：看词本 → #/words；回首页 → 首页', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    // 直接进该篇任务模式并切到 ②，答完这批 → 收工态
    const finishQuiz = async () => {
      await page.locator('.art-card').first().click();
      await expect(page.locator('#taskBar')).toBeVisible();
      await page.evaluate(() => {
        TASK.setPass(2);
        for (let g = 0; g < 300; g++) {
          const q = TASK.currentQuiz();
          if (!q) break;
          TASK.answerQuiz(q.answer);
          TASK.nextQuiz();
        }
      });
      await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    };
    await finishQuiz();
    await page.locator('#tbNext').click();
    await expect(page).toHaveURL(/#\/words/);
    await expect(page.locator('#appView')).toContainText('单词本');

    await page.goto(`${rootUrl}/app/index.html#/home`);
    await finishQuiz();
    await page.locator('#tbAgain').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card')).toHaveCount(6);
  });

  /* 入口 2（§4.4）：通读已完成的篇目，首页卡片多一颗「答题」，点了直达 ② —— 不必先跑 ①。
     批次与「① 后进 ②」同源（都取当天 assemble 的 items 快照）。 */
  test('入口 2：通读完成的卡片有「答题」，点了直达 ②（不要求先跑 ①）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    // 只通读、不做题 → 该篇「② 可答题」（data-stage="read"）
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    await page.reload();
    const quizBtn = page.locator('.art-card[data-stage="read"] .a-quiz');
    await expect(quizBtn).toHaveCount(1);
    await expect(quizBtn).toContainText('答题');

    await quizBtn.click();
    // 直达 ②：已在任务模式、正文已挖空、点空弹四选一
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    expect(await page.locator('#art .sent .qz-blank').count(), '直达 ② 必须立刻挖空').toBeGreaterThan(0);
    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
  });

  // 审阅 Important 3：入口 1（① 走完 → 小结 → 开始答题）没有 E2E，补一条走真路径的。
  test('入口 1：① 走完 → 小结「开始答题」→ 正文立刻挖空（§13.1）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    // headless 不发声：换掉朗读引擎（顶层的 speak 就是 window.speak），再手动把这一篇标成读完
    await page.evaluate(() => {
      (window as unknown as { speak: (t: string, cb?: () => void) => void }).speak = () => {};
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    // ① 态点两下「下一句」：第一下放这一句，第二下没有未读 → finishPass(1) → 小结
    await page.evaluate(() => TASK.next());
    await page.evaluate(() => TASK.next());
    await expect(page.locator('#passCard')).toBeVisible();
    await expect(page.locator('#passCard .pass-summary .go')).toContainText('开始');
    // 小结出现时正文已经挖空
    expect(await page.locator('#art .sent .qz-blank').count()).toBeGreaterThan(0);
    // 点「开始答题」→ 小结收掉、浮窗弹出
    await page.locator('#passCard .pass-summary .go').click();
    await expect(page.locator('#passCard')).toBeHidden();
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
  });
});

/* 终审 B1（§2.3 / §13.1 / §14.2）：没计划的新用户点卡片，过去是静默无反应（if (!plan) return）。
   现在要：照进这一篇的任务模式（正文可读、自由跟读），任务条那一格换空状态 +「去设置」，
   点它进 v2.0 设置屏，建完计划回到这一篇换成真任务条。 */
test.describe('3.0 §2.3 没计划也能进任务模式', () => {
  test('新用户点卡片 → 自由跟读 + 空状态任务条 →「去设置」建计划 → 真任务条回来', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // 全新用户：清掉真值根与 3.0 按篇账，刷新让首页读到「没计划」
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    await expect(page.locator('#homeBanner .b-go')).toContainText('设置');

    // 点第一张卡：不再静默无反应 —— 进任务模式、正文可见
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#art')).toBeVisible();
    expect(await page.locator('#art .sent').count(), '正文必须渲出来').toBeGreaterThan(0);

    // 任务条那一格是空状态（§2.3）
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await expect(page.locator('#tbTitle')).toContainText('还没有学习计划');
    await expect(page.locator('#tbSub')).toContainText('去设置每天读多久');
    await expect(page.locator('#tbNext')).toContainText('去设置');
    // 自由跟读：播放条控件搬进任务条了，那颗 ▶ 也在
    await expect(page.locator('#taskBar .tb-play')).toBeVisible();
    await expect(page.locator('#taskBar #btnPlay')).toBeVisible();

    // 点「去设置」→ 出设置屏（复用影子跟读的 renderSetup）
    await page.locator('#tbNext').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();

    // 建计划 → 回到那一篇，换成真任务条
    await page.locator('#setupSheet .ps-opt').nth(2).click();      // 15 分钟
    await page.locator('#setupSheet .ps-start').click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
    await expect(page.locator('#tbTitle')).toContainText('① 通读');
  });
});

/* 终审 I1（§9.4）：卡片的「已学完」= 通读一遍 + 这一篇的 ② 批次答过一遍，
   不是「答对全篇每一句」（一遍 ② 只考当天队列那几十题，后者永远到不了）。 */
test.describe('3.0 §9.4 已学完判据', () => {
  test('通读一遍 + ② 批次答过一遍 → 卡片「已学完」（不要求答对全篇）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    await page.reload();
    await expect(page.locator('.art-card').first()).toHaveAttribute('data-stage', 'read');

    // 入口 2 直达 ②，答完整批（含补考段）
    await page.locator('.art-card[data-stage="read"] .a-quiz').click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => {
      for (let g = 0; g < 300; g++) {
        const q = TASK.currentQuiz();
        if (!q) break;
        TASK.answerQuiz(q.answer);
        TASK.nextQuiz();
      }
    });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    expect(await page.evaluate(() => TASK.articlePass2Done(0)), '② 批次走完必须按篇记凭据').toBe(true);

    // 收工态「回首页」→ 首页立即重渲（I2），卡片变「已学完」
    await page.locator('#tbAgain').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card').first()).toHaveAttribute('data-stage', 'done');
    await expect(page.locator('.art-card').first().locator('.a-stage')).toHaveText('已学完');
  });
});

/* 终审 I2：repsByArticle 过去塞在共享的 ielts.shadow.v2 里，而 /shadow/ 的 recompute2 没有
   回搬分支 —— 一开影子跟读就被抹。现在搬到 3.0 自己的 key，开 /shadow/ 也动不了它。 */
test.describe('3.0 按篇账不随共享 blob 走', () => {
  test('精读次数住自己的 key：开一次 /shadow/ 也抹不掉，reload 还在', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => TASK.seedArticleForTest(0, { reps: 3 }));
    expect(await page.evaluate(() => TASK.repsOf(0))).toBe(3);
    // 共享 blob 里不许再有这份账（它只该住 ielts.app3.article）
    expect(await page.evaluate(() => (localStorage.getItem('ielts.shadow.v2') || '').includes('repsByArticle'))).toBe(false);

    // 备份：3.0 自己的 key 必须随 exportBackup 一起走（换设备才带得走精读次数）
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.evaluate(() => TASK.exportBackup()),
    ]);
    const payload = JSON.parse(fs.readFileSync((await download.path()) as string, 'utf8'));
    expect(Object.keys(payload.data), '备份必须含 ielts.app3.article').toContain('ielts.app3.article');

    /* 逼影子跟读走一次 recompute2：把 eventsSeen 改错，它的 loadRoot 就会从事件流重放 daily。
       这正是过去抹掉 repsByArticle 的那条码路。 */
    await page.evaluate(() => {
      const v = JSON.parse(localStorage.getItem('ielts.shadow.v2') || '{}');
      v.state = v.state || {}; v.state.eventsSeen = -1;
      localStorage.setItem('ielts.shadow.v2', JSON.stringify(v));
    });
    await page.goto(`${rootUrl}/shadow/index.html`);
    await page.waitForFunction(() => document.querySelectorAll('.sent').length > 0);

    // 回 3.0：按篇账还在（同源共享 localStorage，影子跟读重写了 v2 也动不到这个 key）
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.waitForFunction(() => { try { return !!(TASK.state() && TASK.state().daily); } catch (e) { return false; } });
    expect(await page.evaluate(() => TASK.repsOf(0)), '/shadow/ 不许抹掉 3.0 的按篇账').toBe(3);
  });
});

/* 终审顺手项：§4.4 空按被遮词形给宽（不是固定 3.2em）。
   夹具里四个名词长度差得远（cat / banana / elephant / hippopotamus），长词的空必须明显更宽。 */
const LONGWORDS = [
  { w: 'cat', m: 'n. 猫' },
  { w: 'banana', m: 'n. 香蕉' },
  { w: 'elephant', m: 'n. 大象' },
  { w: 'hippopotamus', m: 'n. 河马' },
];
const SIXLONG: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  LONGWORDS.forEach((x) => { vocab[x.w] = { m: x.m }; });
  const mk = (title: string, ai: number, n: number) => ({
    title,
    zh: title,
    subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = LONGWORDS[(ai + i) % LONGWORDS.length].w;
      return `Sentence ${i} about [[${w}:${w}]].`;
    })],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

test.describe('3.0 终审顺手项', () => {
  test('§4.4 空按被遮词形给宽：长词的空比短词明显宽', async ({ page }) => {
    await stubData(page, SIXLONG);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));
    const vals = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#art .sent .qz-blank'))
        .map((el) => (el as HTMLElement).getBoundingClientRect().width));
    expect(vals.length, '夹具要挖出多个空').toBeGreaterThan(1);
    const min = Math.min(...vals), max = Math.max(...vals);
    expect(max, '长词的空必须比短词明显宽（固定 3.2em 时二者相等）').toBeGreaterThan(min * 1.5);
  });

  test('Global Constraint：.a-quiz / .b-go 触区 ≥44px（头部照抄主站，用 hit-slop 扩热区）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    // .b-go：横幅那颗
    const goH = await page.locator('#homeBanner .b-go').evaluate((el) => el.getBoundingClientRect().height);
    expect(goH, '.b-go 触区').toBeGreaterThanOrEqual(44);
    /* 文章内头部（W1 重做）：.back 照抄主站，30px 视觉 + ::after 外扩热区（不撑大视觉）。
       所以这里只断言它在，不再断言 44px —— 主站的头部组件本就用 hit-slop 而不是放大视觉。 */
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskTop')).toBeVisible();
    await expect(page.locator('#taskTop .reader-head .back')).toBeVisible();
    await page.locator('#taskTop .reader-head .back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    // .a-quiz：通读满后卡片才出「答题」
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    await page.reload();
    const quizH = await page.locator('.art-card .a-quiz').first().evaluate((el) => el.getBoundingClientRect().height);
    expect(quizH, '.a-quiz 触区').toBeGreaterThanOrEqual(44);
  });

  test('② / 收工态 #tbNext 的 title/aria 与可见文字一致（不再说「下一句」）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    await page.evaluate(() => TASK.setPass(2));
    const nxt = page.locator('#tbNext');
    await expect(nxt).toHaveAttribute('aria-label', '跳过这题');
    // 答完整批 → 收工态：可见「看词本」，title/aria 也必须说「看词本」
    await page.evaluate(() => {
      for (let g = 0; g < 300; g++) {
        const q = TASK.currentQuiz();
        if (!q) break;
        TASK.answerQuiz(q.answer);
        TASK.nextQuiz();
      }
    });
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await expect(nxt).toContainText('看词本');
    await expect(nxt).toHaveAttribute('aria-label', '看词本');
  });
});
