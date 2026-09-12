// Compiled from: tests/e2e/shadow/playback-resume.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (top-level `let` in a classic script: visible in page scope,
// NOT as window properties — never read them via `window.idx`).
declare const idx: number;
declare const sents: HTMLElement[];

test.describe('Playback resumes from saved position after reload', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/playback-resume.md',
    });

    await test.step('Setup 1: Save a known position', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.evaluate(() => {
        (
          window as unknown as { playFrom: (i: number) => void; togglePlay: () => void }
        ).playFrom(50);
        (
          window as unknown as { togglePlay: () => void }
        ).togglePlay();
      });
      const saved = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('ielts-pos') || '{}'),
      );
      expect(saved.i).toBe(50);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'reload restores position without autoplay',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Reload the page', async () => {
        await page.reload();
        await expect
          .poll(async () => page.evaluate((): number => idx), {
            timeout: currentTimeout(),
          })
          .toBe(50);
        await expect
          .poll(
            async () =>
              page.evaluate(() => {
                const r = sents[idx].getBoundingClientRect();
                return r.top >= 0 && r.bottom <= window.innerHeight;
              }),
            { timeout: currentTimeout() },
          )
          .toBe(true);
        await expect(shadow.progressLabel(page)).toContainText('第1章');
      });

      await test.step('Step 2: No autoplay after reload', async () => {
        await expect(shadow.playButton(page)).toHaveText(/播放/, {
          timeout: currentTimeout(),
        });
      });
    },
  );
});
