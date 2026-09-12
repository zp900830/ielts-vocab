// Compiled from: tests/e2e/shadow/seek-drag.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (top-level `let`: page-scope visible, not window properties).
declare const idx: number;

test.describe('Seek drag jumps playback to the dropped sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/seek-drag.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      const box = await page.locator('#seekTrack').boundingBox();
      expect(box).not.toBeNull();
      expect(box!.width).toBeGreaterThan(0);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'drag release starts playback at target',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Drag to the middle and release', async () => {
        const box = (await page.locator('#seekTrack').boundingBox())!;
        const y = box.y + box.height / 2;
        await page.mouse.move(box.x + 2, y);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.5, y, { steps: 5 });
        await page.mouse.up();
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
        const at = await page.evaluate((): number => idx);
        expect(at).toBeGreaterThan(50);
        expect(at).toBeLessThan(300);
        const saved = await page.evaluate(() =>
          JSON.parse(localStorage.getItem('ielts-pos') || '{}'),
        );
        expect(saved.i).toBe(at);
      });

      await test.step('Step 2: Zero-width guard', async () => {
        const finite = await page.evaluate(() => {
          document.body.classList.add('scrolled');
          const w = window as unknown as {
            seekToEvent: (e: { clientX: number }) => number;
          };
          const r = w.seekToEvent({ clientX: 0 });
          document.body.classList.remove('scrolled');
          return Number.isFinite(r);
        });
        expect(finite).toBe(true);
      });
    },
  );

  // === After Hook (shared playing-state restore) ===
  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Stop playback', async () => {
      await page.evaluate(() => {
        const btn = document.getElementById('btnPlay');
        if (btn && btn.textContent && btn.textContent.includes('暂停')) {
          (window as unknown as { togglePlay: () => void }).togglePlay();
        }
      });
    }).catch(() => {});
  });
});
