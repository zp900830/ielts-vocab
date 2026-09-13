// Compiled from: tests/e2e/shadow/mobile-expand.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Mobile expand animation', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/mobile-expand.md',
    });

    await test.step('Setup 1: Set mobile viewport', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.setViewportSize({ width: 375, height: 812 });
      const innerW = await page.evaluate(() => window.innerWidth);
      expect(innerW).toBeLessThanOrEqual(700);
    });

    await test.step('Setup 2: Ensure collapsed state', async () => {
      await page.evaluate(() => {
        document.querySelector('.audiobar')?.classList.remove('expanded');
      });
      const hasExpanded = await page.evaluate(() =>
        document.querySelector('.audiobar')?.classList.contains('expanded'),
      );
      expect(hasExpanded).toBe(false);
    });
  });

  test(
    'expand and collapse on mobile',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Click expand button', async () => {
        // Click the .ab-expand button (not the audiobar itself)
        await page.locator('.ab-expand').click();
        const hasExpanded = await page.evaluate(() =>
          document.querySelector('.audiobar')?.classList.contains('expanded'),
        );
        expect(hasExpanded).toBe(true);
      });

      await test.step('Step 2: Blur locks at 16px', async () => {
        const blur = await page.evaluate(() => {
          const bar = document.querySelector('.audiobar') as HTMLElement;
          return bar ? getComputedStyle(bar).backdropFilter : '';
        });
        expect(blur).toContain('blur(16px)');
      });

      await test.step('Step 3: AB button not stretched', async () => {
        const flex = await page.evaluate(() => {
          const btn = document.getElementById('btnAB');
          return btn ? getComputedStyle(btn).flex : '';
        });
        expect(flex).toBe('none');
      });

      await test.step('Step 4: Click collapse button', async () => {
        await page.locator('.ab-collapse').click();
        await page.waitForTimeout(500);
        const hasExpanded = await page.evaluate(() =>
          document.querySelector('.audiobar')?.classList.contains('expanded'),
        );
        expect(hasExpanded).toBe(false);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Reset viewport', async () => {
      await page.setViewportSize({ width: 1280, height: 720 });
    }).catch(() => {});
  });
});
