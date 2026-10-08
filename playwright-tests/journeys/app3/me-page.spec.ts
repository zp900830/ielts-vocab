// 2026-10-08 用户：「我的」按宿主分叉 —— PC 端仍是浮窗，移动端改成与浮窗内容相同的一级页面（#/me）；
// 同时 PC 侧栏那一行按登录态显示「未登录 / 账号名」，移动端底栏两种登录态都保持「我的」。
// 账号行的观感借鉴用户给的参考截图：圆形首字母头像（未登录是「未」），不再是通用用户图标。
// 服务器归 global-setup.ts 起停（仓库根 8932）；站点在仓库根，用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';
import { stubCloudAccount } from '../../utils/cloud-stub';
import { setMin } from '../../utils/min-slider';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
  planConfig(): { minutes: number } | null;
  hasPlan: boolean;
};
declare const CLOUD: { _userMail: string };

const rootUrl = process.env.E2E_ROOT_URL || '';
const MOBILE = { width: 390, height: 844 };
const DESKTOP = { width: 1280, height: 800 };

/* 六篇小壳（篇 0 = 6 句，其余各 1 句）：够开计划、够让「每天分钟数」那一行出现。 */
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
    await page.route(`**/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}
const waitTask = (page: import('@playwright/test').Page) =>
  page.waitForFunction(() => { try { return typeof TASK !== 'undefined' && !!TASK.state; } catch (e) { return false; } });

/** 起一台指定视口的主站首页；withPlan 才建计划（计划相关那一行要有计划才出现）。 */
async function boot(page: import('@playwright/test').Page, vp: { width: number; height: number }, withPlan = true) {
  await page.setViewportSize(vp);
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/index.html#/home`);
  await waitTask(page);
  if (withPlan) await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
}
const hash = (page: import('@playwright/test').Page) => page.evaluate(() => location.hash);

