import type { Page } from '@playwright/test';

// Setup/teardown helper (extracted 2026-09-30): the "remove a key and verify
// it is gone" sequence was inlined in 10+ specs across shadow/app3.
export async function clearLocalKey(page: Page, key: string): Promise<void> {
  await page.evaluate((k) => localStorage.removeItem(k), key);
  const left = await page.evaluate((k) => localStorage.getItem(k), key);
  if (left !== null) {
    throw new Error(`localStorage key "${key}" still set after clear: ${left}`);
  }
}
