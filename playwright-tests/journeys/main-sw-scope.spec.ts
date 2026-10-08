/* `/app/` 的 Service Worker 作用域回归锁。
 *
 * 背景（2026-09-24）：主站与 /shadow/ 旧 SW 问题清理后（两站已下线），/app/ 仍必须：
 *   - controller 是 /app/sw.js（真实文件注册），不得被任何其它 SW 抢注；
 *   - 根作用域 /sw.js 已随旧主站删除 —— 若仓库根再出现 SW，会连 /app/ 一起接管
 *     （0915 P0#8「SW scope 污染同域其他项目」，docs/2026-09-18-产品整改清单.md:501）。
 *
 * 本锁：进 /app/ 后 controller 必须是 /app/sw.js。
 *
 * 服务器归 global-setup.ts（仓库根 8932），与其余 app3 用例一致用 E2E_ROOT_URL。
 */
import { test, expect } from '../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('app SW 作用域回归锁', () => {
  test('进 /app/：controller 必须是 /app/sw.js', async ({ page }) => {
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // /app/sw.js 会 clients.claim()，当前页应被它接管（条件等待，不 sleep）
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20000 });
    const scriptURL = await page.evaluate(
      () => (navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL) || '',
    );
    expect(scriptURL, '/app/ 的 controller 必须是 /app/sw.js').toMatch(/\/app\/sw\.js$/);
  });
});
