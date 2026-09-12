// Compiled from: tests/e2e/shadow/playback-chain.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Playback chain advances sentence by sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/playback-chain.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.getByRole('heading', { name: /雅思词汇/ }).first()).toBeVisible();
      await expect
        .poll(async () => page.locator('.sent').count(), { timeout: currentTimeout() })
        .toBe(1809);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'playback advances with highlight and autosave',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Start playback', async () => {
        await shadow.playButton(page).click();
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 2: Chain advances', async () => {
        const first = await shadow.playingSentence(page).first().textContent();
        await expect
          .poll(async () => shadow.playingSentence(page).first().textContent(), {
            timeout: currentTimeout(),
          })
          .not.toBe(first);
      });

      await test.step('Step 3: Progress auto-saves', async () => {
        const pos = await page.evaluate(() => localStorage.getItem('ielts-pos'));
        expect(pos).not.toBeNull();
        expect(JSON.parse(pos as string).i).toBeGreaterThanOrEqual(0);
      });

      await test.step('Step 4: Pause', async () => {
        await shadow.playButton(page).click();
        await expect(shadow.playButton(page)).toHaveText(/播放/, {
          timeout: currentTimeout(),
        });
      });
    },
  );
});
