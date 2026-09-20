// Hand-written alongside docs/superpowers/plans/2026-09-20-task-mode-phase-1.md (Task 8)
// 事件流上云（PRD §12 / T10）：只追加、靠 event_id 去重、失败不打断跟读。
// 云端用假 client（route 直接把 supabase-js 换成桩），所以联网与断网都跑同一套断言。
import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

declare const TASK: {
  resetV2(): void; initPlan(n: number): void;
  todayPlan(force?: boolean): { queue: { i: number }[] };
  readDone(i: number): void;
  pendingEvents(): { id: string; type: string }[];
  events(): { id: string }[];
  cloudPush(): Promise<{ sent: number; error?: string; offline?: boolean }>;
  cloudPull(): Promise<{ got: number; newEvents: number }>;
  state(): { words: Record<string, { reps: number; stage: string }> };
};
declare const window: { __supaRows: { event_id: string }[]; __supaReject: boolean };

// 行存在 localStorage 里，这样 reload 之后「云端」还在 —— 幂等只能跨刷新来验
const STUB = `
window.__supaReject = false;
var rows = function () { try { return JSON.parse(localStorage.getItem('__supaRows') || '[]'); } catch (e) { return []; } };
var save = function (r) { localStorage.setItem('__supaRows', JSON.stringify(r)); };
window.__supaRows = rows();
window.supabase = {
  createClient: function () {
    return {
      auth: {
        getSession: function () { return Promise.resolve({ data: { session: { user: { id: 'u-test', email: 'stub@local' } } } }); },
        onAuthStateChange: function () { return { data: { subscription: { unsubscribe: function () {} } } }; }
      },
      from: function () {
        var q = {};
        q.upsert = function (incoming) {
          if (window.__supaReject) return Promise.resolve({ error: { message: 'rls denied' } });
          var list = Array.isArray(incoming) ? incoming : [incoming];
          var cur = rows();
          list.forEach(function (r) { if (!cur.some(function (x) { return x.event_id === r.event_id; })) cur.push(r); });
          save(cur); window.__supaRows = cur;
          return Promise.resolve({ error: null, data: null });
        };
        q.select = function () { return q; };
        q.eq = function () { return q; };
        q.order = function () { return q; };
        q.range = function () { return Promise.resolve({ data: rows(), error: null }); };
        return q;
      }
    };
  }
};`;

test.describe('append-only event stream', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in "${ENV}"`);

  test.beforeEach(async ({ page, baseURL }) => {
    test.info().setTimeout(currentTimeout() * 8);
    await page.route('**/supabase-js@2*', r => r.fulfill({
      status: 200, contentType: 'application/javascript', body: STUB,
    }));
    await page.goto(`${baseURL}/index.html`);
    await page.locator('.sent').first().waitFor();
    await page.evaluate(() => { localStorage.removeItem('__supaRows'); TASK.resetV2(); });
  });

  test('offline contacts queue up and survive a reload', async ({ page }) => {
    const a = await page.evaluate(() => {
      TASK.initPlan(10);
      TASK.todayPlan(true).queue.slice(0, 3).forEach(x => TASK.readDone(x.i));
      return { pending: TASK.pendingEvents().length, events: TASK.events().length,
               words: Object.keys(TASK.state().words).length };
    });
    expect(a.pending).toBeGreaterThan(0);
    await page.reload();
    await page.locator('.sent').first().waitFor();
    const b = await page.evaluate(() => ({
      events: TASK.events().length, words: Object.keys(TASK.state().words).length,
      cloud: window.__supaRows.length,
    }));
    expect(b.events).toBe(a.events);        // 事件流一条不丢
    expect(b.words).toBe(a.words);          // 词状态重放回同一份
    expect(b.cloud).toBeGreaterThan(0);     // 开页自动把攒下的补传了
  });

  test('push sends idempotent rows and a second push sends nothing new', async ({ page }) => {
    const first = await page.evaluate(async () => {
      TASK.initPlan(10);
      TASK.todayPlan(true).queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
      const r = await TASK.cloudPush();
      return { sent: r.sent, cloud: window.__supaRows.length, left: TASK.pendingEvents().length };
    });
    expect(first.sent).toBeGreaterThan(0);
    expect(first.cloud).toBe(first.sent);
    expect(first.left).toBe(0);
    const again = await page.evaluate(async () => (await TASK.cloudPush()).sent);
    expect(again).toBe(0);
  });

  test('replaying cloud rows twice yields the same state', async ({ page }) => {
    const got = await page.evaluate(async () => {
      TASK.initPlan(10);
      TASK.todayPlan(true).queue.slice(0, 3).forEach(x => TASK.readDone(x.i));
      await TASK.cloudPush();
      TASK.resetV2();
      TASK.initPlan(10);
      const a = await TASK.cloudPull();
      const s1 = JSON.stringify(TASK.state().words);
      const b = await TASK.cloudPull();
      const s2 = JSON.stringify(TASK.state().words);
      return { got: a.got, added: a.newEvents, again: b.newEvents, same: s1 === s2 };
    });
    expect(got.got).toBeGreaterThan(0);
    expect(got.added).toBeGreaterThan(0);
    expect(got.again).toBe(0);              // 第二次一条都不再新增：event_id 去重
    expect(got.same).toBe(true);
  });

  test('a refused upload never breaks local progress and leaves a standing hint', async ({ page }) => {
    const got = await page.evaluate(async () => {
      window.__supaReject = true;
      TASK.initPlan(10);
      TASK.todayPlan(true).queue.slice(0, 2).forEach(x => TASK.readDone(x.i));
      const r = await TASK.cloudPush();
      return { err: !!r.error, pending: TASK.pendingEvents().length,
               words: Object.keys(TASK.state().words).length };
    });
    expect(got.err).toBe(true);
    expect(got.words).toBeGreaterThan(0);   // 本地照常推进
    expect(got.pending).toBeGreaterThan(0); // 事件留在待发队列
    await expect(page.locator('#syncHint')).toBeVisible();
  });
});
