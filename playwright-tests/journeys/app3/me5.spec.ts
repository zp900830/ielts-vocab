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
  const pop = page.locator('#mePop');
  await page.locator('#meCard').click();
  if (!(await pop.isVisible())) await page.locator('#meCard').click(); // 已开时点一下 = 收掉，补一下
  await expect(pop).toBeVisible();
  return pop;
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

test.describe('M5 · 触摸目标（§10.4）', () => {
  test('浮窗内所有可点控件 ≥44px（桌面 + 手机；含计划旋钮与登录表单）', async ({ page }) => {
    await stubData(page, SIX);
    for (const vp of [{ width: 1280, height: 900 }, { width: 390, height: 800 }]) {
      await page.setViewportSize(vp);
      await page.goto(`${rootUrl}/app/index.html#/home`);
      await waitTask(page);
      await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
      const pop = await openMe(page);
      for (const sel of ['#btnAccent', '#voiceBtn', '[data-me-theme]', '[data-me-export]', '[data-me-import]', '.mp-cta', '.mp-row .ps-opt', '#meEmail', '[data-me-login]']) {
        const t = pop.locator(sel).first();
        await expect(t).toBeVisible();
        const h = await t.evaluate((el) => el.getBoundingClientRect().height);
        expect(h, `${vp.width}px ${sel} 触摸目标`).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

test.describe('M5 · 形态与边界（§8.1 / §8.2 / §10.1）', () => {
  test('手机端：浮窗是底部抽屉，§8.1 各区块都在且可达', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 800 });
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    const pop = await openMe(page);
    const geo = await page.evaluate(() => {
      const p = document.getElementById('mePop')!.getBoundingClientRect();
      const c = document.getElementById('meCard')!.getBoundingClientRect();
      return { bottom: p.bottom, cardTop: c.top, left: p.left, right: p.right, vw: innerWidth };
    });
    expect(geo.bottom, '抽屉底边贴 TabBar').toBeLessThanOrEqual(geo.cardTop + 1);
    expect(geo.left, '贴左边').toBeLessThan(16);
    expect(geo.right, '不溢出右边').toBeLessThanOrEqual(geo.vw);
    for (const sel of ['.mp-head', '.mp-nums', '.mp-status', '#btnAccent', '#voiceBtn', '[data-me-theme]', '[data-me-export]', '[data-me-import]', '.mp-row .ps-opt']) {
      await expect(pop.locator(sel).first(), `${sel} 在抽屉里`).toBeVisible();
    }
  });

  test('深色：浮窗不是白底、文字可读（§10.1）', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    const pop = await openMe(page);
    const light = await pop.evaluate((el) => getComputedStyle(el).backgroundColor);
    await page.evaluate(() => document.body.classList.add('dark'));
    const dark = await pop.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dark).not.toBe(light);
    expect(dark).not.toBe('rgb(255, 255, 255)');
    for (const sel of ['.mp-name', '.mp-sub', '.mp-row .mp-label']) {
      const c = await pop.locator(sel).first().evaluate((el) => getComputedStyle(el).color);
      expect(c, `${sel} 深色可读`).not.toBe('rgb(0, 0, 0)');
    }
  });

  test('§8.2 负向锁：我的里没有帮助/关于/产品说明/性能/设置大杂烩等无关入口', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    const pop = await openMe(page);
    const text = await pop.innerText();
    expect(text, '§8.2 明确不放的，一条都不许有').not.toMatch(
      /使用方法|帮助中心|帮助|关于产品|关于我们|产品说明|性能与错误|意见反馈|检查更新|隐私政策|版本号/);
    expect(await pop.locator('a[href]').count(), '我的里没有外链入口').toBe(0);
  });
});

/* 2026-09-25 用户：「几点换算一天的设置不要了（你直接给到 4 点）」。
   删干净：控件 / 存储字段 / API 一起收；旧数据里残留的 boundaryHour 读时忽略、不崩。 */
