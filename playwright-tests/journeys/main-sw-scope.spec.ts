/* 主站（根路径）的 Service Worker 作用域回归锁。
 *
 * 背景（2026-09-24）：旧 blob 内联 SW 在 Chromium 里注册不了；2026-10-08 站点迁到仓库根后，
 * SW 就是 /sw.js、scope '/'（/admin/ 与数据 JSON 放行）。主站必须：
 *   - controller 是 /sw.js（真实文件注册），不得被任何其它 SW 抢注。
 *
 * 本锁：进站点后 controller 必须是 /sw.js。
 *
 * 服务器归 global-setup.ts（仓库根 8932），与其余 app3 用例一致用 E2E_ROOT_URL。
 */
import { test, expect } from '../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('app SW 作用域回归锁', () => {
  test('进主站：controller 必须是 /sw.js', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html#/home`);
    // /sw.js 会 clients.claim()，当前页应被它接管（条件等待，不 sleep）
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20000 });
    const scriptURL = await page.evaluate(
      () => (navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL) || '',
    );
    expect(scriptURL, '主站的 controller 必须是 /sw.js').toMatch(/\/sw\.js$/);
  });
});
