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
  queue: { i: number }[];
  hasPlan: boolean;
};
declare const APP3: { currentBlank(): number };
declare const ShadowPlan: {
  articleScope(sections: unknown, article: number): Set<number>;
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
});