test.describe('M5 · 计划旋钮（去掉「几点换一天」，日界固定 4 点）', () => {
  test('浮窗没有该旋钮；planConfig 固定 boundary=4；新计划不写 boundaryHour；旧值被忽略', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
    const pop = await openMe(page);
    expect(await pop.locator('[data-me-bound]').count(), '不再有「几点换一天」按钮').toBe(0);
    expect(await pop.innerText()).not.toContain('几点换一天');
    expect(await page.evaluate(() => typeof (TASK as unknown as { setBoundary?: unknown }).setBoundary),
      'setBoundary API 一并删掉').toBe('undefined');

    const cfg = await page.evaluate(() => TASK.planConfig());
    expect(cfg && cfg.boundary, '日界固定 4 点').toBe(4);
    const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('ielts.shadow.v2')!));
    expect(stored.plan.boundaryHour, '新计划不再落 boundaryHour 字段').toBeUndefined();

    // 旧数据残留：手写一个 boundaryHour=0，刷新后仍按 4 点算，且不崩。
    await page.evaluate(() => {
      const o = JSON.parse(localStorage.getItem('ielts.shadow.v2')!);
      o.plan.boundaryHour = 0;
      localStorage.setItem('ielts.shadow.v2', JSON.stringify(o));
    });
    await page.reload();
    await waitTask(page);
    const legacy = await page.evaluate(() => TASK.planConfig());
    expect(legacy && legacy.boundary, '旧值被忽略，仍是 4').toBe(4);
  });
});

/* 2026-09-25 用户：「免费」标签是多余的。确认过全站无付费/会员语义（grep 无 会员/付费/订阅/VIP），
   纯装饰，直接删干净（侧栏一行 + 浮窗头部 + CSS）。 */
test.describe('M5 · 去掉「免费」标签', () => {
  test('未登录/已登录下，用户卡与「我的」浮窗都不再出现「免费」', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await expect(page.locator('#meCard')).not.toContainText('免费');
    const pop = await openMe(page);
    await expect(pop).not.toContainText('免费');
    await expect(pop.locator('.mp-badge')).toHaveCount(0);

    await page.evaluate(() => { CLOUD._userMail = 'alice@example.com'; APP3.updateMeCard(); APP3.renderMePop(); });
    await expect(page.locator('#meCard')).not.toContainText('免费');
    await expect(page.locator('.me-tag')).toHaveCount(0);
  });
});

/* 2026-09-25 用户：补上「重置学习计划」。语义（我的判断）：
   只清计划配置与当天排程（分钟数/新词开关/开始日期），**进度/词状态/日账/streak 一律保留**
   （§9 是核心资产，破坏性操作要二次确认并说清）。重置后可重新建计划，进度续上。 */
test.describe('M5 · 重置学习计划', () => {
  test('二次确认说清「会重置什么/不会动什么」；重置后计划没了、进度还在、可重新建', async ({ page }) => {
    await stubData(page, SIX);
    await page.goto(`${rootUrl}/app/index.html#/home`);
    await waitTask(page);
    await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); TASK.readDone(0); TASK.seedArticleForTest(0, { reps: 5 }); });
    const before = await page.evaluate(() => ({
      words: Object.keys(TASK.state()!.words).length,
      days: Object.keys(TASK.state()!.daily).length,
      streak: TASK.todayStats().streak,
    }));
    expect(before.words, '先造出词进度').toBeGreaterThan(0);

    const pop = await openMe(page);
    const btn = pop.locator('[data-me-reset-plan]');
    await expect(btn, '浮窗里有「重置学习计划」').toBeVisible();
    let msg = '';
    page.once('dialog', async (d) => { msg = d.message(); await d.accept(); });
    await btn.click();
    expect(msg, '确认文案说清重置什么').toMatch(/重置/);
    expect(msg, '确认文案说清不动什么').toMatch(/不会动|保留|不清/);
    await expect.poll(() => page.evaluate(() => TASK.hasPlan)).toBe(false);

    const after = await page.evaluate(() => ({
      words: Object.keys(TASK.state()!.words).length,
      days: Object.keys(TASK.state()!.daily).length,
      streak: TASK.todayStats().streak,
    }));
    expect(after, '重置计划不清进度/词状态/日账/streak').toEqual(before);

    // 能重新建：走真实设置入口（CTA → 设置屏 → 30 分钟 → 开始这个计划）
    await pop.locator('[data-me-cta]').click();
    const panel = page.locator('#todayPanel');
    await expect(panel).toBeVisible();
    await panel.locator('.ps-opt[data-v="30"]').click();
    await panel.locator('#psStart').click();
    await expect.poll(() => page.evaluate(() => TASK.hasPlan)).toBe(true);
    expect((await page.evaluate(() => TASK.planConfig()))!.minutes, '重新选了 30 分钟').toBe(30);
    expect(await page.evaluate(() => Object.keys(TASK.state()!.words).length), '重建后进度仍在').toBe(before.words);
  });
});
