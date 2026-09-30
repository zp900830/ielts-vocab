// Compiled from: tests/e2e/shadow/silent-audio-alert.md
// Compiled at: 2026-09-30T12:00:00+08:00
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout, gotoApp } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';
import { clearLocalKey } from '../../utils/storage-helpers';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Silent engine raises the no-audio guidance alert and stops the chain', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/silent-audio-alert.md',
    });

    await test.step('Setup 0: Clear progress', async () => {
      await gotoApp(page, baseURL);
      await clearLocalKey(page, 'ielts-pos');
    });

    await test.step('Setup 1: Install the silent-engine stub', async () => {
      await gotoApp(page, baseURL);
      // The API object stays (HAS_SPEECH true) but never reports progress —
      // the exact engine-present-but-silent shape the watchdog handles.
      await page.evaluate(() => {
        const s = window.speechSynthesis;
        s.speak = () => {};
        s.cancel = () => {};
        s.pause = () => {};
        s.resume = () => {};
      });
      await expect(shadow.playButton(page)).toHaveText(/播放/);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'silent engine triggers one guidance alert; dismissal returns to idle with highlight kept',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      const dialogs: { type: string; message: string }[] = [];

      await test.step(
        'Step 1: Start playback in the silent environment',
        async () => {
          // Armed before the click; whatever appears is swallowed immediately.
          page.on('dialog', async (d) => {
            dialogs.push({ type: d.type(), message: d.message() });
            await d.dismiss();
          });
          await shadow.playButton(page).click();
          await expect(shadow.playButton(page)).toHaveText(/暂停/);
        },
      );

      await test.step(
        'Step 2: Wait for the guidance alert and capture it',
        async () => {
          // Observed ≈17s (two watchdog rounds per sentence, errStreak hits 3
          // on the third sentence); markdown allows up to 45s, currentTimeout
          // is the retry-aware cap for waits over 10s.
          await expect
            .poll(() => dialogs.length, { timeout: currentTimeout() })
            .toBeGreaterThan(0);
          expect(dialogs).toHaveLength(1);
          expect(dialogs[0].type).toBe('alert');
          expect(dialogs[0].message).toMatch(/^本机语音引擎无响应/);
        },
      );

      await test.step(
        'Step 3: After dismissal the app is idle, not spinning',
        async () => {
          await expect(shadow.playButton(page)).toHaveText(/播放/);
          await expect(shadow.playingSentence(page)).toBeVisible();
          expect(dialogs).toHaveLength(1);
        },
      );
    },
  );

  // === After Hook (from markdown ## After Hook) ===
  test.afterEach(async ({ page }) => {
    await test
      .step('Teardown 1: Clear progress', async () => {
        await clearLocalKey(page, 'ielts-pos');
      })
      .catch(() => {});
  });
});
