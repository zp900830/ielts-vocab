// 3.0 M1 Task 2：/app/ 外壳（左侧导航 5 项 + hash 路由 + 三档断点 + 任务模式复原正文）。
// 服务器归 global-setup.ts 起停（根目录 8932）；8931 那台服务的是 shadow/ 树，
// 而 /app/ 在仓库根，所以这里和 smoke.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

declare const TASK: {
  hasPlan: boolean;
  resetV2(): void;
  initPlan(minutes: number): void;
  enterTaskMode(): void;
};

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 外壳是静态 HTML + app.js 路由，不依赖课文数据。这里把三份 JSON 换成 stub：
   既让用例只测外壳（不让整套再多一页 1833 句 + 3242 词的重渲染 ——
   实测那份额外负载会把整套里时序敏感的 shadow 用例压出偶发红），
   又不产生数据加载错误、应用照常启动。三份数据「接没接对」由
   scripts/build_site.mjs 的白名单自检守着（引用缺失会直接 BUILD FAILED）。 */
async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }),
    );
  }
}

const EMPTY: Record<string, string> = {
  'sections.json': '[]',
  'vocab.json': '{}',
  'chapters.json': '[]',
};

/* 任务模式用例的最小课文：两句、各带一个目标词标记，够 buildQueue 排出一句。 */
const TINY: Record<string, string> = {
  'sections.json': JSON.stringify([{
    title: '测试篇', zh: '测试', subheads: [''],
    paragraphs: [['The [[atmosphere:atmosphere]] protects life.', 'We need [[oxygen:oxygen]] to live.']],
    sentZh: [['大气层保护生命。', '我们需要氧气才能活。']], paraZh: [''],
  }]),
  'vocab.json': JSON.stringify({
    atmosphere: { uk: 'ˈætməsfɪə', us: 'ˈætməsfɪr', def: 'n. 大气层' },
    oxygen: { uk: 'ˈɒksɪdʒən', us: 'ˈɑːksɪdʒən', def: 'n. 氧气' },
  }),
  'chapters.json': JSON.stringify([{ name: '测试', words: ['atmosphere', 'oxygen'] }]),
};

test.describe('3.0 外壳', () => {
  test('左侧导航 5 项，文案与顺序正确，深链选中态正确，三档断点宽度正确', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html`);
    await expect(page.locator('.sidenav .nav-item')).toHaveCount(5);
    expect(await page.locator('.sidenav .nav-item').allInnerTexts())
      .toEqual(['首页', '学习数据', '单词本', '随身听', '我的']);

    // 深链：#/stats 应把「学习数据」标成当前项
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await expect(page.locator('.sidenav .nav-item.on')).toHaveText('学习数据');

    // PRD §10.2 三档：≥1024 → 220px；701–1023 → 180px；≤700 → 底部 TabBar（通栏 fixed）
    const sidenav = page.locator('.sidenav');
    await page.setViewportSize({ width: 1024, height: 844 });
    expect(await sidenav.evaluate((el) => Math.round(el.getBoundingClientRect().width)),
      '1024px（桌面档）侧栏宽').toBe(220);
    await page.setViewportSize({ width: 800, height: 844 });
    expect(await sidenav.evaluate((el) => Math.round(el.getBoundingClientRect().width)),
      '800px（平板档）侧栏宽').toBe(180);
    await page.setViewportSize({ width: 390, height: 844 });
    const mobile = await sidenav.evaluate((el) => {
      const r = el.getBoundingClientRect();
      return {
        pos: getComputedStyle(el).position,
        left: Math.round(r.left),
        right: Math.round(r.right),
        vw: document.documentElement.clientWidth,
      };
    });
    expect(mobile.pos, '390px（手机档）应切到底部 TabBar（fixed）').toBe('fixed');
    expect([mobile.left, mobile.right], '390px 底栏应通栏').toEqual([0, mobile.vw]);
  });

  test('任务模式复原正文：#art 可见（Finding 2 回归锁）', async ({ page }) => {
    await stubData(page, TINY);
    await page.goto(`${rootUrl}/app/index.html`);
    // 等这一篇渲完（stub 数据就两句）
    await page.waitForFunction(() => document.querySelectorAll('#art .sent').length > 0);

    // 走真实入口进任务模式：有 plan + 排得出一句，enterTaskMode 才会挂 body.task-mode
    await page.evaluate(() => {
      if (!TASK.hasPlan) { TASK.resetV2(); TASK.initPlan(15); }
      TASK.enterTaskMode();
    });
    await expect(page.locator('body')).toHaveClass(/task-mode/);
    // 修 Finding 2 前：body > .layout{display:none} 压着 #art，这里会是 hidden
    await expect(page.locator('#art')).toBeVisible();
    await expect(page.locator('#art .sent').first()).toBeVisible();
  });
});
