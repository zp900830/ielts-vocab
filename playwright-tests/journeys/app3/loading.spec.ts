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
