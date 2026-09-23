// 3.0 M1 Task 5：点首页卡片 → 进这一篇的任务模式（按篇队列 + ① 通读）。
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，所以用 E2E_ROOT_URL。
//
// 数据用 stub 而不用真课文（和 shell.spec / home.spec 同一理由）：真课文一页 1833 句 +
// 3242 词，整套并行时会压出 shadow 用例偶发红。这里要的是「有 [[词:形式]] 标记的真句子」，
// 引擎据此才能排句 —— 六篇句数刻意不等，才能锁住「按篇」而不是「全局」。
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

/* 造一份「刚建好、还没读」的 15 分钟计划，然后刷新让首页读到它。 */
async function freshPlan(page: import('@playwright/test').Page) {
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
}

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
    await expect(top.locator('.tt-back')).toContainText('返回首页');
    await expect(top.locator('#ttTitle')).toHaveText('地球与生命');

    await top.locator('.tt-back').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
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
    await page.locator('#taskTop .tt-back').click();
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
     刷新后 daily 不丢（repsByArticle 随 daily 落盘）。 */
  test('入口 1 收工态：① 走完 → 答题 → 收工「回首页 + 看词本」，刷新 daily 不丢', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.locator('.art-card').first().click();
    await expect(page.locator('#taskBar')).toBeVisible();
    // ① 真路径：stub 朗读引擎，把这一篇标成读完，点两下「下一句」触发 finishPass(1)
    await page.evaluate(() => {
      (window as unknown as { speak: (t: string, cb?: () => void) => void }).speak = () => {};
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    await page.evaluate(() => { TASK.next(); TASK.next(); });
    // 入口 1 的小结按钮（§4.4：提示「答题」）
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

    // 存档：刷新后 daily 一字不差
    const before = await page.evaluate(() => TASK.state().daily);
    await page.reload();
    await page.waitForFunction(() => { try { return !!(TASK.state() && TASK.state().daily); } catch (e) { return false; } });
    expect(await page.evaluate(() => TASK.state().daily)).toEqual(before);
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
