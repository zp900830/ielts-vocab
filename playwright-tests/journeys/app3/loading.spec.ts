// refine3 ⑦（2026-09-25 用户：「"正在载入"这个 loading 动画，根据产品调性找个好点的动画加上」）：
// 一级页 #appView 的「正在载入…」占位与启动屏 #art 的「正在加载学习数据…」统一改用项目自己的
// 薄荷绿三点轻脉冲（.ld-dots，纯 CSS，见 index.html 的 @keyframes ielDot），不引第三方库；
// prefers-reduced-motion 下压掉动画只留静点；占位带 role=status 让读屏知道在加载。
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('refine3 ⑦ 载入动画（薄荷绿三点脉冲）', () => {
  test('占位是薄荷绿三点脉冲；启动屏同套；reduced-motion 下降级为静态', async ({ page }) => {
    // 数据请求一直挂起 → 页面停在「正在载入…」，不靠加载速度抢时机
    for (const name of ['sections.json', 'vocab.json', 'chapters.json']) {
      await page.route(`**/shadow/data/${name}*`, () => { /* never fulfil: keep it pending */ });
    }
    await page.goto(`${rootUrl}/app/index.html#/home`);

    const ld = page.locator('#appView .iel-loading');
    await expect(ld).toBeVisible();
    await expect(ld, '读屏要能听见').toHaveAttribute('role', 'status');
    await expect(ld.locator('.ld-dots i')).toHaveCount(3);
    const anim = await ld.locator('.ld-dots i').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim, '薄荷绿点用项目自己的 ielDot，不是通用 spinner').toBe('ielDot');
    const dotBg = await ld.locator('.ld-dots i').first().evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(dotBg, '点用品牌薄荷绿 --accent').toBe('rgb(12, 156, 116)');

    // 启动屏（#art 的 .boot）也换成同一套点，不再有旧的 .boot-spin
    expect(await page.evaluate(() => document.querySelectorAll('#art .boot .ld-dots i').length), '启动屏三点').toBe(3);
    expect(await page.locator('.boot-spin').count(), '旧 spinner 已移除').toBe(0);

    // reduced-motion：动画压掉，只留静态点（不闪）
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const anim2 = await ld.locator('.ld-dots i').first().evaluate((el) => getComputedStyle(el).animationName);
    expect(anim2, 'reduced-motion 下不转').toBe('none');
  });
});

/* 2026-09-26 用户：「页面加载动效，置于页面中间」——占位整块（小精灵 + 文案）必须水平垂直居中，
   不再是顶左的一条提示。 */
test.describe('载入动效居中', () => {
  test('占位块在内容区中央：纵向占大半屏、小精灵与文字都居中', async ({ page }) => {
    for (const name of ['sections.json', 'vocab.json', 'chapters.json']) {
      await page.route(`**/shadow/data/${name}*`, () => { /* 挂起请求，停在加载态 */ });
    }
    await page.goto(`${rootUrl}/app/index.html#/home`);
    const ld = page.locator('#appView .iel-loading');
    await expect(ld).toBeVisible();
    const m = await ld.evaluate((el) => {
      const cs = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const buddy = el.querySelector('.ld-buddy')!.getBoundingClientRect();
      return {
        dir: cs.flexDirection, align: cs.alignItems, justify: cs.justifyContent,
        h: Math.round(r.height), viewH: window.innerHeight,
        buddyCenter: Math.round(buddy.left + buddy.width / 2),
        loaderCenter: Math.round(r.left + r.width / 2),
      };
    });
    expect(m.dir, '纵向排布（小精灵在上、文字在下）').toBe('column');
    expect(m.align, '横向居中').toBe('center');
    expect(m.justify, '纵向居中').toBe('center');
    expect(m.h, '占位块要占大半屏，视觉上才是"在页面中间"').toBeGreaterThan(m.viewH * 0.4);
    expect(Math.abs(m.buddyCenter - m.loaderCenter), '小精灵水平居中（±2px）').toBeLessThan(2);
  });
});
