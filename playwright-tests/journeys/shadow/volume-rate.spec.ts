// Compiled from: tests/e2e/shadow/volume-rate.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Playback rate menu selection', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/volume-rate.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('#rateCycle')).toBeVisible();
      await expect(page.locator('#rateCycle')).toHaveText('1x');
    });
  });

  test(
    'rate menu opens, selection persists',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Open rate menu', async () => {
        await page.click('#rateCycle');
        const menu = page.locator('.rate-menu');
        await expect(menu).toBeVisible();
      });

      await test.step('Step 2: Select 1.5x rate', async () => {
        await page.click('.rate-menu button[data-mrate="1.5"]');
        await expect(page.locator('#rateCycle')).toHaveText('1.5x');
        const isActive = await page.evaluate(() => {
          const btn = document.querySelector('.rate-menu button[data-mrate="1.5"]');
          return btn?.classList.contains('active') ?? false;
        });
        expect(isActive).toBe(true);
        const isOldActive = await page.evaluate(() => {
          const btn = document.querySelector('.rate-menu button[data-mrate="1"]');
          return btn?.classList.contains('active') ?? false;
        });
        expect(isOldActive).toBe(false);
      });

      await test.step('Step 3: Rate persists after menu close', async () => {
        // Click outside to close menu
        await page.click('article', { position: { x: 10, y: 10 } });
        await page.waitForTimeout(300);
        await expect(page.locator('#rateCycle')).toHaveText('1.5x');
      });

      await test.step('Step 4: Reopen and verify persistence', async () => {
        await page.click('#rateCycle');
        const isActive = await page.evaluate(() => {
          const btn = document.querySelector('.rate-menu button[data-mrate="1.5"]');
          return btn?.classList.contains('active') ?? false;
        });
        expect(isActive).toBe(true);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Reset rate to 1x', async () => {
      await page.evaluate(() => {
        const btn = document.querySelector('.rate-menu button[data-mrate="1"]') as HTMLButtonElement;
        if (btn) btn.click();
      });
      await expect(page.locator('#rateCycle')).toHaveText('1x');
    }).catch(() => {});
  });
});
