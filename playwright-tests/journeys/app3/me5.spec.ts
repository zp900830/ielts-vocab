// 3.0 M5「我的」（PRD §8.1 / §8.2 / §10.4）。服务器归 global-setup.ts 起停（仓库根 8932）；
// /app/ 在仓库根，同 home/stats/words，用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  readDone(i: number): void;
  seedArticleForTest(a: number, o: { reps?: number; quizOk?: number; pass2?: boolean }): void;
  repsOf(a: number): number;
  backupPayload(): { app: string; backupVer: number; exportedAt: string; data: Record<string, string> };
  parseBackup(o: unknown): { ok: boolean; reason?: string; keys?: string[] };
  applyBackup(o: { data: Record<string, string> }, keys: string[]): { ok: boolean; reason?: string; rolledBack?: boolean };
  exportBackup(): void;
  importBackup(id?: string): void;
  todayStats(): { streak: number; graduated: number; targetWords: number };
  state(): { daily: Record<string, unknown> } | null;
  planConfig(): { minutes: number; boundary: number; pausedNew: boolean; startDate: string } | null;
  hasPlan: boolean;
};
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number> };
declare const SECTIONS: unknown[];
declare const CLOUD: { _userMail: string };
declare const APP3: { updateMeCard(): void; renderMePop(): void };

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇小壳（篇 0 = 6 句，其余各 1 句），够开计划、够造按篇账，又不拖慢并行。 */
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
const EMPTY: Record<string, string> = { 'sections.json': '[]', 'vocab.json': '{}', 'chapters.json': '[]' };

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });
const openMe = async (page: import('@playwright/test').Page) => {
  await page.locator('#meCard').click();
  await expect(page.locator('#mePop')).toBeVisible();
  return page.locator('#mePop');
};

test.describe('M5 · 导出/导入（§8.1 数据管理）', () => {
  test('坏数据被 parseBackup 拒绝，且原 localStorage 分毫不动', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.seedArticleForTest(0, { reps: 5 }); });
    const before = await page.evaluate(() => localStorage.getItem('ielts.shadow.v2'));

    const cases = await page.evaluate(() => {
      const out: Array<{ name: string; r: { ok: boolean } }> = [];
      const mk = (o: unknown, name: string) => { out.push({ name, r: TASK.parseBackup(o) }); };
      mk(null, 'null');
      mk({ app: 'other', data: {} }, '错 app');
      mk({ app: 'ielts-shadow' }, '无 data');
      mk({ app: 'ielts-shadow', data: { 'ielts.shadow.v2': '{bad json' } }, '坏 v2 JSON');
      mk({ app: 'ielts-shadow', data: { 'nope': 'x' } }, '无可恢复数据');
      return out;
    });
    for (const c of cases) expect(c.r.ok, c.name).toBe(false);
    expect(await page.evaluate(() => localStorage.getItem('ielts.shadow.v2')), '被拒导入不许碰存储').toBe(before);
  });

  test('落盘失败整份回滚，原数据不留半截', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.seedArticleForTest(0, { reps: 2 }); });
    const beforeV2 = await page.evaluate(() => localStorage.getItem('ielts.shadow.v2'));
    const beforeArt = await page.evaluate(() => localStorage.getItem('ielts.app3.article'));

    // 模拟「存储被拒」：凡是写超大值就抛（原快照是小值，回滚能写回）
    await page.evaluate(() => {
      const orig = Storage.prototype.setItem;
      (window as unknown as { __origSetItem: typeof orig }).__origSetItem = orig;
      Storage.prototype.setItem = function (k: string, v: string) {
        if (k === 'ielts.app3.article' && String(v).length > 2000) throw new Error('quota');
        return orig.call(this, k, v);
      };
    });
    const r = await page.evaluate(() => {
      const good = { app: 'ielts-shadow', backupVer: 1, data: {
        'ielts.shadow.v2': JSON.stringify({ state: { words: {} }, events: [] }),
        'ielts.app3.article': JSON.stringify({ reps: { '0': 9 }, pad: 'x'.repeat(3000) }),
      } };
      const parsed = TASK.parseBackup(good);
      return { parsed, applied: parsed.ok ? TASK.applyBackup(good, parsed.keys!) : null };
    });
    expect(r.parsed.ok).toBe(true);
    expect(r.applied!.ok, '写入失败必须报失败').toBe(false);
    expect(r.applied!.rolledBack, '失败必须回滚').toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('ielts.shadow.v2')), '回滚后原 v2 原样').toBe(beforeV2);
    expect(await page.evaluate(() => localStorage.getItem('ielts.app3.article')), '回滚后按篇账原样').toBe(beforeArt);
    await page.evaluate(() => {
      Storage.prototype.setItem = (window as unknown as { __origSetItem: typeof Storage.prototype.setItem }).__origSetItem;
    });
  });

  test('导出 → 导入往返一致，且导入后按篇账可用', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(20); TASK.seedArticleForTest(0, { reps: 4 }); TASK.readDone(0); });
    const payload = await page.evaluate(() => TASK.backupPayload());
    expect(payload.app).toBe('ielts-shadow');
    expect(Object.keys(payload.data), '备份必须含共享根 + 3.0 按篇账').toEqual(
      expect.arrayContaining(['ielts.shadow.v2', 'ielts.app3.article']));

    // 抹掉按篇账（等价换设备），再导入
    await page.evaluate(() => { localStorage.removeItem('ielts.app3.article'); });
    const r = await page.evaluate((pl) => {
      const parsed = TASK.parseBackup(pl);
      return { parsed, applied: parsed.ok ? TASK.applyBackup(pl, parsed.keys!) : null };
    }, payload);
    expect(r.parsed.ok).toBe(true);
    expect(r.applied!.ok).toBe(true);
    expect(await page.evaluate(() => localStorage.getItem('ielts.app3.article'))).toBe(payload.data['ielts.app3.article']);

    await page.reload();
    await waitTask(page);
    expect(await page.evaluate(() => TASK.repsOf(0)), '导入后按篇账真的能读出来').toBe(4);
  });
});

