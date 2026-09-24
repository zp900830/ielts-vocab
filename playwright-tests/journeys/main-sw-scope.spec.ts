/* 主站 `/` 的 Service Worker 作用域回归锁（2026-09-24）。
 *
 * 背景：主站 index.html 曾在仓库根注册一个 blob-URL 形式的 SW（scope '/'）。
 *   ① 规范禁止 blob: 注册 SW —— Chromium 直接拒绝，从未真正注册，离线兜底是死代码；
 *   ② 一旦被「修」成真实文件 /sw.js，作用域必然是 '/'，会连 /shadow/ 与 /app/ 一起接管
 *      —— 正是 0915 P0#8「SW scope 污染同域其他项目」（docs/2026-09-18-产品整改清单.md:501）。
 *   用户拍板：主站无离线价值 → 整段删除，而不是造新 SW（收窄 scope 需 Service-Worker-Allowed
 *   响应头，EdgeOne 不支持）。
 *
 * 本组锁（主站作用域必须「不外溢」）：
 *   A. 主站启动时不再尝试注册任何 SW —— 旧代码会 register(blob,{scope:'/'})，这是本组唯一
 *      能在 stash 旧代码时变红的信号（blob 从未注册成功，所以只查 controller 区分不出）。
 *   B. 先访问 `/` 再进 `/shadow/`：/shadow/ 不许被任何 SW 接管（controller 必须 null）。
 *   C. 先访问 `/` 再进 `/app/`：/app/ 的 controller 必须是 /app/sw.js，绝不能被主站 SW 抢。
 *
 * 服务器归 global-setup.ts（仓库根 8932），与其余主站/ app3 用例一致用 E2E_ROOT_URL。
 */
import { test, expect } from '../fixtures';

const rootUrl = process.env.E2E_ROOT_URL || '';

test.describe('主站 SW 作用域回归锁', () => {
  test('A · 主站 /index.html 启动时不再注册 Service Worker（旧根作用域 blob SW 已删）', async ({ page }) => {
    // 注册在启动时发生，来不及在页面里 stub —— 用 addInitScript 在页面脚本前把 register 换掉
    await page.addInitScript(() => {
      (window as unknown as { __swCalls: unknown[] }).__swCalls = [];
      const fake = {
        register(url: string, opts?: { scope?: string }) {
          (window as unknown as { __swCalls: unknown[] }).__swCalls.push({ url: String(url), scope: opts && opts.scope });
          return Promise.resolve({ scope: (opts && opts.scope) || '/' });
        },
      };
      Object.defineProperty(navigator, 'serviceWorker', { value: fake, configurable: true });
    });
    await page.goto(`${rootUrl}/index.html`);
    // 等主站脚本真的跑过初始化（注册若存在必然已发生）
    await expect(page.locator('#darkBtn')).toBeVisible();
    const calls = await page.evaluate(
      () => (window as unknown as { __swCalls: { url: string; scope?: string }[] }).__swCalls,
    );
    expect(calls, '主站不许再注册 Service Worker：根作用域会接管 /shadow/ 与 /app/').toEqual([]);
  });

  test('B · 先访问 / 再进 /shadow/：/shadow/ 不被任何 SW 接管（无 SW 就该是 null）', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html`);
    await expect(page.locator('#darkBtn')).toBeVisible();
    await page.goto(`${rootUrl}/shadow/index.html`);
    await page.waitForLoadState('load');
    const info = await page.evaluate(async () => {
      let scope = '';
      try {
        const reg = await navigator.serviceWorker.getRegistration();
        scope = (reg && reg.scope) || '';
      } catch (e) { /* ignore */ }
      return {
        hasController: !!navigator.serviceWorker.controller,
        scriptURL: (navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL) || '',
        regScope: scope,
      };
    });
    expect(info.hasController, '/shadow/ 不应被任何 SW 接管（主站 SW 不得越界）').toBe(false);
    expect(info.regScope, '/shadow/ 不应有自己的 SW 注册').toBe('');
  });

  test('C · 先访问 / 再进 /app/：controller 必须是 /app/sw.js，不是主站 SW', async ({ page }) => {
    await page.goto(`${rootUrl}/index.html`);
    await expect(page.locator('#darkBtn')).toBeVisible();
    await page.goto(`${rootUrl}/app/index.html#/home`);
    // /app/sw.js 会 clients.claim()，当前页应被它接管（条件等待，不 sleep）
    await page.waitForFunction(() => !!navigator.serviceWorker.controller, undefined, { timeout: 20000 });
    const scriptURL = await page.evaluate(
      () => (navigator.serviceWorker.controller && navigator.serviceWorker.controller.scriptURL) || '',
    );
    expect(scriptURL, '/app/ 的 controller 必须是 /app/sw.js').toMatch(/\/app\/sw\.js$/);
  });
});
