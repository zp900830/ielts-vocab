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
  test('左侧导航 4 项 + 底部「我的」一行（分割线），文案与顺序正确，深链选中态正确，三档断点宽度正确', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html`);
    await expect(page.locator('.sidenav .nav-item')).toHaveCount(4);
    expect(await page.locator('.sidenav .nav-item').allInnerTexts())
      .toEqual(['首页', '随身听', '单词本', '学习数据']);
    // 「我的」不再是 nav-item，也不是卡片：一条分割线 + 一行（未登录显示「登录」按钮）
    await expect(page.locator('.sidenav .me-card')).toBeVisible();
    await expect(page.locator('.sidenav .me-card .me-login')).toHaveText('登录');

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

  /* refine2 ⑤（2026-09-25 用户）：侧栏原来是一块纯 #f6f6f4 实底，改成「往更白走一丢丢 +
     一道极清渐变」（顶 #fcfcfb → 底还是 #f6f6f4）；深色同步换暖黑渐变。用 background-color
     兜底 + background-image 叠渐变，这样深色仍能靠 background-color 与浅色区分（leftovers 的深色锁）。 */
  test('侧栏比原 #f6f6f4 更白 + 一道极轻渐变；深色同步不破', async ({ page }) => {
    await stubData(page, EMPTY);
    await page.goto(`${rootUrl}/app/index.html`);
    const nav = page.locator('.sidenav');
    await expect(nav).toBeVisible();

    const relLum = (rgb: number[]) => {
      const c = rgb.map((v) => { const x = v / 255; return x <= 0.03928 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4); });
      return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    };
    const stops = (img: string) => [...img.matchAll(/rgba?\((\d+),\s*(\d+),\s*(\d+)/g)]
      .map((m) => [Number(m[1]), Number(m[2]), Number(m[3])]);
    const f6 = relLum([0xf6, 0xf6, 0xf4]);

    const lightImg = await nav.evaluate((el) => getComputedStyle(el).backgroundImage);
    const lightBg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(lightImg, '侧栏应有一道渐变（不是纯色）').toContain('linear-gradient');
    const ls = stops(lightImg);
    expect(ls.length, '至少两个色标才算渐变').toBeGreaterThanOrEqual(2);
    expect(relLum(ls[0]), `侧栏最亮端（rgb ${ls[0]}）必须比原 #f6f6f4 更亮`).toBeGreaterThan(f6);
    expect(relLum(ls[ls.length - 1]), '渐变另一端不比原底色亮（读得出一道方向感）').toBeLessThanOrEqual(relLum(ls[0]));

    // 深色：底色换成暖黑（仍能和浅色区分），且同步给一道暖黑渐变
    await page.evaluate(() => document.body.classList.add('dark'));
    const darkImg = await nav.evaluate((el) => getComputedStyle(el).backgroundImage);
    const darkBg = await nav.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(darkBg, '深色侧栏底色必须换掉（不能还是 #f6f6f4）').not.toBe(lightBg);
    expect(darkImg, '深色侧栏也应有一道渐变').toContain('linear-gradient');
    expect(darkImg, '深色渐变不能停在浅色那套').not.toBe(lightImg);
    expect(relLum(stops(darkImg)[0]), '深色渐变最亮端也是暗的').toBeLessThan(0.1);
  });

  // 2026-09-25 用户：四个一级页面有的有大标题有的没有，切页上下跳 ——
  // 现在四页共用 .pg-title，文案对应路由，且都是可见标题（不再有 sr-only 特例）。
  test('四个一级页面都有同一样式的大标题（.pg-title），切页顶部高度不跳', async ({ page }) => {
    // 用 TINY + 建计划：stats 无计划时走「开始你的学习计划」空态（另一种设计，不带 pg-title）
    await stubData(page, TINY);
    await page.goto(`${rootUrl}/app/index.html`);
    await page.waitForFunction(() => document.querySelectorAll('#art .sent').length > 0);
    await page.evaluate(() => { if (!TASK.hasPlan) { TASK.resetV2(); TASK.initPlan(15); } });
    const cases: Array<[string, string]> = [
      ['home', '首页'], ['listen', '随身听'], ['words', '单词本'], ['stats', '学习数据'],
    ];
    let lastTop = -1, lastStyle = '';
    for (const [route, text] of cases) {
      await page.goto(`${rootUrl}/app/index.html#/${route}`);
      const h1 = page.locator('.pg-title');
      await expect(h1).toHaveText(text);
      await expect(h1).toBeVisible();
      const m = await h1.evaluate((el) => {
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return { top: r.top, fs: cs.fontSize, mt: cs.marginTop, mb: cs.marginBottom };
      });
      expect(m.fs, '同一字号').toBe('22px');
      if (lastStyle) {
        expect(m.mt, '同上边距 → 切页顶部不跳').toBe(lastStyle.split('|')[0]);
        expect(m.mb, '同下边距').toBe(lastStyle.split('|')[1]);
      }
      lastStyle = `${m.mt}|${m.mb}`;
      if (lastTop >= 0) expect(Math.abs(m.top - lastTop), '标题顶位一致（±1px）').toBeLessThan(1.5);
      lastTop = m.top;
    }
  });
});
