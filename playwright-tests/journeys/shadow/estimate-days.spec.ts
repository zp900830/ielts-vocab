// Hand-written alongside tests/e2e/shadow/estimate-days.md
// 锁的是同一件事的四个面：「照现在这个每天分钟数，这一期词还要多久过完」在
// 设置屏 / 计划页 / 今天面板 / 任务进行中 都出现，且四处读的是同一个 estimateDays 的同一个返回值。
//
// 为什么值得单独一条（他 2026-09-21）：「这一期单词毕业需要多久需要在设置计划时和任务正在进行时
// 都要展示。这一点到现在都没优化。」—— 真相是 estimateDays 写完了、单测过了，但产品 UI 一处都没接，
// 全仓库唯一的调用方是 work/sched_probe.mjs 那个一次性探针。所以这条首先锁"接上了"，其次才锁"同源"。
//
// 措辞口径（他 2026-09-21 拍的 (a) 条）：保温还没做，引擎里毕业词永不回访，所以不许许诺"全部学完就完事"，
// 那行说「新词全部过完一遍」。断言一律读 data-* 属性，不解析中文句子 —— 文案还要跟他再对一轮。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

interface EtaRes {
  days: number | null; done: boolean; doneAt: number | null; capped: boolean; empty: boolean;
  graduatedNow: number; total: number;
  atHorizon: { days: number; graduated: number; at: number } | null;
}

declare const TASK: {
  resetV2(): void; initPlan(n: number): void;
  openPanel(): void; setView(v: string): void;
  setMinutes(m: number): void; setBoundary(h: number): void; setPauseNew(v: boolean): void;
  enterTaskMode(): void; exitTaskMode(): void; next(): void;
  countStages(): { graduated: number; owned: number; recognized: number; leech: number };
  etaFor(m: number): Promise<EtaRes>;
  etaCalls: { n: number };
  seedDailyForTest(back: number): void;
};

const ENV = process.env.E2E_ENVIRONMENT || 'local';
const PLAN_KEY = 'ielts-task-plan';

async function openPanelTo(page: import('@playwright/test').Page, view: 'setup' | 'today' | 'plan' | 'book') {
  await page.evaluate(() => TASK.openPanel());
  await expect(page.locator('#todayPanel')).toBeVisible();
  if (view !== 'setup') {
    await page.locator(`.tp-tab[data-view="${view}"]`).click();
  }
  if (view === 'setup') await expect(page.locator('.plan-setup')).toBeVisible();
}

// 「算一下…」是异步回填的占位，跑一次全量模拟 ~0.3-0.9s；等它变成成品句而不是抢时序
async function settled(loc: import('@playwright/test').Locator) {
  await expect(loc).not.toContainText('算一下', { timeout: 20000 });
  return ((await loc.textContent()) || '').trim();
}

const daysOf = (loc: import('@playwright/test').Locator) => loc.getAttribute('data-days');

