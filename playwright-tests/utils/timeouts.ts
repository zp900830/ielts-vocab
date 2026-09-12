import { test as baseTest, type Locator, type Page } from '@playwright/test';

// Retry-aware timeout tiers: 2 min initial, 3 min first retry, 4 min after.
export function currentTimeout(): number {
  const retry = (baseTest.info()?.retry ?? 0) as number;
  if (retry <= 0) return 120000;
  if (retry === 1) return 180000;
  return 240000;
}

// Poll visibility with the retry-aware cap; fail fast on network idle.
export async function smartWaitFor(locator: Locator): Promise<void> {
  await locator.waitFor({ state: 'visible', timeout: currentTimeout() }).catch(async () => {
    await locator.page().waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
    await locator.waitFor({ state: 'visible', timeout: currentTimeout() });
  });
}

export async function smartScrollIntoView(locator: Locator): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await locator.scrollIntoViewIfNeeded({ timeout: 10000 }).catch(() => {});
    if (await locator.isVisible().catch(() => false)) return;
  }
  await locator.scrollIntoViewIfNeeded();
}

export async function gotoApp(page: Page, baseURL: string | undefined): Promise<void> {
  await page.goto(`${baseURL || 'http://localhost:8931'}/index.html`);
}
