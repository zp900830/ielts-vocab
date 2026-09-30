// Compiled from: tests/e2e/shadow/dark-mode.md
// Compiled at: 2026-09-30T12:00:00+08:00
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout, gotoApp } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';
import { clearLocalKey } from '../../utils/storage-helpers';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Dark mode toggle round-trip and persistence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/dark-mode.md',
    });

    await test.step('Setup 0: Clear dark-mode key', async () => {
      await gotoApp(page, baseURL);
      await clearLocalKey(page, 'ielts-dark');
    });

    await test.step('Setup 1: Open the app', async () => {
      // Second navigation: if the key was present on the first load, the app
      // booted dark — only a fresh load proves the clean-default state.
      await gotoApp(page, baseURL);
      await expect(page.locator('body.dark')).toHaveCount(0);
      await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
        'content',
        '#faf8f4',
      );
      await expect(shadow.darkButton(page).locator('i')).toHaveClass(
        /ri-moon-line/,
      );
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'dark toggle flips class, theme-color, icon and storage; on-state survives reload',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page, baseURL }) => {
      await test.step('Step 1: Turn dark mode on', async () => {
        await shadow.darkButton(page).click();
        await expect(page.locator('body.dark')).toHaveCount(1);
        await expect(page.locator('html.dark')).toHaveCount(1);
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
          'content',
          '#1c1a17',
        );
        await expect(shadow.darkButton(page).locator('i')).toHaveClass(
          /ri-sun-line/,
        );
        expect(
          await page.evaluate(() => localStorage.getItem('ielts-dark')),
        ).toBe('1');
      });

      await test.step('Step 2: Dark mode survives a reload', async () => {
        await gotoApp(page, baseURL);
        await expect(page.locator('body.dark')).toHaveCount(1);
        await expect(shadow.darkButton(page).locator('i')).toHaveClass(
          /ri-sun-line/,
        );
        expect(
          await page.evaluate(() => localStorage.getItem('ielts-dark')),
        ).toBe('1');
      });

      await test.step('Step 3: Turn dark mode back off', async () => {
        await shadow.darkButton(page).click();
        await expect(page.locator('body.dark')).toHaveCount(0);
        await expect(page.locator('html.dark')).toHaveCount(0);
        await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute(
          'content',
          '#faf8f4',
        );
        await expect(shadow.darkButton(page).locator('i')).toHaveClass(
          /ri-moon-line/,
        );
        expect(
          await page.evaluate(() => localStorage.getItem('ielts-dark')),
        ).toBe('0');
      });
    },
  );

  // === After Hook (from markdown ## After Hook) ===
  test.afterEach(async ({ page }) => {
    await test
      .step('Teardown 1: Remove dark-mode key', async () => {
        await clearLocalKey(page, 'ielts-dark');
      })
      .catch(() => {});
  });
});
