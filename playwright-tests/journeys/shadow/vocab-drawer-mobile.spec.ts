// Compiled from: tests/e2e/shadow/vocab-drawer-mobile.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Vocab drawer on mobile', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/vocab-drawer-mobile.md',
    });

    await test.step('Setup 1: Set mobile viewport', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.setViewportSize({ width: 375, height: 812 });
      const innerW = await page.evaluate(() => window.innerWidth);
      expect(innerW).toBeLessThanOrEqual(700);
    });
  });

  test(
    'vocab drawer opens and closes',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Edge tab opens vocab panel', async () => {
        await page.getByRole('button', { name: '词库' }).click();
        const hasPanelOpen = await page.evaluate(() => {
          const layout = document.querySelector('.layout');
          return layout ? layout.classList.contains('panel-open') : false;
        });
        expect(hasPanelOpen).toBe(true);
      });

      await test.step('Step 2: Panel is visible with search input', async () => {
        await expect(page.locator('#panel')).toBeVisible();
        await expect(page.locator('#q')).toBeVisible();
      });

      await test.step('Step 3: Search input has placeholder', async () => {
        const placeholder = await page.locator('#q').getAttribute('placeholder');
        expect(placeholder).toBeTruthy();
      });

      await test.step('Step 4: Click edgeTab again closes panel', async () => {
        await page.getByRole('button', { name: '词库' }).click({ timeout: 5000 }).catch(async () => {
          // edgeTab might be hidden when panel is open; try clicking the ✕ close button
          await page.locator('#panel .x').click();
        });
        await page.waitForTimeout(500);
        const hasPanelOpen = await page.evaluate(() => {
          const layout = document.querySelector('.layout');
          return layout ? layout.classList.contains('panel-open') : false;
        });
        expect(hasPanelOpen).toBe(false);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 }).catch(() => {});
  });
});
