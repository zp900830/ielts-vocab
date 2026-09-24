// 3.0 M1 遗留清单第二半（W3 / W4 / W5 / W7 / W8）。
// W3 · ② 答题对错的 aria-live 播报（PRD §10.4）
// W4 · buildQueue 里的死按篇闸（M2 风险）
// W5 · 观感类小项（占位屏 / 连续 0 天 / 已学完卡片不再出答题 / 卡片结构 / 浮窗避让任务条 /
//      回看句子已删 / 全读完横幅 / 空与浮窗观感）
// W7 · 终审 5 观察（I1 夹具 / 免费态翻句 / 迁移删旧字段 / _pendingArticle 残留 / pass2 选项）
// 服务器归 global-setup.ts 起停（仓库根 8932）；/app/ 在仓库根，所以用 E2E_ROOT_URL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  setPass(n: number): void;
  buildQueue(): void;
  queue: { i: number }[];
  prev(): void;
  next(): void;
  seedArticleForTest(a: number, o: { quizOk?: number; quizNo?: number; reps?: number; pass2?: boolean }): void;
  articlePass2Done(a: number): boolean;
  repsOf(a: number): number;
  state(): { daily: Record<string, { sentDone?: number; repsByArticle?: Record<string, number> }>; sents: Record<number, { lastReadAt: number }> };
  events(): { type: string; s?: number | string; ok?: boolean }[];
  currentQuiz(): { opts: string[]; answer: string } | null;
  answerQuiz(choice: string): boolean;
  nextQuiz(): void;
  quizDone(): number;
};
declare const APP3: { currentBlank(): number; openBlank(bi: number): void; renderBanner(el: HTMLElement): void };
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number> };
declare const SECTIONS: { title: string; paragraphs: string[][] }[];

const rootUrl = process.env.E2E_ROOT_URL || '';

const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
function mkQ(title: string, ai: number, n: number) {
  return {
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => {
      const w = QWORDS[(ai + i) % QWORDS.length];
      return `Sentence ${i} about [[${w}:${w}]].`;
    })],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  };
}
/* 六篇，第 0 篇 8 句、其余各 2 句：第 2 篇的全局窗口 = 0（W4 的死窗口）在这里最明显。 */
const SIXQ: Record<string, string> = (() => {
  const vocab: Record<string, { m: string }> = {};
  QWORDS.forEach((w, i) => { vocab[w] = { m: 'n. ' + QSENSES[i] }; });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mkQ(t, i, i === 0 ? 8 : 2))),
    'vocab.json': JSON.stringify(vocab),
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
async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}
async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.reload();
  await waitAppReady(page);
}
async function enterArticle(page: import('@playwright/test').Page, nth: number) {
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').nth(nth).click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toBeVisible();
}
async function answerCorrectly(page: import('@playwright/test').Page) {
  const idx = await page.evaluate(() => {
    const q = TASK.currentQuiz()!;
    return q.opts.indexOf(q.answer);
  });
  await page.locator('#blankPop .qz-opt').nth(idx).click();
}
async function answerWrongly(page: import('@playwright/test').Page) {
  const idx = await page.evaluate(() => {
    const q = TASK.currentQuiz()!;
    return q.opts.findIndex((o) => o !== q.answer);
  });
  await page.locator('#blankPop .qz-opt').nth(idx).click();
}

/* ============================== W3 · aria-live ============================== */
test.describe('3.0 W3 答题对错的 aria-live 播报（PRD §10.4）', () => {
  test('答对/答错都送进 role=status + aria-live=polite 的播报区', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterArticle(page, 0);
    await page.evaluate(() => TASK.setPass(2));

    const live = page.locator('#quizLive');
    await expect(live, '承载对错反馈的节点必须存在').toHaveCount(1);
    await expect(live).toHaveAttribute('role', 'status');
    await expect(live).toHaveAttribute('aria-live', 'polite');

    // 答对：播报「对了」
    await page.locator('#art .qz-blank').first().click();
    await answerCorrectly(page);
    await expect(live).toContainText('对了');

    // 答错：播报「正确的那一个是 X」，且 X 就是这题的答案
    await page.evaluate(() => TASK.next());
    await expect(page.locator('#blankPop .qz-opt')).toHaveCount(4);
    const answer = await page.evaluate(() => TASK.currentQuiz()!.answer);
    await answerWrongly(page);
    await expect(live).toContainText('正确的那一个是');
    await expect(live).toContainText(answer);
  });
});

