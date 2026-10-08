// 2026-10-06 用户报：手机上建了计划，桌面（web）端登录同一账号后首页仍显示「设置你每天的学习时间」。
// 根因：dayplan 事件会上云，但对端 cloudPull 只把它记进 daily 账，没人重建 ROOT2.plan。
// 本文件锁三件事：
// ① 换设备登录后，事件流里的 dayplan 能把计划重建出来（minutes 取最新一条、startDate 取最早一条）；
// ② 重建后首页横幅从「设置学习时间」翻成「继续学」；
// ③ 刚「重置学习计划」（pendingReplan）时不得从历史 dayplan 里把旧计划捞回来。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  resetLearningPlan(): boolean;
  cloudSync(): Promise<{ sent?: number }>;
  planConfig(): { minutes: number; boundary: number; startDate: string } | null;
  hasPlan: boolean;
  state(): unknown;
};
declare const CLOUD: { client(): unknown; _userMail?: string };
declare const APP3: { route(): void };
declare const ShadowPlan: { dayKey(ts: number, h: number): string };

const rootUrl = process.env.E2E_ROOT_URL || '';

const SIX: Record<string, string> = (() => {
  const mk = (title: string, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[w${i}:w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let i = 0; i < 12; i++) vocab[`w${i}`] = { m: 'w' + i };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i === 0 ? 6 : 1))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page) {
  for (const [name, body] of Object.entries(SIX)) {
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });

/* 假 Supabase client：shadow_events 的分页查询返回注入的行；
   article-account 那条链（eq type）返回空，书签 maybeSingle 也返回空。 */
async function installFakeEvents(page: import('@playwright/test').Page, rows: unknown[]) {
  await page.evaluate((serverRows) => {
    const w = window as unknown as { __upserts: unknown[] };
    w.__upserts = [];
    CLOUD.client = () => ({
      auth: { getSession: async () => ({ data: { session: { user: { id: 'plan-sync-user' } } } }) },
      from: () => ({
        select: () => {
          const chain: {
            _filters: [string, unknown][];
            eq(c: string, v: unknown): unknown;
            order(c: string, o: object): unknown;
            range(): Promise<{ data: unknown; error: null }>;
            maybeSingle(): Promise<{ data: null; error: null }>;
          } = {
            _filters: [],
            eq(col: string, val: unknown) { this._filters.push([col, val]); return this; },
            order() { return this; },
            async range() {
              if (this._filters.some(([c, v]) => c === 'type' && v === 'article-account')) return { data: [], error: null };
              return { data: serverRows, error: null };
            },
            async maybeSingle() { return { data: null, error: null }; },
          };
          return chain;
        },
        upsert: async (payload: unknown) => { w.__upserts.push(payload); return { error: null }; },
      }),
    });
  }, rows);
}

test.describe('换设备计划同步：dayplan 事件重建 ROOT2.plan', () => {
  test('本机无计划时从事件流重建；刚重置过则不许复活', async ({ page }) => {
    await stubData(page);
    await page.goto(`${rootUrl}/index.html#/home`);
    await waitTask(page);

    // 干净机：没有任何计划
    await page.evaluate(() => { TASK.resetV2(); localStorage.removeItem('ielts-task-plan'); });
    await page.reload();
    await waitTask(page);
    expect(await page.evaluate(() => TASK.hasPlan), '干净机没有计划').toBe(false);
    await expect(page.locator('#appView'), '首页横幅还是「设置学习时间」').toContainText('设置你每天的学习时间');

    // 服务端躺着两条 dayplan：3 天前建计划 25 分钟，昨天改成 40 分钟
    const rows = await page.evaluate(() => {
      const d = (back: number) => ShadowPlan.dayKey(Date.now() - back * 864e5, 4);
      const mk = (back: number, minutes: number, id: string) => {
        const ts = Date.now() - back * 864e5;
        return { event_id: id, ts, type: 'dayplan',
                 payload: { type: 'dayplan', day: d(back), minutes, ts, id } };
      };
      return [mk(3, 25, 'dp-1'), mk(1, 40, 'dp-2')];
    });
    await installFakeEvents(page, rows);

    await page.evaluate(() => TASK.cloudSync());
    await expect.poll(() => page.evaluate(() => TASK.hasPlan), 'cloudSync 后计划被重建').toBe(true);
    const cfg = await page.evaluate(() => TASK.planConfig());
    expect(cfg!.minutes, '分钟数取最新一条 dayplan').toBe(40);
    expect(cfg!.startDate, '开始日期取最早一条 dayplan').toBe((rows[0] as { payload: { day: string } }).payload.day);

    // 首页横幅翻面：不再是「设置学习时间」
    await page.evaluate(() => APP3.route());
    await expect(page.locator('#appView')).not.toContainText('设置你每天的学习时间');

    // 刚「重置学习计划」的设备（pendingReplan）：不许从历史 dayplan 复活
    page.once('dialog', (d) => { d.accept().catch(() => {}); });
    const resetOk = await page.evaluate(() => TASK.resetLearningPlan());
    expect(resetOk).toBe(true);
    expect(await page.evaluate(() => TASK.hasPlan), '重置后无计划').toBe(false);
    await page.evaluate(() => TASK.cloudSync());
    await page.waitForTimeout(300);   // cloudSync 内部异步段走完
    expect(await page.evaluate(() => TASK.hasPlan), '重置后不许从历史 dayplan 复活旧计划').toBe(false);
  });
});
