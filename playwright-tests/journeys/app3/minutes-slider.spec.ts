// 「每天有多少分钟」= 滑块（2026-10-08 用户：「这里改成滑块设置，最小 5，最大 240。以 5 为单位滑动」，
// 追问后拍板：三处宿主一起换、刻度只画不可点）。服务器归 global-setup.ts 起停（仓库根 8932），
// /app/ 在仓库根，用 E2E_ROOT_URL，和 home/me5/overlay-stack 同一套。
// 这里锁的是**契约**，不是长相：
//   ① 设置屏 / 今日面板计划页 / 「我的」浮窗共用同一份档位（一处定义，三处复用，不许长回三套）；
//   ② 上限真的到 240 —— 旧代码有三处把分钟夹在 1..180，光换 UI 不改夹取，拖到底会被打回 180；
//   ③ 拖动过程中只改读数，松手才落账（每跨 5 分钟就重排今天的队列，既卡又会把节点换掉）；
//   ④ 键盘方向键与拖动走同一条路，且按完焦点还在滑块上（否则第二下没反应）。
import { test, expect } from '../../fixtures';
import { stubCloudAccount } from '../../utils/cloud-stub';
import { slideMin, setMin, readMinSlider } from '../../utils/min-slider';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  openPanel(): void;
  closePanel(): void;
  setView(v: string): void;
  planConfig(): { minutes: number } | null;
  etaCalls: { n: number };
  cloudSync(): Promise<unknown>;
  hasPlan: boolean;
};
declare const CLOUD: { client(): unknown };
declare const ShadowPlan: { dayKey(ts: number, h: number): string };

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇小壳（篇 0 = 6 句，其余各 1 句）：够建计划，又不拖慢并行。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 12; i++) vocab[`w${i}`] = { m: `w${i}` };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 6 : 1))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/app/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });

const minutes = (page: import('@playwright/test').Page) =>
  page.evaluate(() => { const c = TASK.planConfig(); return c && c.minutes; });

/** 开到今日面板的「计划」页签（有计划的宿主）。 */
async function openPlanTab(page: import('@playwright/test').Page, startAt = 15) {
  await page.evaluate((m) => { TASK.resetV2(); TASK.initPlan(m); }, startAt);
  await page.evaluate(() => { TASK.openPanel(); TASK.setView('plan'); });
  return page.locator('#todayPanel .min-range');
}

/* 服务端躺着一条 dayplan（换设备首登的形态）：本机没计划时 cloudSync 会照它重建计划，
   重建那一步也有一处分钟数夹取（旧代码夹在 1..180），所以档位改动必须连它一起测。 */
async function installCloudDayplan(page: import('@playwright/test').Page, minutesValue: number) {
  await page.evaluate((mins) => {
    const rows = [{
      event_id: 'dp-slider', ts: Date.now(), type: 'dayplan',
      payload: { type: 'dayplan', day: ShadowPlan.dayKey(Date.now(), 4), minutes: mins, ts: Date.now(), id: 'dp-slider' },
    }];
    (CLOUD as unknown as { client: () => unknown }).client = () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'slider-user' } } } }) },
      from: () => ({
        select: () => {
          const chain: {
            _f: [string, unknown][];
            eq(c: string, v: unknown): unknown;
            order(): unknown;
            range(): Promise<{ data: unknown; error: null }>;
            maybeSingle(): Promise<{ data: null; error: null }>;
          } = {
            _f: [],
            eq(col: string, val: unknown) { this._f.push([col, val]); return this; },
            order() { return this; },
            async range() {
              if (this._f.some(([c, v]) => c === 'type' && v === 'article-account')) return { data: [], error: null };
              return { data: rows, error: null };
            },
            async maybeSingle() { return { data: null, error: null }; },
          };
          return chain;
        },
        upsert: async () => ({ error: null }),
      }),
    });
  }, minutesValue);
}

/** 干净机：本机没有计划。 */
async function gotoNoPlan(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await waitTask(page);
  await page.evaluate(() => { TASK.resetV2(); localStorage.removeItem('ielts.shadow.v2'); });
  await page.reload();
  await waitTask(page);
}

