// 2026-09-25：把任务模式里两条「回到某处」的心智负担合并成**唯一**一条「回到学习位置」。
//
// 现状（开工前摸清）：主站任务模式里其实只有一颗浮动的「回到播放位置」(#backToPlay / .back-to-play /
// scrollToPlaying)，且只在「播放中 + 手动滚走」时才出现。用户口里的「回到学习的位置」
// 并不是另一颗既有控件，而是「回到学习句」这项**能力**。本轮把它落成一颗键，
// 旧的「回到播放位置」整颗删掉（控件 + 逻辑 + CSS + 死函数）。
//
// 本锁钉三件事（2026-10-10 ② 删除后：原第 3 条「② 滚走」随 ② 退役）：
//   1. 旧控件真的不存在（负向锁），新控件在。
//   2. ① 手动点偏 → 点它 → 高亮/播放回到学习句，且「下一句」的起点回到学习那条线。
//   3. 没有学习位置（无计划 / 收工）时它不出现（不摆点了没反应的键）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  queue: { i: number }[];
  backToLearn(): void;
  state(): { daily: Record<string, unknown> };
};
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 40 句一篇：① 要够多句才有「点偏别句」可言；② 要够高才滚得出去。
   四个名词轮着出现（同词性 + 义项互不重叠），② 的四选一才凑得齐候选（同 task.spec 的闸门口径）。 */
const QWORDS = ['apple', 'banana', 'cherry', 'date'];
const QSENSES = ['苹果', '香蕉', '樱桃', '枣'];
const MANY: Record<string, string> = (() => {
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
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 40 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

/* 等 loadData 落地（SECTIONS 非空）+ TASK.init 跑过（state().daily 在）——同 task.spec.ts 的闸门，
   否则紧接着的 resetV2/initPlan 会落在还没初始化的页面上静默空转。 */
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
}

const playingIdx = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Array.from(document.querySelectorAll('#art .sent'))
    .findIndex((el) => el.classList.contains('playing')));
const isPlaying = (page: import('@playwright/test').Page) =>
  page.locator('#btnPlay').evaluate((el) => /暂停/.test(el.textContent || ''));

async function enterTask(page: import('@playwright/test').Page) {
  await stubData(page, MANY);
  await page.goto(`${rootUrl}/index.html#/home`);
  await freshPlan(page);
  await page.locator('.art-card .a-open[data-a="0"]').click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
}

test.describe('3.0 「回到学习位置」唯一键（合并「回到播放位置」）', () => {
  test('旧控件全清、新控件在：不存在 #backToPlay / .back-to-play /「回到播放位置」', async ({ page }) => {
    await enterTask(page);
    expect(await page.locator('#backToPlay').count(), '旧按钮 #backToPlay 必须已删').toBe(0);
    expect(await page.locator('.back-to-play').count(), '旧样式 .back-to-play 必须已删').toBe(0);
    expect(await page.getByText('回到播放位置').count(), '「回到播放位置」字样必须已删').toBe(0);

    const btn = page.locator('#backToLearn');
    await expect(btn).toHaveCount(1);
    await expect(btn).toHaveText(/回到学习位置/);
    await expect(btn).toHaveAttribute('aria-label', '回到学习位置');
  });

  test('① 手动点偏 → 点它 → 高亮/播放回到学习句，且「下一句」回到学习那条线', async ({ page }) => {
    await enterTask(page);
    const learnLocal = await page.evaluate(() => TASK.queue[0].i);   // 第 0 篇 global==local
    const deviate = learnLocal + 3;
    const btn = page.locator('#backToLearn');

    // 刚进来就停在学习句上：按需出现的键此刻不该在屏上（不摆点了没反应的键）
    await expect(btn).toBeHidden();

    // 手动点偏别句：高亮挪走，键出现
    await page.locator('#art .sent').nth(deviate).click();
    await expect.poll(() => playingIdx(page), '手动点句后高亮应到点偏的那句').toBe(deviate);
    await expect(btn).toBeVisible();

    // 点「回到学习位置」：高亮回到学习句 + 开播
    await btn.click();
    await expect.poll(() => playingIdx(page), '高亮应回到学习句').toBe(learnLocal);
    await expect.poll(() => isPlaying(page), '回到学习位置要同步开播').toBe(true);

    // 「下一句」的起点也回到学习那条线上：从学习句往后（learnLocal+1），不是从点偏处（deviate+1）
    await page.locator('#tbNext').click();
    await expect.poll(() => playingIdx(page), '下一句应从学习句往后走').toBe(learnLocal + 1);
  });

  test('没有学习位置时不出现：无计划态隐藏', async ({ page }) => {
    await stubData(page, MANY);
    await page.goto(`${rootUrl}/index.html#/home`);
    await page.evaluate(() => {
      localStorage.removeItem('ielts.shadow.v2');
      localStorage.removeItem('ielts.app3.article');
    });
    await page.reload();
    await page.locator('.art-card .a-open[data-a="0"]').click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'noplan');
    await expect(page.locator('#backToLearn'), '无计划态没有学习队列，键必须隐藏').toBeHidden();
  });

  test('没有学习位置时不出现：收工态隐藏', async ({ page }) => {
    await enterTask(page);
    // ② 删除后的收工路径：把今天队列读完 → 推进键第一下放句、第二下发现队列读空 → finishTask
    await page.evaluate(() => { TASK.queue.forEach((q: { i: number }) => TASK.readDone(q.i)); });
    await page.locator('#tbNext').click();
    await page.locator('#tbNext').click();
    await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'done');
    await expect(page.locator('#backToLearn'), '收工态没有学习位置，键必须隐藏').toBeHidden();
  });
});
