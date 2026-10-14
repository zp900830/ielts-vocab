// 2026-10-15 性能修复（分支 agent/workbuddy-perf-1015）的回归锁，三条各自钉一处「全量成本回潮」：
//   ① 记账句级批量：读一句 = 一次全量落盘（旧：句里每个词各重放全量日志 + 各落盘一次）；
//   ② 滚动不重绘：播放中手动滚动不许重写 #btnPlay（旧：每个 scroll 事件同步跑一遍全量 paint）；
//   ③ 工期预览合并：拖动连跨多档只结算最后一档（旧：每跨一档排一个 0.3–0.9s 的全量 estimateDays）。
// 这三条都是「可观测的行为契约」，不是跑分 —— 性能数字本身没有稳定断言，但病根可以被钉死：
// 谁把某个修复改回去，对应的锁必须当场变红（反向验证 2026-10-15 实做，见
// docs/superpowers/specs/2026-10-15-性能修复.md 的「反向验证」节）。
import { test, expect } from '../../fixtures';

declare const SECTIONS: unknown[];
declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  openPanel(): void;
  setView(v: string): void;
  planConfig(): { minutes: number } | null;
  etaCalls: { n: number };
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 篇 0 = 40 句（② 要够高才滚得动）：第 0 句挂 3 个目标词（① 要逐词记账）。 */
const PAYLOAD = (() => {
  const mk = (title: string, lines: string[]) => ({
    title, zh: title, subheads: [''],
    paragraphs: [lines],
    sentZh: [lines.map((_, i) => `第 ${i + 1} 句译文。`)],
    paraZh: [''],
  });
  const lines = ['One [[alpha:alpha]] and [[beta:beta]] and [[gamma:gamma]] here.'];
  for (let i = 1; i < 40; i++) lines.push(`Sentence ${i} about [[alpha:alpha]].`);
  const vocab: Record<string, { m: string }> = { alpha: { m: 'n. α' }, beta: { m: 'n. β' }, gamma: { m: 'n. γ' } };
  return {
    'sections.json': JSON.stringify([mk('地球与生命', lines), mk('校园与文化', ['A [[beta:beta]] line.'])]),
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

async function waitAppReady(page: import('@playwright/test').Page) {
  await page.waitForFunction(() => {
    try {
      return typeof SECTIONS !== 'undefined' && SECTIONS.length > 0
        && typeof TASK !== 'undefined' && !!(TASK.state() && TASK.state().daily);
    } catch (e) { return false; }
  });
}

/* 起一份干净计划（15 分钟档）。 */
async function freshPlan(page: import('@playwright/test').Page) {
  await waitAppReady(page);
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
}

test.describe('2026-10-15 性能修复 · 回归锁', () => {
  test('① 记账句级批量：读一句只落盘一次，句里 3 个词的接触一条不少', async ({ page }) => {
    await stubData(page, PAYLOAD);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await freshPlan(page);

    const r = await page.evaluate(() => {
      /* 数 ielts.shadow.v2 的同步写次数：readDone 全程同步，count 能精确圈住这一次调用。 */
      let count = 0;
      const orig = Storage.prototype.setItem;
      Storage.prototype.setItem = function (k: string, v: string) { if (k === 'ielts.shadow.v2') count++; return orig.call(this, k, v); };
      const evLen = () => (JSON.parse(localStorage.getItem('ielts.shadow.v2') || '{"events":[]}').events || []).length;
      const ev0 = evLen();
      TASK.readDone(0);                       // 第 0 句：3 个目标词
      return { writes: count, ev: evLen() - ev0 };
    });
    expect(r.ev, '句里 3 个词的接触都要入账（行为等价是前提）').toBe(3);
    expect(r.writes, '一句只许全量落盘一次（旧实现逐词落 3 次）').toBe(1);
  });

  test('② 滚动不重绘：播放中手动滚动不许重写播放键（paint 不许从滚动路径回来）', async ({ page }) => {
    await stubData(page, PAYLOAD);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await freshPlan(page);
    await page.reload();
    await waitAppReady(page);

    await page.locator('.art-card .a-open').first().click();
    await expect(page.locator('body')).toHaveClass(/task-mode/);

    /* 录音笔：应下「这句播完了」的回调先攒着不兑现 —— playing 稳定为真，且不会自动翻句。 */
    await page.evaluate(() => {
      const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __cbs: (() => void)[] };
      w.__cbs = [];
      w.speak = function (t: string, cb?: () => void) { if (cb) w.__cbs.push(cb); };
    });
    await page.locator('#tbNext').click();
    expect(await page.evaluate(() => (window as unknown as { __cbs: unknown[] }).__cbs.length), '起播后应有未兑现的朗读').toBeGreaterThan(0);
    await page.waitForTimeout(400);          // 放掉 playFrom 的程序性滚动标记（200ms 后清）

    await page.evaluate(() => {
      const w = window as unknown as { __btnMut: number };
      w.__btnMut = 0;
      const el = document.getElementById('btnPlay')!;
      new MutationObserver(() => { w.__btnMut++; }).observe(el, { childList: true, subtree: true, attributes: true, characterData: true });
    });
    await page.evaluate(() => { window.scrollTo(0, 400); });
    await page.waitForTimeout(120);
    await page.evaluate(() => { window.scrollTo(0, 460); });
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => (window as unknown as { __btnMut: number }).__btnMut),
      '播放中滚动不许触发重写 #btnPlay（旧实现每个 scroll 事件全量 paint 一次）').toBe(0);
  });

  test('③ 工期预览合并：拖动连跨 5 档只结算最后一档', async ({ page }) => {
    await stubData(page, PAYLOAD);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitAppReady(page);
    await freshPlan(page);
    await page.evaluate(() => { TASK.openPanel(); TASK.setView('plan'); });
    await expect(page.locator('#todayPanel .min-range')).toHaveCount(1);
    await page.waitForTimeout(400);          // 让开面板那一次首算落定，再取基线

    const before = await page.evaluate(() => TASK.etaCalls.n);
    await page.evaluate(() => {
      const el = document.querySelector('#todayPanel .min-range') as HTMLInputElement;
      for (const m of [20, 25, 30, 35, 40]) {
        el.value = String(m);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(500);          // 等过 250ms 合并窗口
    const delta = (await page.evaluate(() => TASK.etaCalls.n)) - before;
    expect(delta, '连续跨 5 档只许为最后一档算一次（旧实现每档各算一次）').toBe(1);
    await expect(page.locator('#todayPanel .min-val'), '读数跟着手指走').toHaveText('40 分钟');
    expect(await page.evaluate(() => TASK.planConfig()?.minutes), '松手前不落账').toBe(15);
    await page.evaluate(() => { document.querySelector('#todayPanel .min-range')!.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(await page.evaluate(() => TASK.planConfig()?.minutes), 'change 才落账').toBe(40);
  });
});