test.describe('「每天有多少分钟」滑块 · 5..240 步长 5', () => {
  test('三处宿主档位一模一样，旧的分钟胶囊彻底没了', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { localStorage.removeItem('ielts.shadow.v2'); });
    await page.reload();
    await waitTask(page);

    // ① 设置屏：没计划时首页横幅「去设置」渲的就是 renderSetup
    await page.locator('#homeBanner .b-go').click();
    const setupRange = page.locator('#setupSheet .min-range');
    await expect(setupRange, '设置屏要有滑块').toHaveCount(1);
    const shots: Record<string, { min: string; max: string; step: string; value: string }> = {
      setup: await readMinSlider(setupRange),
    };

    // ② 今日面板 · 计划页签
    await page.evaluate(() => { TASK.closePanel(); TASK.initPlan(15); });
    await page.evaluate(() => { TASK.openPanel(); TASK.setView('plan'); });
    const planRange = page.locator('#todayPanel .min-range');
    await expect(planRange, '计划页签要有滑块').toHaveCount(1);
    shots.plan = await readMinSlider(planRange);

    // ③ 「我的」浮窗
    await page.evaluate(() => TASK.closePanel());
    await stubCloudAccount(page);
    await page.locator('#meCard').click();
    const meRange = page.locator('#mePop .min-range');
    await expect(meRange, '浮窗要有滑块').toHaveCount(1);
    shots.mePop = await readMinSlider(meRange);

    for (const [host, s] of Object.entries(shots)) {
      expect(s, `${host} 的档位必须是 5..240 步长 5，且落在当前分钟数 15`).toEqual({ min: '5', max: '240', step: '5', value: '15' });
    }
    // 旧的分钟胶囊（浮窗 data-me-min / 面板 data-v）彻底消失，不留第二套
    await expect(page.locator('#mePop [data-me-min]'), '浮窗不再有分钟胶囊').toHaveCount(0);
    await expect(page.locator('#todayPanel .ps-opt[data-v]'), '面板不再有分钟胶囊').toHaveCount(0);
    // 「数据」行那两颗仍然复用 .ps-opt（导出/导入），不许顺手删掉样式
    await expect(page.locator('#mePop [data-me-export].ps-opt'), '导出仍是那颗胶囊').toHaveCount(1);
  });

  test('拖到 240 落得住（不再被 180 夹回），刷新回来还是 240', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const range = await openPlanTab(page);

    await setMin(range, 240);
    expect(await minutes(page), '240 必须真落账').toBe(240);
    await expect(page.locator('#todayPanel .min-val')).toHaveText('240 分钟');
    await expect(range, '读屏也要念得出').toHaveAttribute('aria-valuetext', '240 分钟');

    await page.reload();
    await waitTask(page);
    expect(await minutes(page), '240 要能存住').toBe(240);
  });

  test('5 是下限：拨到 5 以下夹回 5，initPlan 也照同一份档位', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const range = await openPlanTab(page);

    await setMin(range, 0);
    expect(await minutes(page), '低于下限夹到 5').toBe(5);
    expect((await readMinSlider(range)).value, '滑块自己停在 5').toBe('5');
    await expect(page.locator('#todayPanel .min-val')).toHaveText('5 分钟');

    const viaInit = await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(300); return TASK.planConfig()!.minutes; });
    expect(viaInit, '建计划那条夹取也必须读同一份档位').toBe(240);
  });

  test('拖动只改读数与工期预览，松手才改计划', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const range = await openPlanTab(page);
    /* 工期文案按小数据算出来就是「到 X 年 X 月…」，里面没有分钟数，所以这一条不文字比对，
       数 estimateDays 的调用次数：拖的过程中就得为 45 这一档算一次（estimateDays 在 setTimeout
       里跑，故 poll 而不是同步取）。 */
    const etaCalls = () => page.evaluate(() => TASK.etaCalls.n);
    const before = await etaCalls();

    await slideMin(range, 45);                       // 手还没松
    await expect(page.locator('#todayPanel .min-val'), '读数跟着手指走').toHaveText('45 分钟');
    expect(await minutes(page), '松手前不落账').toBe(15);
    await expect.poll(etaCalls, '工期行在拖的过程中就预览').toBeGreaterThan(before);

    await range.evaluate((el) => el.dispatchEvent(new Event('change', { bubbles: true })));
    expect(await minutes(page), '松手才落账').toBe(45);
  });

  test('键盘 → 与拖动同一条路，且按完焦点还在滑块上（第二下要按得动）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const range = await openPlanTab(page);

    await range.focus();
    await page.keyboard.press('ArrowRight');
    expect(await minutes(page), '一下 +5').toBe(20);
    await page.keyboard.press('ArrowRight');
    expect(await minutes(page), '第二下还在同一条路上').toBe(25);
    const active = await page.evaluate(() => (document.activeElement as HTMLElement).className);
    expect(active, '落账不许把滑块节点换掉').toContain('min-range');
  });

  test('刻度只画不点：不是按钮、点它不改值', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const range = await openPlanTab(page, 60);
    const ticks = page.locator('#todayPanel .min-tick');
    expect(await ticks.count(), '刻度要真画出来').toBeGreaterThan(3);

    const forms = await ticks.evaluateAll((els) => els.map((e) => ({
      tag: e.tagName, role: e.getAttribute('role'), inButton: !!e.closest('button'), onclick: e.hasAttribute('onclick'),
    })));
    for (const f of forms) {
      expect(f, '刻度是只读标注：不是按钮、不带 role/onclick').toMatchObject({ tag: 'SPAN', role: null, inButton: false, onclick: false });
    }
    await ticks.first().click();
    expect((await readMinSlider(range)).value, '点刻度不跳档').toBe('60');
  });

  test('手机端 390：「我的」页面里的滑块整行不溢出，触摸高度 ≥44', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await stubCloudAccount(page);
    await page.locator('#meCard').click();
    // 2026-10-08：手机端「我的」是一级页面，滑块住在 #appView .me-page 里，不再是 #mePop
    const host = page.locator('#appView .me-page');
    await expect(host, '手机点底栏那一格进的是页面').toBeVisible();
    const range = host.locator('.min-range');
    await expect(range).toBeVisible();
    const geo = await page.evaluate(() => {
      const r = document.querySelector('#appView .me-page .min-range')!.getBoundingClientRect();
      const p = document.querySelector('#appView .me-page')!.getBoundingClientRect();
      return { left: r.left, right: r.right, h: r.height, pageRight: p.right, vw: innerWidth };
    });
    expect(geo.h, '滑块触摸高度 ≥44（§10.4）').toBeGreaterThanOrEqual(44);
    expect(geo.right, '不溢出右缘').toBeLessThanOrEqual(geo.vw);
    expect(geo.left, '不溢出左缘').toBeGreaterThanOrEqual(0);
    expect(geo.pageRight, '宿主本身也不溢出').toBeLessThanOrEqual(geo.vw);
    // 拖得动：390 上拨到 120 要落账
    await setMin(range, 120);
    expect(await minutes(page)).toBe(120);
  });

  test('换设备重建：dayplan 里躺着 300 → 夹进 240', async ({ page }) => {
    await gotoNoPlan(page);
    expect(await page.evaluate(() => TASK.hasPlan), '干净机没有计划').toBe(false);
    await installCloudDayplan(page, 300);
    await page.evaluate(() => TASK.cloudSync());
    await expect.poll(() => page.evaluate(() => TASK.hasPlan)).toBe(true);
    expect(await minutes(page), '事件流重建也读同一份上限').toBe(240);
  });

  test('换设备重建：老档案里的 1 分钟 → 抬到下限 5', async ({ page }) => {
    await gotoNoPlan(page);
    await installCloudDayplan(page, 1);
    await page.evaluate(() => TASK.cloudSync());
    await expect.poll(() => page.evaluate(() => TASK.hasPlan)).toBe(true);
    expect(await minutes(page), '低于新下限的历史值抬到 5').toBe(5);
  });
});