test.describe('M5 · 账号（§8.1 账号信息 / §10.4 键盘可达）', () => {
  test('回车提交登录；注册/登出接线；已登录态显示邮箱+退出、无登录表单', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const pop = await openMe(page);

    // 装录音笔：把 cloud* 换成记录调用
    await page.evaluate(() => {
      (window as unknown as { __calls: unknown[] }).__calls = [];
      (window as unknown as { cloudLogin: unknown }).cloudLogin = (src: unknown) => { (window as unknown as { __calls: unknown[] }).__calls.push(['login', src]); };
      (window as unknown as { cloudSignup: unknown }).cloudSignup = (src: unknown) => { (window as unknown as { __calls: unknown[] }).__calls.push(['signup', src]); };
      (window as unknown as { cloudLogout: unknown }).cloudLogout = () => { (window as unknown as { __calls: unknown[] }).__calls.push(['logout']); };
    });

    // 输入回车 → 视为登录提交
    await pop.locator('#meEmail').fill('bob@example.com');
    await pop.locator('#mePass').fill('secret');
    await pop.locator('#mePass').press('Enter');
    await expect.poll(() => page.evaluate(() => (window as unknown as { __calls: unknown[] }).__calls.length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { __calls: unknown[] }).__calls[0])).toEqual(['login', { email: 'meEmail', pass: 'mePass' }]);

    // 注册按钮 → cloudSignup
    await page.evaluate(() => { (window as unknown as { __calls: unknown[] }).__calls = []; });
    await pop.locator('[data-me-signup]').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __calls: unknown[] }).__calls.length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { __calls: unknown[][] }).__calls[0][0])).toBe('signup');

    // 已登录态：头像 + 昵称 + 退出按钮；登录表单消失
    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); APP3.renderMePop(); });
    await expect(pop.locator('.mp-logout')).toBeVisible();
    await expect(pop.locator('.mp-login-form')).toHaveCount(0);
    await expect(pop.locator('.mp-sub')).toHaveText('alice@example.com');

    // 退出按钮 → cloudLogout
    await page.evaluate(() => { (window as unknown as { __calls: unknown[] }).__calls = []; });
    await pop.locator('[data-me-logout]').click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __calls: unknown[] }).__calls.length)).toBeGreaterThan(0);
    expect(await page.evaluate(() => (window as unknown as { __calls: unknown[][] }).__calls[0][0])).toBe('logout');
  });
});

test.describe('M5 · 浮窗无障碍（§10.4）', () => {
  test('打开即聚焦、aria-modal、Esc 关闭归还焦点、Tab 不逃逸；重渲后焦点仍在浮窗内', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const card = page.locator('#meCard');
    await card.click();
    const pop = page.locator('#mePop');
    await expect(pop).toBeVisible();

    expect(await pop.getAttribute('aria-modal'), '模态语义').toBe('true');
    expect(await page.evaluate(() => document.getElementById('mePop')!.contains(document.activeElement)), '打开即把焦点送进浮窗').toBe(true);

    // Tab 一圈都留在浮窗内
    for (let i = 0; i < 14; i++) await page.keyboard.press('Tab');
    expect(await page.evaluate(() => document.getElementById('mePop')!.contains(document.activeElement)), 'Tab 不逃到侧栏').toBe(true);

    // 重渲（点主题）后焦点仍在浮窗内
    await pop.locator('[data-me-theme]').click();
    expect(await page.evaluate(() => document.getElementById('mePop')!.contains(document.activeElement)), '重渲后焦点不丢').toBe(true);

    // Esc 关闭并归还焦点
    await page.keyboard.press('Escape');
    await expect(pop).toBeHidden();
    expect(await page.evaluate(() => document.activeElement?.id), '焦点归还「我的」').toBe('meCard');
  });
});
