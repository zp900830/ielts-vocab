import { test as base, expect } from '@playwright/test';

type TeardownFn = () => Promise<void>;

// registerTeardown: timeout-safe cleanup (runs even when the test times out,
// unlike test.afterEach). Register immediately after the confirmed creation step.
export const test = base.extend<{ registerTeardown: (fn: TeardownFn) => void }>({
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
