// Compiled from: tests/e2e/shadow/loop-mode.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (top-level `let`: page-scope visible, not window properties).
declare const idx: number;
declare const loopCurrent: number;

test.describe('Single-sentence loop repeats then advances', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/loop-mode.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'loop repeats sentence and switches off',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Enable loop and play', async () => {
        await page.locator('#btnLoop').click();
        await page.getByRole('button', { name: '3遍' }).click();
        await expect(page.locator('#btnLoop')).toHaveClass(/loop-active/);
        await expect(page.locator('#loopCount')).toHaveText('3');
        await page.evaluate(() => {
          (window as unknown as { playFrom: (i: number) => void }).playFrom(10);
        });
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 2: Sentence repeats', async () => {
        // Atomic conjunction: repetition must be OBSERVED at sentence 10
        // (two separate reads race with the advance to 11)
        await expect
          .poll(
            async () =>
              page.evaluate((): boolean => loopCurrent > 0 && idx === 10),
            { timeout: currentTimeout() },
          )
          .toBe(true);
      });

      await test.step('Step 3: Switch loop off', async () => {
        await page.evaluate(() => {
          (
            window as unknown as { setLoopCount: (n: number) => void }
          ).setLoopCount(0);
        });
        await expect(page.locator('#btnLoop')).not.toHaveClass(/loop-active/);
      });
    },
  );

  // === After Hook (shared playing-state restore) ===
  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Stop playback and disable loop', async () => {
      await page.evaluate(() => {
        const w = window as unknown as {
          togglePlay: () => void;
          setLoopCount: (n: number) => void;
        };
        const btn = document.getElementById('btnPlay');
        if (btn && btn.textContent && btn.textContent.includes('暂停')) w.togglePlay();
        w.setLoopCount(0);
      });
    }).catch(() => {});
  });
});