/* ==================== W4 · buildQueue 死窗口（M2 风险） ==================== */
test.describe('3.0 W4 buildQueue 不再对非首篇算出 0 句新句窗口', () => {
  test('进第 2 篇后 buildQueue() 产出的队列非空（旧代码恒为 0）', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterArticle(page, 1);                 // 第 2 篇（第 0 篇 8 句、它 2 句）
    const got = await page.evaluate(() => {
      const scopeSize = ShadowPlan.articleScope(SECTIONS, 1).size;
      // 抖一下按篇覆盖面：任务模式的队列现在由 syncQueueFromPlan 决定（真按篇）
      TASK.buildQueue();
      return { scopeSize, q: TASK.queue.map((x) => x.i).length };
    });
    expect(got.scopeSize, '夹具要让第 2 篇有句可排').toBeGreaterThan(0);
    expect(got.q, 'buildQueue 对非首篇不许算出 0 句的新句窗口').toBeGreaterThan(0);
  });
});

/* ============================== W5 · 观感类小项 ============================== */
test.describe('3.0 W5 观感类小项', () => {
  // W5-1：占位屏不再是裸 <h3>+<p>
  // M2（2026-09-24）起「学习数据」已是真页（stats.spec.ts），M3（2026-09-24）起「单词本」也已是真页
  //（words.spec.ts），占位只剩「随身听」（M4 交付）。
  test('W5-1 占位屏有版式：图标 + 居中 + 标题层级（随身听）', async ({ page }) => {
    await stubData(page, SIXQ);
    const screens: Array<[string, string]> = [['listen', '随身听']];
    for (const [hash, title] of screens) {
      await page.goto(`${rootUrl}/app/index.html#/${hash}`);
      const todo = page.locator('#appView .app-todo');
      await expect(todo).toBeVisible();
      await expect(todo.locator('.at-ico')).toBeVisible();
      await expect(todo.locator('h3')).toHaveText(title);
      const align = await todo.evaluate((el) => getComputedStyle(el).textAlign);
      expect(align, '占位屏必须居中，不再是默认左对齐').toBe('center');
    }
  });

  // W5-2：新建计划当天不写「连续 0 天」
  test('W5-2 新建计划当天横幅说「今天开始」，不写「连续 0 天」', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    const sum = page.locator('#homeBanner .hb-sum');
    await expect(sum).toContainText('今天开始');
    await expect(sum).not.toContainText('连续 0 天');
  });

  // W5-3：已学完 / 熟练的卡片不再出「答题」
  test('W5-3 已学完的卡片不再显示「答题」（与胶囊口径一致）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    // 通读满 → data-stage=read（有「答题」）
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    await page.reload();
    await expect(page.locator('.art-card').first()).toHaveAttribute('data-stage', 'read');
    await expect(page.locator('.art-card').first().locator('.a-quiz')).toHaveCount(1);
    // ② 批次也走完 → 已学完，答题入口收掉
    await page.evaluate(() => TASK.seedArticleForTest(0, { quizOk: 1, pass2: true }));
    await page.reload();
    await expect(page.locator('.art-card').first()).toHaveAttribute('data-stage', 'done');
    await expect(page.locator('.art-card').first().locator('.a-quiz'), '已学完卡片不该再有答题入口').toHaveCount(0);
  });

  // W5-4：卡片是容器、内部只放真按钮
  test('W5-4 卡片不再是 role=button；打开正文的是内部真按钮 .a-open（键盘可达）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    const card = page.locator('.art-card').first();
    expect(await card.getAttribute('role'), '卡片本身不该再是 role=button').toBeNull();
    const open = card.locator('button.a-open');
    await expect(open).toHaveCount(1);
    // 真按钮：键盘 Enter 直接进任务模式（旧代码没有这颗按钮）
    await open.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toHaveClass(/task-mode/);
  });

  // W5-5：浮窗翻到任务条上方，不压住「下一题」
  test('W5-5 浮窗不压住任务条（空在下方时旧代码会顶到视口底）', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 380 });
    await stubData(page, SIXQ);
    await enterArticle(page, 0);
    await page.evaluate(() => TASK.setPass(2));
    // 打开靠下的第 2 个空：上游放不下窄条的余量，浮窗只能上翻，旧代码会一路夹到视口底、
    // 越过任务条。用 APP3.openBlank() 程序化打开（避开 Playwright 点击前的自动 scrollIntoView）。
    const opened = await page.evaluate(() => {
      APP3.openBlank(1);
      const pop = document.getElementById('blankPop')!;
      return { visible: !pop.hidden };
    });
    expect(opened.visible, '浮窗必须打开，否则这条测不到东西').toBe(true);
    const m = await page.evaluate(() => {
      const pop = document.getElementById('blankPop')!.getBoundingClientRect();
      const bar = document.getElementById('taskBar')!.getBoundingClientRect();
      return { popBottom: pop.bottom, barTop: bar.top };
    });
    expect(m.popBottom, `浮窗底 ${m.popBottom} 不许越过任务条顶 ${m.barTop}`)
      .toBeLessThanOrEqual(m.barTop + 0.5);
  });

  // W5-6：「回看句子」动作已从 ② 删除（不再有 playFrom 那个副作用）
  test('W5-6 ② 态没有「回看句子」：TASK.prev() 不再播放/滚动当前题', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterArticle(page, 0);
    await page.evaluate(() => TASK.setPass(2));
    // 停在第 3 个空上（≥1），记下正文高亮句 —— 旧代码 prev() 会 reviewSentence() 把高亮挪到这一句
    await page.evaluate(() => APP3.openBlank(2));
    const before = await page.evaluate(() => {
      const p = document.querySelector('#art .sent.playing');
      return p ? (p as HTMLElement).dataset.gi || p.textContent : null;
    });
    await page.evaluate(() => TASK.prev());
    const after = await page.evaluate(() => {
      const p = document.querySelector('#art .sent.playing');
      return p ? (p as HTMLElement).dataset.gi || p.textContent : null;
    });
    expect(after, '② 的「上一句/回看」必须是空操作，不许把高亮/播放拽走').toBe(before);
    // 页面上也不该再有「回看句子」这颗按钮
    expect(await page.locator('body', { hasText: '回看句子' }).count(), '「回看句子」不存在').toBe(0);
  });

  // W5-7：六篇都读完 → 明确文案，不再返回第 1 篇说「还剩 1 句」
  test('W5-7 六篇全读完横幅说「读完了」，不再假装第 1 篇还剩 1 句', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      for (let a = 0; a < SECTIONS.length; a++) {
        Array.from(ShadowPlan.articleScope(SECTIONS, a)).forEach((i) => TASK.readDone(i));
      }
      // 让「今天做完了」那条分支不抢先：把今日 sentDone 归零，逼横幅走 nextArticle 分支
      const st = TASK.state();
      Object.keys(st.daily).forEach((k) => { st.daily[k].sentDone = 0; });
      APP3.renderBanner(document.getElementById('homeBanner')!);
    });
    const main = page.locator('#homeBanner .hb-main');
    await expect(main).toContainText('六篇都读完了');
    await expect(main, '不许再说「继续学《第 1 篇》· 还剩 1 句」').not.toContainText('继续学');
    await expect(page.locator('#homeBanner .b-go')).toContainText('看词本');
  });

  // W5-8：浮窗有朝向那个空的小箭头
  test('W5-8 浮窗带指向空的小箭头（::after）', async ({ page }) => {
    await stubData(page, SIXQ);
    await enterArticle(page, 0);
    await page.evaluate(() => TASK.setPass(2));
    await page.locator('#art .qz-blank').first().click();
    await expect(page.locator('#blankPop')).toBeVisible();
    const arrow = await page.locator('#blankPop').evaluate((el) => {
      const s = getComputedStyle(el, '::after');
      return { content: s.content, topColor: s.borderTopColor, bottomColor: s.borderBottomColor };
    });
    expect(arrow.content, '浮窗必须有 ::after 箭头').not.toBe('none');
    const transparent = ['rgba(0, 0, 0, 0)', 'transparent'];
    expect(transparent.includes(arrow.topColor) && transparent.includes(arrow.bottomColor),
      '箭头至少要有一向是可见的实色').toBe(false);
  });
});

