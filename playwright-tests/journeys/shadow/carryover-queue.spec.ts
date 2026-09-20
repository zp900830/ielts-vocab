// Hand-written alongside tests/e2e/shadow/carryover-queue.md
// 2026-09-20 重写：新模型里没有「顺延」这个概念 —— 队列按时间预算现算，没读过的词一直留在池子里，
// 所以「断更 N 天」不该产生任何欠账，也不该丢进度。这条锁的是那两件事（PRD §5.3 步 5、§14 T3）。
// 文件名沿用 carryover-queue，因为它来自第一批修复 A1（日历把窗口推走、句子被永久跳过）。

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

declare const TASK: {
  resetV2(): void; initPlan(n: number): void;
  todayPlan(force?: boolean): { queue: { i: number }[]; items: unknown[]; stats: Record<string, unknown> };
  readDone(i: number): void;
  state(): { words: Record<string, { stage: string; reps: number; lastContactDay: string }> };
  openPanel(): void;
};
declare const ShadowPlan: { dayKey(ts: number, h: number): string };

const V2_KEY = 'ielts.shadow.v2';
const DEBT_SHAPE = /debt|owed|backlog|missed|overdue|待补|欠/i;

test.describe('断更之后：不生成欠账，也不丢进度', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/carryover-queue.md' });
    await page.goto(`${baseURL}/index.html`);
    await page.locator('.sent').first().waitFor();
  });

  // 把整份存档的时间戳往前挪 N 天 = 「上次打开是 N 天前」，并逼开页时重放一遍
  async function ageTheArchive(page: import('@playwright/test').Page, days = 7) {
    await page.evaluate(([key, d]) => {
      const raw = JSON.parse(localStorage.getItem(key) || 'null');
      if (!raw) return;
      const shift = d * 864e5;
      raw.events.forEach((e: { ts: number; day?: string }) => { e.ts -= shift; if (e.day) e.day = ''; });
      raw.state.eventsSeen = -1;          // 与 events.length 不一致 → loadRoot 会重放
      raw.planned = {};                   // 每天第一次算出的句数承诺也一起作废
      raw.uploaded = raw.events.length;   // 云端那份早就传完了，别把测试拖进上传
      localStorage.setItem(key, JSON.stringify(raw));
    }, [V2_KEY, days] as const);
    await page.reload();
    await page.locator('.sent').first().waitFor();
  }

  test('7 天没打开：今天的队列仍由分钟数决定，也不带任何欠账字段', async ({ page }) => {
    const fresh = await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      TASK.todayPlan(true).queue.slice(0, 4).forEach(x => TASK.readDone(x.i));
      return TASK.todayPlan(true).queue.length;
    });
    expect(fresh).toBeGreaterThan(0);
    await ageTheArchive(page);

    const got = await page.evaluate(() => {
      const tp = TASK.todayPlan(true);
      return {
        n: tp.queue.length, used: tp.stats.usedSec as number, budget: tp.stats.budgetSec as number,
        words: Object.keys(TASK.state().words).length,
        blob: localStorage.getItem('ielts.shadow.v2') || '',
      };
    });
    expect(got.used).toBeLessThanOrEqual(got.budget + 1);   // 预算说了算，不是「欠多少补多少」
    expect(got.n).toBeGreaterThan(0);                       // 断更 7 天也不给空屏
    expect(got.words).toBeGreaterThan(0);                   // 7 天前见过的词还在
    expect(DEBT_SHAPE.test(got.blob)).toBe(false);          // 存储里根本没有「欠账」这个形状
  });

  test('界面上不出现「欠 / 待补 / 积压」，也不出现「轮」', async ({ page }) => {
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    await ageTheArchive(page);
    await page.evaluate(() => TASK.openPanel());
    const txt = await page.locator('#todayPanel').innerText();
    expect(/欠|待补|积压|轮|已读 \d/.test(txt)).toBe(false);
    expect(txt).toContain('今天');
  });

  test('7 天里没读完的词仍然会回来（进度游标不看日历）', async ({ page }) => {
    const before = await page.evaluate(() => {
      TASK.resetV2(); TASK.initPlan(15);
      TASK.todayPlan(true).queue.slice(0, 3).forEach(x => TASK.readDone(x.i));
      return { seen: Object.keys(TASK.state().words).length };
    });
    expect(before.seen).toBeGreaterThan(0);
    await ageTheArchive(page);
    const after = await page.evaluate(() => {
      const tp = TASK.todayPlan(true);
      const today = ShadowPlan.dayKey(Date.now(), 4);
      const st = TASK.state();
      const ws = Object.keys(st.words);
      return {
        queued: tp.queue.length,
        seen: ws.length,
        dueToday: tp.stats.dueWords as number,
        neverGraduated: ws.every(k => st.words[k].stage !== 'graduated'),
        aged: ws.filter(k => st.words[k].lastContactDay && st.words[k].lastContactDay !== today).length,
      };
    });
    expect(after.seen).toBe(before.seen);
    expect(after.neverGraduated).toBe(true);
    expect(after.aged).toBe(after.seen);            // 上次接触确实是 7 天前，没被改写成今天
    expect(after.dueToday).toBeGreaterThan(0);      // 到期了，所以今天该再见一面
    expect(after.queued).toBeGreaterThan(0);
  });
});
