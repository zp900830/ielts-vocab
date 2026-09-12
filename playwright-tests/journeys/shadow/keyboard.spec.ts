// Compiled from: tests/e2e/shadow/keyboard.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Keyboard shortcuts control playback and dismiss popups', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/keyboard.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(shadow.playButton(page)).toHaveText(/播放/, {
        timeout: currentTimeout(),
      });
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'space arrows and escape',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Space toggles playback', async () => {
        await page.keyboard.press('Space');
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
        await page.keyboard.press('Space');
        await expect(shadow.playButton(page)).toHaveText(/播放/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 2: Arrows step sentences', async () => {
        await page.keyboard.press('ArrowRight');
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 3: Escape dismisses popups', async () => {
        await page.locator('#abTitle').click();
        await expect(page.locator('#jumpPop')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.locator('#jumpPop')).toBeHidden();
      });
    },
  );

  // === After Hook (shared playing-state restore) ===
  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Stop playback', async () => {
      await page.evaluate(() => {
        const btn = document.getElementById('btnPlay');
        if (btn && btn.textContent && btn.textContent.includes('暂停')) {
          (
            window as unknown as { togglePlay: () => void }
          ).togglePlay();
        }
      });
    }).catch(() => {});
  });
});
