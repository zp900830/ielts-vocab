// Compiled from: tests/e2e/shadow/bookmark-sync.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const getMarks: () => { i: number; u?: number }[];
declare const addMark: () => void;
declare const delMark: (i: number) => void;
declare const abCancel: (silent?: boolean) => void;
declare const CLOUD: { _on: boolean };

test.describe('Bookmark cloud sync: pull, push, and merge', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/bookmark-sync.md',
    });

    await test.step('Setup 1: Clear local bookmarks', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.evaluate(() => localStorage.removeItem('ielts-marks'));
      expect(await page.evaluate(() => getMarks().length)).toBe(0);
    });

    await test.step('Setup 2: Mock Supabase for offline testing', async () => {
      await page.evaluate(() => { CLOUD._on = false; });
      expect(await page.evaluate(() => CLOUD._on)).toBe(false);
    });
  });

  test(
    'bookmark local persistence and dedup',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Add bookmark when not logged in', async () => {
        await page.evaluate(() => {
          const w = window as unknown as { addMark: (i?: number) => void };
          w.addMark();
        });
        const marks = await page.evaluate(() => getMarks());
        expect(marks.length).toBe(1);
        expect(marks[0].i).toBeGreaterThanOrEqual(0);
      });

      await test.step('Step 2: Add duplicate bookmark', async () => {
        const idxBefore = await page.evaluate(() => getMarks()[0].i);
        await page.evaluate(() => {
          const w = window as unknown as { addMark: (i?: number) => void };
          w.addMark();
        });
        const marks = await page.evaluate(() => getMarks());
        expect(marks.length).toBe(1);
        expect(marks[0].i).toBe(idxBefore);
      });

      await test.step('Step 3: Add second bookmark', async () => {
        await page.evaluate(() => {
          const w = window as unknown as { addMark: (i?: number) => void };
          // Add at a different position
          const sents = document.querySelectorAll('.sent');
          if (sents.length > 50) {
            (sents[50] as HTMLElement).click();
          }
        });
        // Wait for any play to advance, then add
        await page.waitForTimeout(500);
        await page.evaluate(() => {
          const w = window as unknown as { addMark: () => void };
          w.addMark();
        });
        const marks = await page.evaluate(() => getMarks());
        expect(marks.length).toBeGreaterThanOrEqual(2);
      });

      await test.step('Step 4: Local persistence across reload', async () => {
        const countBefore = await page.evaluate(() => getMarks().length);
        await page.reload();
        await page.evaluate(() => { CLOUD._on = false; });
        await expect(page.locator('.sent').first()).toBeVisible();
        const countAfter = await page.evaluate(() => getMarks().length);
        expect(countAfter).toBe(countBefore);
      });

      await test.step('Step 5: Delete bookmark persists', async () => {
        const firstIdx = await page.evaluate(() => getMarks()[0].i);
        await page.evaluate((i: number) => delMark(i), firstIdx);
        const marks = await page.evaluate(() => getMarks());
        const hasFirst = marks.some(m => m.i === firstIdx);
        expect(hasFirst).toBe(false);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Clear bookmark storage', async () => {
      await page.evaluate(() => localStorage.removeItem('ielts-marks'));
    }).catch(() => {});
  });
});
