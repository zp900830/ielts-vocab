// 3.0 M1 遗留清单第二半（W4 / W5 / W7）。
// W4 · buildQueue 里的死按篇闸（M2 风险）
// W5 · 观感类小项（占位屏 / 连续 0 天 / 卡片结构 / 全读完横幅）
// W7 · 终审 5 观察（免费态翻句 / 迁移删旧字段 / _pendingArticle 残留 / 续读条反锁）
// 2026-10-10 ② 挖空选词删除：W3（② 播报）、W5-3/5/6/8（② 观感）、W7-1（② 凭据）随 ② 一并退役。
// 服务器归 global-setup.ts 起停（仓库根 8932）；站点在仓库根，所以用 E2E_ROOT_URL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  buildQueue(): void;
  queue: { i: number }[];
  repsOf(a: number): number;
  state(): { daily: Record<string, { sentDone?: number; repsByArticle?: Record<string, number> }>; sents: Record<number, { lastReadAt: number }> };
};
declare const APP3: { renderBanner(el: HTMLElement): void };
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
    await page.route(`**/data/${name}*`, (r) =>
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
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card').nth(nth).click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toBeVisible();
}
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
  // M2（2026-09-24）学习数据、M3 单词本、M4 随身听先后落地 —— 四个一级页全是真页，占位屏清零。
  test('W5-1 M4 起无占位屏：四个一级页都是真页（无 .app-todo）', async ({ page }) => {
    await stubData(page, SIXQ);
    for (const hash of ['home', 'stats', 'words', 'listen']) {
      await page.goto(`${rootUrl}/index.html#/${hash}`);
      await page.waitForFunction(() => typeof (window as unknown as { APP3?: unknown }).APP3 !== 'undefined');
      await expect(page.locator('#appView .app-todo')).toHaveCount(0);
    }
    await page.goto(`${rootUrl}/index.html#/listen`);
    await expect(page.locator('#appView .listen-page')).toBeVisible();
  });

  // W5-2：新建计划当天不写「连续 0 天」
  test('W5-2 新建计划当天横幅说「今天开始」，不写「连续 0 天」', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/index.html#/home`);
    await freshPlan(page);
    const sum = page.locator('#homeBanner .hb-sum');
    await expect(sum).toContainText('今天开始');
    await expect(sum).not.toContainText('连续 0 天');
  });

  // W5-4：卡片是容器、内部只放真按钮
  test('W5-4 卡片不再是 role=button；打开正文的是内部真按钮 .a-open（键盘可达）', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/index.html#/home`);
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

  // W5-7：六篇都读完 → 明确文案，不再返回第 1 篇说「还剩 1 句」
  test('W5-7 六篇全读完横幅说「读完了」，不再假装第 1 篇还剩 1 句', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/index.html#/home`);
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
});

/* ============================== W7 · 终审 5 观察 ============================== */
test.describe('3.0 W7 终审 5 条观察', () => {
  // W7-2：免费态（无计划）也能自由翻句
  test('W7-2 免费态任务条露出上一句/下一句，点了真的挪高亮', async ({ page }) => {
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/index.html#/home`);
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
    await page.goto(`${rootUrl}/index.html#/home`);
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
    await page.goto(`${rootUrl}/index.html#/home`);
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

  /* refine3 ⑤（2026-09-25 用户「底部的提示条去除吧」）：M6 · N1 那条一级页面底部续读条整块删除，
     续学入口统一到首页顶部「继续学」横幅。反向验证：旧代码会挂 #taskBar[data-state=resume] 且
     body.resume-offer，本用例必红。 */
  test('refine3 ⑤：一级页面不再有底部续读条；入口在首页「继续学」横幅', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubData(page, SIXQ);
    await page.goto(`${rootUrl}/index.html#/words`);
    await waitAppReady(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await waitAppReady(page);

    // 一级页面：任务条不露脸，也不再有 resume 态 / body.resume-offer
    await expect(page.locator('#taskBar')).not.toHaveClass(/show/);
    expect(await page.locator('#taskBar').getAttribute('data-state')).not.toBe('resume');
    expect(await page.locator('body').getAttribute('class') || '').not.toContain('resume-offer');
    // 相关 API 一并清掉（死代码清理的反向锁）
    const staleApi = await page.evaluate(() => ['offerResume', 'skipResume', 'hideResumeOffer', 'resumeTask']
      .filter((k) => typeof (TASK as unknown as Record<string, unknown>)[k] === 'function'));
    expect(staleApi, '续读条相关 API 已删除').toEqual([]);
    // 「今天先不做」那把按天锁也不再被写
    expect(await page.evaluate(() => localStorage.getItem('ielts.shadow.resumeDay'))).toBeNull();

    // 入口统一到首页「继续学」：横幅主行说「今天还剩 N 句」，点击直接进任务模式
    await page.goto(`${rootUrl}/index.html#/home`);
    await expect(page.locator('#homeBanner .hb-main')).toContainText('继续学');
    await expect(page.locator('#homeBanner .hb-main')).toContainText('今天还剩');
    await expect(page.locator('#homeBanner .hb-sum')).toContainText('今天覆盖');
    await page.locator('#homeBanner .b-go').click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    await expect(page.locator('#taskBar')).toHaveClass(/show/);
  });
});