/* ============================== W7 · 终审 5 观察 ============================== */
test.describe('3.0 W7 终审 5 条观察', () => {
  // W7-1 / W7-5：② 批次严格小于全篇也够「已学完」；并用到 seedArticleForTest 的 pass2 选项
  test('W7-1 部分 ②（批次 < 全篇）也判「已学完」：旧判据 quizOk>=全篇句数 在这里必红', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      Array.from(ShadowPlan.articleScope(SECTIONS, 0)).forEach((i) => TASK.readDone(i));
    });
    // ② 批次严格小于全篇：第 0 篇 8 句，只让它有 3 条 quiz 事件（且都答对）+ 一批次凭据
    await page.evaluate(() => TASK.seedArticleForTest(0, { quizOk: 3, pass2: true }));
    const info = await page.evaluate(() => {
      const scope = ShadowPlan.articleScope(SECTIONS, 0);
      const ok = TASK.events().filter((e) => e.type === 'quiz' && e.ok && scope.has(e.s as number)).length;
      return { total: scope.size, ok };
    });
    expect(info.total, '夹具要有多句，否则「批次 < 全篇」无从谈起').toBeGreaterThan(1);
    expect(info.ok, '夹具必须让 ② 批次严格小于全篇（旧判据会在这里红）').toBeLessThan(info.total);
    expect(await page.evaluate(() => TASK.articlePass2Done(0)), '批次凭据按篇记下').toBe(true);
    await page.reload();
    await expect(page.locator('.art-card').first()).toHaveAttribute('data-stage', 'done');
  });

  // W7-2：免费态（无计划）也能自由翻句
  test('W7-2 免费态任务条露出上一句/下一句，点了真的挪高亮', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    await expect(page.locator('#homeBanner .b-go')).toContainText('设置');
    await page.locator('.art-card').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');

    const fwd = page.locator('#taskBar .tb-play .ab-step-fwd');
    await expect(fwd, '免费态必须有「下一句」').toBeVisible();
    const before = await page.locator('#art .sent.playing').first().textContent();
    await fwd.click();
    await expect(page.locator('#art .sent.playing').first()).not.toHaveText(before || '');
  });

  // W7-3：迁移时把旧 daily.repsByArticle 从共享 blob 删掉
  test('W7-3 迁移顺手清掉 v2 blob 里的 daily.repsByArticle（只删这一个字段）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await freshPlan(page);
    await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
      raw.state.daily = raw.state.daily || {};
      raw.state.daily['2026-01-01'] = { sentDone: 1, repsByArticle: { 0: 3 } };
      raw.state.eventsSeen = raw.events.length;   // 别让 reload 走 recompute2：要验的是显式删除
      localStorage.setItem('ielts.shadow.v2', JSON.stringify(raw));
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    await waitAppReady(page);
    const got = await page.evaluate(() => {
      const raw = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
      return {
        still: !!(raw.state.daily['2026-01-01'] && raw.state.daily['2026-01-01'].repsByArticle),
        reps: TASK.repsOf(0),
      };
    });
    expect(got.still, 'v2 blob 里不许再留着 daily.repsByArticle').toBe(false);
    expect(got.reps, '按篇账要真搬进 3.0 自己的 key').toBe(3);
  });

  // W7-4：_pendingArticle 不残留 —— 走非 ps-start 的建计划路径也不能跳到旧文章
  test('W7-4 设置屏里直接用别的路径建计划，也不会跳回之前那篇', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    // 进第 2 篇免费态 →「去设置」把 _pendingArticle 设成第 2 篇
    await page.locator('.art-card').nth(1).click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await page.locator('#tbNext').click();
    await expect(page.locator('#setupSheet .ps-start')).toBeVisible();
    // 模拟「非 ps-start 的路径」建计划（导入 / 重置等都会直接调 initPlan）
    await page.evaluate(() => TASK.initPlan(15));
    // 再点 ps-start：残留若未清，会 openArticle(第 2 篇) → 进任务模式
    await page.locator('#setupSheet .ps-start').click();
    await expect(page.locator('body')).not.toHaveClass(/task-mode/);
    await expect(page.locator('.art-card')).toHaveCount(6);
  });
});
