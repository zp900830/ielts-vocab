// Compiled from: tests/e2e/shadow/word-popup.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Word popup shows phonetics, meaning and example', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/word-popup.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.w').first()).toBeVisible();
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'word popup content and dismiss',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Open the popup', async () => {
        await page.locator('.w').first().click();
        await expect(page.locator('#pop')).toBeVisible();
        await expect(page.locator('#pw')).toHaveText('atmosphere');
        await expect(page.locator('#ppUK')).toContainText('/ˈætməsfɪə/');
        await expect(page.locator('#pm')).toHaveText('n. 大气；气氛；氛围');
      });

      await test.step('Step 2: Popup stays visible after scrolling down', async () => {
        await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
        const word = page.locator('.w').nth(50);
        const wordText = await word.textContent();
        await word.click();
        await expect(page.locator('#pop')).toBeVisible();
        await expect(page.locator('#pw')).toHaveText(wordText || '');
        const box = await page.locator('#pop').boundingBox();
        const vp = await page.viewportSize();
        expect(box).not.toBeNull();
        if (box && vp) {
          expect(box.y + box.height).toBeLessThanOrEqual(vp.height + 1);
          expect(box.x + box.width).toBeLessThanOrEqual(vp.width + 1);
        }
      });

      await test.step('Step 3: Dismiss the popup', async () => {
        await page.keyboard.press('Escape');
        await expect(page.locator('#pop')).toBeHidden();
      });
    },
  );
});
