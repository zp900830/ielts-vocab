import { test as base, expect } from '@playwright/test';

type TeardownFn = () => Promise<void>;

// registerTeardown: timeout-safe cleanup (runs even when the test times out,
// unlike test.afterEach). Register immediately after the confirmed creation step.
export const test = base.extend<{ registerTeardown: (fn: TeardownFn) => void; e2eAuth: void }>({
  // E2E 登录后门：主站未登录锁文章/数据/单词本（2026-09-30），测试一律视为已登录。
  // 生产环境 window.__e2eAuthBypass 永远为空，门禁不受影响。
  e2eAuth: [async ({ page }, use) => {
    await page.addInitScript(() => { (window as unknown as { __e2eAuthBypass: boolean }).__e2eAuthBypass = true; });
    await use();
  }, { auto: true }],
  registerTeardown: async ({}, use) => {
    const fns: TeardownFn[] = [];
    await use((fn: TeardownFn) => {
      fns.push(fn);
    });
    for (const fn of fns.reverse()) {
      try {
        await fn();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('teardown warning:', String(e));
      }
    }
  },
});

export { expect };