test.describe('走完全部词要多久 · 四处同源', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    // gotcha 11：beforeEach 里的 setTimeout 会盖掉 --timeout，所以这里显式给预算
    testInfo.setTimeout(currentTimeout() * 8);
    testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/estimate-days.md' });
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
  });

  test('设置屏：进来就有数，分钟越大天数只许变小，缓存不许重算', async ({ page }) => {
    await openPanelTo(page, 'setup');
    const eta = page.locator('#psEta');
    await expect(eta).toBeVisible();
    const first = await settled(eta);
    // 空状态也算得出来 —— 第一天就该有数，不许停在占位或空串
    expect(first.length).toBeGreaterThan(0);
    expect(first).toContain('到 ');
    const d15 = Number(await daysOf(eta));
    expect(d15).toBeGreaterThan(0);
    // 假设交代那一行小字（规格 §4.1 / §9.2：一行，不做展开面板）
    await expect(page.locator('#psEtaAssume')).toContainText('25 秒');
    await expect(page.locator('#psEtaAssume')).toContainText('8 成');

    const callsBefore = await page.evaluate(() => TASK.etaCalls.n);
    await page.locator('#psMin .ps-opt[data-v="60"]').click();
    await settled(eta);
    const d60 = Number(await daysOf(eta));
    expect(d60).toBeLessThanOrEqual(d15);            // 单调性（规格 §7.1）

    // 同一档再点一次：命中缓存，不许再跑一遍 887 个模拟日
    await page.locator('#psMin .ps-opt[data-v="15"]').click();
    await settled(eta);
    await page.locator('#psMin .ps-opt[data-v="60"]').click();
    await settled(eta);
    const callsAfter = await page.evaluate(() => TASK.etaCalls.n);
    // 开屏已经把 15 算进缓存了，所以这里只许多算 60 这一档；再点回 15 命中缓存
    expect(callsAfter - callsBefore).toBe(1);
    expect(Number(await daysOf(eta))).toBe(d60);
  });

  test('计划页：与设置屏同一个分钟数 → 同一个天数；改日界和暂停新词都要重算', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
    await openPanelTo(page, 'plan');
    const eta = page.locator('#planEta');
    const at15 = await settled(eta);
    expect(at15).toContain('新词全部过完一遍');
    const d15 = Number(await daysOf(eta));
    // 与引擎直调同源：界面那个数必须就是 estimateDays 的返回值，不是第二套算式
    const eng = await page.evaluate(() => TASK.etaFor(15).then((r) => r.days));
    expect(d15).toBe(eng);

    await page.locator('[onclick="TASK.setMinutes(60)"]').click();
    await settled(eta);
    expect(Number(await daysOf(eta))).toBeLessThanOrEqual(d15);

    await page.locator('[onclick="TASK.setBoundary(6)"]').click();
    expect(await settled(eta)).toContain('新词全部过完一遍');

    // 规格 §5：模拟必须走同一个「只复习不见新词」开关，否则给出的天数偏乐观
    const beforePause = (await daysOf(eta)) || '';
    await page.locator('[onclick="TASK.setPauseNew(true)"]').click();
    await settled(eta);
    expect((await daysOf(eta)) || '').not.toBe(beforePause);
  });

  test('今天面板注脚：已毕业 / 分母 / 完工日同源，且只说一次完工', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(30); });
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
    await openPanelTo(page, 'today');
    const eta = page.locator('#todayEta');
    const txt = await settled(eta);
    const g = await page.evaluate(() => TASK.countStages().graduated);
    const denom = await page.evaluate(() => {              // 页面里真标出来的词头数，不是界面自说自话
      const k = new Set<string>();
      document.querySelectorAll('.sent .w').forEach((w) => {
        const v = ((w as HTMLElement).dataset.w || '').trim().toLowerCase();
        if (v) k.add(v);
      });
      return k.size;
    });
    expect(denom).toBeGreaterThan(1000);
    expect(txt).toContain(`已毕业 ${g} / ${denom}`);
    // 他明确看不懂第二个派生数：这行只许有一个完工说法
    expect((txt.match(/全部过完/g) || []).length).toBe(1);
    // 全新存档只做过今天 → 出勤补句整句不出现（不显示 ≠ 显示 0）
    expect(txt).not.toContain('最近两周');

    // 两周前的老存档、但只做了 3 天 —— 这才该出补句
    await page.evaluate(() => { [15, 5, 2].forEach((b) => TASK.seedDailyForTest(b)); });
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
    await openPanelTo(page, 'today');
    const t2 = await settled(page.locator('#todayEta'));
    // 补句是「数出来的事实」，不是百分比、不是第二个天数
    expect(t2).toMatch(/最近两周你实际只做了 \d+ 天/);
  });

  test('任务进行中：通栏上有那行短形态，且连点下一句不许重算', async ({ page, baseURL }) => {
    test.setTimeout(currentTimeout() * 12);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(30); });
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
    await page.evaluate(() => TASK.enterTaskMode());
    await expect(page.locator('#taskBar')).toBeVisible();
    const eta = page.locator('#tbEta');
    const txt = await settled(eta);
    const before = await page.evaluate(() => TASK.etaCalls.n);   // 之前那次可能是开面板留下的，从进任务模式之后数
    expect(txt).toContain('全部过完约');
    // 那行已经有「今日进度 n/N」和「这批还剩」，第三个数只留最短形态
    expect(txt).not.toContain('需要');
    expect(txt).not.toContain('天）');
    const dBar = await daysOf(eta);
    expect(Number(dBar)).toBeGreaterThan(0);

    for (let i = 0; i < 5; i++) await page.evaluate(() => TASK.next());
    // 0.3-0.9 秒的全量模拟绝不许挂在按键上
    expect(await page.evaluate(() => TASK.etaCalls.n)).toBe(before);   // 连点下一句一次都不许多算
    await expect(page.locator('#tbTitle')).toBeVisible();
    await expect(page.locator('#tbSub')).toBeVisible();
  });

  test('内部词与假精确：界面里不许出现轮 / 势头 / 1095+', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(30); });
    await page.reload();
    await expect(page.locator('.sent').first()).toBeVisible();
    for (const view of ['today', 'plan', 'book'] as const) {
      await openPanelTo(page, view);
      await page.waitForTimeout(200);
      const body = (await page.locator('#todayPanel').innerText()) || '';
      for (const banned of ['轮', '势头', '外推', '模型', '供给', 'worklist', '口径', '切片', '数据边界', '1095+']) {
        expect(body, `计划面板(${view}) 出现了「${banned}」`).not.toContain(banned);
      }
    }
  });
});
