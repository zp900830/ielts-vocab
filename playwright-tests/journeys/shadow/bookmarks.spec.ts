// Compiled from: tests/e2e/shadow/bookmarks.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Bookmarks save, deduplicate, jump and delete', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/bookmarks.md',
    });

    await test.step('Setup 0: Clear bookmark storage', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.evaluate(() => localStorage.removeItem('ielts-marks'));
      await expect
        .poll(
          async () =>
            page.evaluate(
              () =>
                (window as unknown as { getMarks: () => unknown[] }).getMarks().length,
            ),
          { timeout: currentTimeout() },
        )
        .toBe(0);
    });

    await test.step('Setup 1: Open the app with a known position', async () => {
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'bookmark lifecycle',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page, registerTeardown }) => {
      registerTeardown(async () => {
        await test.step('Teardown: clear bookmark storage', async () => {
          await page.evaluate(() => localStorage.removeItem('ielts-marks'));
        });
      });

      await test.step('Step 1: Save the current position twice', async () => {
        await page.evaluate(() => {
          const w = window as unknown as { addMark: () => void };
          w.addMark();
          w.addMark();
        });
        const n = await page.evaluate(
          () => (window as unknown as { getMarks: () => unknown[] }).getMarks().length,
        );
        expect(n).toBe(1);
        await expect(page.locator('#markList .mitem')).toHaveCount(1);
      });

      await test.step('Step 2: Jump to the bookmark', async () => {
        await page.evaluate(() => {
          const w = window as unknown as {
            getMarks: () => { i: number }[];
            jumpMark: (i: number) => void;
          };
          w.jumpMark(w.getMarks()[0].i);
        });
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 3: Delete the bookmark', async () => {
        await page.evaluate(() => {
          const w = window as unknown as {
            getMarks: () => { i: number }[];
            delMark: (i: number) => void;
          };
          w.delMark(w.getMarks()[0].i);
        });
        const n = await page.evaluate(
          () => (window as unknown as { getMarks: () => unknown[] }).getMarks().length,
        );
        expect(n).toBe(0);
      });
    },
  );
});
