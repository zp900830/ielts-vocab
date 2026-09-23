// 3.0 M1 Task 2：/app/ 外壳（左侧导航 5 项 + hash 路由）。
// 服务器归 global-setup.ts 起停（根目录 8932）；8931 那台服务的是 shadow/ 树，
// 而 /app/ 在仓库根，所以这里和 smoke.spec.ts 一样用 E2E_ROOT_URL，不走 baseURL。
import { test, expect } from '../../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('3.0 外壳', () => {
  test('左侧导航 5 项，文案与顺序正确，深链选中态正确', async ({ page }) => {
    /* 外壳是静态 HTML + app.js 路由，不依赖课文数据。这里把三份重 JSON 换成空壳：
       既让这条用例只测外壳（不让整套再多一页 1833 句 + 3242 词的重渲染 ——
       实测那份额外负载会把整套里时序敏感的 shadow 用例压出偶发红），
       又不产生数据加载错误、应用照常启动。三份数据「接没接对」由
       scripts/build_site.mjs 的白名单自检守着（引用缺失会直接 BUILD FAILED）。 */
    const EMPTY: Record<string, string> = {
      'sections.json': '[]',
      'vocab.json': '{}',
      'chapters.json': '[]',
    };
    for (const [name, body] of Object.entries(EMPTY)) {
      await page.route(`**/shadow/data/${name}*`, (r) =>
        r.fulfill({ status: 200, contentType: 'application/json', body }),
      );
    }

    await page.goto(`${rootUrl}/app/index.html`);
    await expect(page.locator('.sidenav .nav-item')).toHaveCount(5);
    expect(await page.locator('.sidenav .nav-item').allInnerTexts())
      .toEqual(['首页', '学习数据', '单词本', '随身听', '我的']);

    // 深链：#/stats 应把「学习数据」标成当前项
    await page.goto(`${rootUrl}/app/index.html#/stats`);
    await expect(page.locator('.sidenav .nav-item.on')).toHaveText('学习数据');
  });
});
