// Compiled from: tests/e2e/shadow/jump-dialog.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Jump dialog lists chapters and jumps to a sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/jump-dialog.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'jump dialog options and jump',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Open the jump dialog', async () => {
        await page.locator('#abTitle').click();
        await expect(page.locator('#jumpCh option')).toHaveCount(6);
        await expect(page.locator('#jumpHint')).toContainText('第1章共 336 句');
      });

      await test.step('Step 2: Jump to chapter 1 sentence 1', async () => {
        await page.locator('#jumpCh').selectOption('0');
        await page.getByRole('spinbutton').fill('1');
        await page.getByRole('button', { name: '直达' }).click();
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });
    },
  );

  // === After Hook (shared playing-state restore) ===
  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Stop playback', async () => {
      await page.evaluate(() => {
        const w = window as unknown as { togglePlay?: () => void };
        if (typeof w.togglePlay === 'function') {
          const btn = document.getElementById('btnPlay');
          if (btn && btn.textContent && btn.textContent.includes('暂停')) w.togglePlay();
        }
      });
    }).catch(() => {});
  });
});
