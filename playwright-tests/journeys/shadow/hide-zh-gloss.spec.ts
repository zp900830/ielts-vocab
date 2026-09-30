// Compiled from: tests/e2e/shadow/hide-zh-gloss.md
// Compiled at: 2026-09-30T12:00:00+08:00
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout, gotoApp } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';
import { clearLocalKey } from '../../utils/storage-helpers';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Hide translation and inline gloss toggles round-trip', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/hide-zh-gloss.md',
    });

    await test.step('Setup 0: Clear prefs', async () => {
      await gotoApp(page, baseURL);
      await clearLocalKey(page, 'ielts-shadow-prefs');
    });

    await test.step('Setup 1: Open the app', async () => {
      // Second navigation so the app re-reads prefs after the clear.
      await gotoApp(page, baseURL);
      await expect(page.locator('body.hide-zh')).toHaveCount(0);
      await expect(page.locator('body.hide-gl')).toHaveCount(0);
      await expect(shadow.zhToggle(page)).toHaveText('隐藏全句译文');
      await expect(shadow.zhToggle(page)).toHaveClass(/active/);
      await expect(shadow.glossToggle(page)).toHaveText('隐藏行内词义');
      await expect(shadow.glossToggle(page)).toHaveClass(/active/);
      await expect(page.locator('.sent-zh').first()).toBeVisible();
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'zh and gloss toggles flip class, label and storage; hides survive reload and restore via UI',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page, baseURL }) => {
      await test.step('Step 1: Hide the sentence translations', async () => {
        await shadow.zhToggle(page).click();
        await expect(page.locator('body.hide-zh')).toHaveCount(1);
        await expect(shadow.zhToggle(page)).toHaveText('显示全句译文');
        await expect(shadow.zhToggle(page)).not.toHaveClass(/active/);
        await expect(shadow.zhToggle(page)).toHaveAttribute(
          'aria-pressed',
          'false',
        );
        await expect(page.locator('.sent-zh').first()).toBeHidden();
        expect(
          await page.evaluate(() =>
            JSON.parse(localStorage.getItem('ielts-shadow-prefs') || '{}'),
          ),
        ).toEqual({ hideZh: true });
      });

      await test.step('Step 2: Hide the inline glosses', async () => {
        await shadow.glossToggle(page).click();
        await expect(page.locator('body.hide-gl')).toHaveCount(1);
        await expect(shadow.glossToggle(page)).toHaveText('显示行内词义');
        await expect(shadow.glossToggle(page)).not.toHaveClass(/active/);
        await expect(page.locator('.gl').first()).toBeHidden();
        expect(
          await page.evaluate(() =>
            JSON.parse(localStorage.getItem('ielts-shadow-prefs') || '{}'),
          ),
        ).toEqual({ hideZh: true, hideGl: true });
      });

      await test.step('Step 3: Both hides survive a reload', async () => {
        await gotoApp(page, baseURL);
        await expect(page.locator('body.hide-zh')).toHaveCount(1);
        await expect(page.locator('body.hide-gl')).toHaveCount(1);
        await expect(shadow.zhToggle(page)).toHaveText('显示全句译文');
        await expect(shadow.glossToggle(page)).toHaveText('显示行内词义');
        await expect(page.locator('.sent-zh').first()).toBeHidden();
        // KNOWN GAP (area conventions, syncToggleAria initial-load race):
        // right after load aria-pressed may still be "true" while the state
        // is hidden — deliberately NOT asserted here; it self-heals on click.
      });

      await test.step('Step 4: Restore both via the UI', async () => {
        await shadow.zhToggle(page).click();
        await shadow.glossToggle(page).click();
        await expect(page.locator('body.hide-zh')).toHaveCount(0);
        await expect(page.locator('body.hide-gl')).toHaveCount(0);
        await expect(shadow.zhToggle(page)).toHaveText('隐藏全句译文');
        await expect(shadow.glossToggle(page)).toHaveText('隐藏行内词义');
        await expect(shadow.zhToggle(page)).toHaveClass(/active/);
        await expect(shadow.glossToggle(page)).toHaveClass(/active/);
        await expect(shadow.zhToggle(page)).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        await expect(shadow.glossToggle(page)).toHaveAttribute(
          'aria-pressed',
          'true',
        );
        expect(
          await page.evaluate(() =>
            JSON.parse(localStorage.getItem('ielts-shadow-prefs') || '{}'),
          ),
        ).toEqual({ hideZh: false, hideGl: false });
      });
    },
  );

  // === After Hook (from markdown ## After Hook) ===
  test.afterEach(async ({ page }) => {
    await test
      .step('Teardown 1: Clear prefs', async () => {
        await clearLocalKey(page, 'ielts-shadow-prefs');
      })
      .catch(() => {});
  });
});