test.describe('「我的」双宿主 · 移动端一级页面 / PC 浮窗', () => {
  test('移动端点底栏那一格 → 进 #/me 一级页面，不弹浮层，底栏点亮成当前页', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    expect(await hash(page), '点它 = 切路由，不是弹层').toBe('#/me');
    const pg = page.locator('#appView .me-page');
    await expect(pg, '页面宿主在 #appView 里').toBeVisible();
    await expect(pg.locator('.pg-title'), '一级页面有自己的标题').toHaveText('我的');
    await expect(page.locator('#mePop'), '移动端不再用浮层').toBeHidden();
    expect(await page.locator('#mePop').evaluate((el) => el.innerHTML.trim()), '浮窗在移动端保持空壳（不撞 id）').toBe('');
    await expect(page.locator('#meCard'), '底栏那一格是选中态').toHaveClass(/\bon\b/);
    expect(await page.locator('#meCard').getAttribute('aria-current'), 'tab 语义而不是弹窗').toBe('page');
  });

  test('PC 点侧栏那一行 → 仍是浮窗，路由一步都不动', async ({ page }) => {
    await boot(page, DESKTOP);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    await expect(page.locator('#mePop'), 'PC 还是向上弹的浮窗').toBeVisible();
    expect(await hash(page), 'PC 点它不跳路由').toBe('#/home');
    expect(await page.locator('#appView .me-page').count(), 'PC 不渲页面宿主').toBe(0);
    expect(await page.locator('#meCard').getAttribute('aria-current'), 'PC 不是 tab 语义').toBe(null);
  });

  test('PC 侧栏那一行跟着登录态：未登录写「未登录」，登录后写账号名', async ({ page }) => {
    await boot(page, DESKTOP);
    await expect(page.locator('#meCard .me-tab-label'), '未登录：状态就是这一行的文案').toHaveText('未登录');
    await stubCloudAccount(page, 'demo@example.com');
    await expect(page.locator('#meCard .me-tab-label'), '已登录：账号名（邮箱 @ 前缀）').toHaveText('demo');
    await expect(page.locator('#meCard .i-line'), '图标仍是那颗用户图标（不换皮）').toHaveClass(/\bri-user-smile-line\b/);
  });

  test('移动端底栏两种登录态都写「我的」，不把账号塞进 tab', async ({ page }) => {
    await boot(page, MOBILE);
    await expect(page.locator('#meCard .me-tab-label'), '未登录也是「我的」').toHaveText('我的');
    await stubCloudAccount(page, 'demo@example.com');
    await expect(page.locator('#meCard .me-tab-label'), '登录后还是「我的」（账号只出现在页面里）').toHaveText('我的');
  });

  test('未登录也进得去页面：页内给「去登录」，改主题不用先登录', async ({ page }) => {
    await boot(page, MOBILE, false);
    await page.locator('#meCard').click();
    expect(await hash(page)).toBe('#/me');
    const pg = page.locator('#appView .me-page');
    await expect(pg.locator('.mp-login-btn'), '未登录：页内一颗去登录').toBeVisible();
    await expect(page.locator('#loginModal'), '不再先拦一道登录弹窗').toBeHidden();
    const wasDark = await page.evaluate(() => document.body.classList.contains('dark'));
    await pg.locator('[data-me-theme]').click();
    expect(await page.evaluate(() => document.body.classList.contains('dark')), '未登录也调得了主题').toBe(!wasDark);
    await expect(pg, '切主题不该把页面换成登录弹窗').toBeVisible();
  });

  test('页面与浮窗内容同一份：关键区块一个不少', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    const pg = page.locator('#appView .me-page');
    for (const sel of ['.mp-head', '.mp-cta', '.mp-card', '.mp-nums', '#btnAccent', '#voiceBtn',
      '[data-me-theme]', '.min-range', '#mpEta', '[data-me-start]', '[data-me-reset-plan]', '[data-me-export]', '[data-me-import]']) {
      await expect(pg.locator(sel).first(), `${sel} 在页面里` ).toBeVisible();
    }
    await expect(pg.locator('.mp-name'), '账号名写在页内头部').toHaveText('demo');
  });

  /* 2026-10-08 用户：「之前可以自定义今日任务开始线的内容没了？」—— 入口原来只长在正文那根
     2px 的线上（移动端零提示、设完不复现）。今日面板补了真按钮，「我的」这一行也要回显当前起点：
     这一屏是计划的另一处宿主（每天分钟数也在这里），学生找「今天从哪开始」最先翻的就是它。 */
  test('「我的」里回显今天起点：点了开同一颗起点弹窗，设完就地更新，并能改回自动', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    const me = page.locator('#meBody');
    const start = me.locator('[data-me-start]');
    await expect(start, '没设过起点也要报当前是哪一句，不能空着').toContainText('自动');

    await start.click();
    await expect(page.locator('#startPickPop'), '开的是今日面板那颗同款起点弹窗').toBeVisible();
    await page.locator('#spArt').selectOption('2');
    await page.locator('#startPickPop .sp-actions .btn.primary').click();
    await expect(page.locator('#startPickPop'), '设完弹窗自己收掉').toHaveCount(0);
    await expect(start, '就地回显新起点（不用重开这一屏）').toContainText('第 3 篇第 1 句');
    await expect(me.locator('[data-me-start-auto]'), '手动状态下给一把改回自动的键').toBeVisible();

    /* 改回自动走两步（2026-10-09 用户「起点怎么算？怎么让人不恐慌」）：先亮预览
       （自动起点落在哪/几句/已读保留），确认才真清账 —— 不再一键盲改。 */
    await me.locator('[data-me-start-auto]').click();
    await expect(page.locator('#startPickPop h3'), '先看到结果预览，不是直接改').toContainText('改回自动安排？');
    /* 预览显示的是【自动排程】算出的起点（不是手动位置）：新计划引擎从头排 = 第1篇第1句。 */
    await expect(page.locator('#startPickPop .sp-warn').first(), '预览里有自动算出的起点位置').toContainText('第1篇第1句');
    await page.locator('#startPickPop button', { hasText: '确认改回' }).click();
    await expect(page.locator('#startPickPop'), '确认后弹窗收掉').toHaveCount(0);
    await expect(start, '改回自动后回到自动文案').toContainText('自动');
    await expect(me.locator('[data-me-start-auto]'), '自动状态下这一颗不该可见（行整条 hidden，不换节点）').toBeHidden();
  });

  /* 起点弹窗（z 611）现在会盖在浮窗（400）之上：Esc 必须一层一层收。
     浮层栈只管它自己那一层，app.js 里那条「Esc 一律收浮窗」的旧监听得让路（D4 同一件事）。 */
  test('PC 浮窗里开起点弹窗：Esc 第一下只收弹窗、浮窗还在，第二下才收浮窗', async ({ page }) => {
    await boot(page, DESKTOP);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    await expect(page.locator('#mePop')).toBeVisible();
    await page.locator('#mePop [data-me-start]').click();
    await expect(page.locator('#startPickPop'), '起点弹窗盖在浮窗之上').toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#startPickPop'), '第一下只收弹窗').toHaveCount(0);
    await expect(page.locator('#mePop'), '浮窗不该被第一下一带走').toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('#mePop'), '第二下才收浮窗').toBeHidden();
  });

  /* 同一件事的点击版：遮罩自己的 click 先跑 closeStartPicker 把两个节点摘掉，
     等事件冒到 document 上那条「点外面收浮窗」时，文档里已经没有 #startPickPop 了 ——
     守卫必须认 event.target（节点被摘下仍留着父链，closest 还认得它），不能问文档。 */
  test('PC 浮窗里开起点弹窗：点遮罩只收弹窗，浮窗留在原地', async ({ page }) => {
    await boot(page, DESKTOP);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    await page.locator('#mePop [data-me-start]').click();
    await expect(page.locator('#startPickPop'), '起点弹窗盖在浮窗之上').toBeVisible();
    await page.locator('#startPickMask').click({ position: { x: 6, y: 6 } });   // 遮罩左上角，避开居中的卡片
    await expect(page.locator('#startPickPop'), '这一下发落在遮罩上：弹窗收掉').toHaveCount(0);
    await expect(page.locator('#mePop'), '浮窗不该被遮罩这一击带走').toBeVisible();
  });

  test('账号行按参考图：圆形首字母头像，未登录显示「未」', async ({ page }) => {
    await boot(page, MOBILE);
    await page.locator('#meCard').click();
    const av = page.locator('#appView .me-page .mp-avatar');
    await expect(av, '未登录：头像里是「未」').toHaveText('未');
    expect(await av.locator('i').count(), '不再放通用用户图标').toBe(0);
    await stubCloudAccount(page, 'demo@example.com');
    await page.evaluate(() => { location.hash = '#/home'; });
    await page.locator('#meCard').click();
    await expect(page.locator('#appView .me-page .mp-avatar'), '已登录：首字母大写').toHaveText('D');
  });

  test('浏览器后退离开页面，回到底栏其它 tab 正常', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    expect(await hash(page)).toBe('#/me');
    await page.goBack();
    expect(await hash(page), '后退 = 回首页').toBe('#/home');
    expect(await page.locator('#appView .me-page').count(), '页面宿主收掉').toBe(0);
    await expect(page.locator('#meCard'), '底栏还在').toBeVisible();
  });

  test('页面里拖滑块松手就落账（与浮窗共用同一份监听，不抄第二套）', async ({ page }) => {
    await boot(page, MOBILE);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    const range = page.locator('#appView .me-page .min-range');
    await expect(range).toHaveValue('15');
    await setMin(range, 45);
    expect((await page.evaluate(() => TASK.planConfig()))!.minutes, '松手即改计划').toBe(45);
    await page.reload();
    await waitTask(page);
    expect((await page.evaluate(() => TASK.planConfig()))!.minutes, '落账后重开还在').toBe(45);
  });

  /* 白底隐形地雷（2026-10-09 用户 Safari 桌面端「组件全变白色填充」）：
     页面声明了 color-scheme: light dark，macOS 系统深色 + 应用浅色时，Safari 给没有显式
     color 的 <button> 用 UA 的 buttontext（系统深色下 = 白色）—— ps-opt 一直没显式 color，
     白字落在白底浮窗上只剩一颗空胶囊。修法是显式 color + 掐 appearance；这条锁钉住
     「浮窗里每颗 ps-opt 都必须自带解析得出的颜色和 appearance:none」，UA 兜底不再有位置。 */
  test('PC 浮窗的 ps-opt 颗颗显式上色，不吃 UA 的 buttontext 兜底', async ({ page }) => {
    await boot(page, DESKTOP);
    await stubCloudAccount(page, 'demo@example.com');
    await page.locator('#meCard').click();
    await expect(page.locator('#mePop')).toBeVisible();
    const pills = await page.evaluate(() => {
      const pop = document.getElementById('mePop')!;
      return [...pop.querySelectorAll<HTMLElement>('.mp-row .ps-opt')].map((b) => {
        const c = getComputedStyle(b);
        const rowHidden = !!(b.closest('.mp-row') as HTMLElement | null)?.hidden;   // 「改回自动安排」自动态整行隐藏
        return { text: (b.textContent || '').trim().slice(0, 10), color: c.color,
                 appearance: c.webkitAppearance || c.appearance,
                 visible: !rowHidden && b.getBoundingClientRect().width > 0 };
      });
    });
    expect(pills.length, '浮窗里有今天起点 + 导出/导入等一排 ps-opt').toBeGreaterThanOrEqual(3);
    for (const p of pills) {
      if (p.visible) expect(p.visible, `"${p.text}" 在浮窗里渲染出来了`).toBe(true);
      expect(p.color, `"${p.text}" 必须显式上色（不能是 UA 的 buttontext）`).toMatch(/^rgb\(\d+, \d+, \d+\)$/);
      expect(p.color, `"${p.text}" 不能是纯白（白字白底 = 隐形）`).not.toBe('rgb(255, 255, 255)');
      expect(p.appearance, `"${p.text}" 掐掉原生外观兜底`).toBe('none');
    }
  });
});
