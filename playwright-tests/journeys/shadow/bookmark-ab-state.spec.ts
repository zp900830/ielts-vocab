// Compiled from: tests/e2e/shadow/bookmark-ab-state.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const getMarks: () => { i: number }[];
declare const addMark: () => void;
declare const delMark: (i: number) => void;
declare const abCancel: (silent?: boolean) => void;
declare const toggleAB: () => void;
declare const abTap: (i: number) => boolean;
declare const abMode: number;
declare const abStart: number;
declare const abEnd: number;
declare const toggleMarkPop: (show?: boolean) => void;

test.describe('Bookmark popup A-B button state', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/bookmark-ab-state.md',
    });

    await test.step('Setup 1: Clear bookmarks', async () => {
      await page.goto(`${baseURL}/index.html`);
      await page.evaluate(() => localStorage.removeItem('ielts-marks'));
      expect(await page.evaluate(() => getMarks().length)).toBe(0);
    });

    await test.step('Setup 2: Add bookmarks', async () => {
      // Add marks at specific positions
      await page.evaluate(() => {
        const marks = [
          { i: 10, t: 'test1', u: 1 },
          { i: 30, t: 'test2', u: 2 },
          { i: 50, t: 'test3', u: 3 },
        ];
        localStorage.setItem('ielts-marks', JSON.stringify(marks));
      });
      expect(await page.evaluate(() => getMarks().length)).toBe(3);
    });

    await test.step('Setup 3: Cancel any AB state', async () => {
      await page.evaluate(() => abCancel());
      expect(await page.evaluate(() => abMode)).toBe(0);
    });
  });

  test(
    'bookmark A-B buttons highlight correctly',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Open bookmark popup', async () => {
        await page.evaluate(() => toggleMarkPop(true));
        await expect(page.locator('#markWrap')).toHaveClass(/open/);
        await expect(page.locator('#markList .mitem')).toHaveCount(3);
      });

      await test.step('Step 2: Arm A-B loop (mode 1)', async () => {
        await page.evaluate(() => toggleAB());
        expect(await page.evaluate(() => abMode)).toBe(1);
        const anyLit = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('#markList .ab'))
            .some(b => b.classList.contains('ab-on'));
        });
        expect(anyLit).toBe(false);
      });

      await test.step('Step 3: Set A via bookmark row button', async () => {
        // Click first A button (first .ab in first .mitem)
        await page.locator('#markList .mitem').nth(0).locator('button.ab').nth(0).click();
        expect(await page.evaluate(() => abMode)).toBe(2);
        expect(await page.evaluate(() => abStart)).toBe(10);
        const firstABtn = page.locator('#markList .mitem').nth(0).locator('button.ab').nth(0);
        await expect(firstABtn).toHaveClass(/ab-on/);
      });

      await test.step('Step 4: Set B via bookmark row button', async () => {
        // Click second B button (second .ab in second .mitem)
        await page.locator('#markList .mitem').nth(1).locator('button.ab').nth(1).click();
        expect(await page.evaluate(() => abMode)).toBe(3);
        expect(await page.evaluate(() => abEnd)).toBe(30);
        const secondBBtn = page.locator('#markList .mitem').nth(1).locator('button.ab').nth(1);
        await expect(secondBBtn).toHaveClass(/ab-on/);
        // First row A should still be lit
        const firstABtn = page.locator('#markList .mitem').nth(0).locator('button.ab').nth(0);
        await expect(firstABtn).toHaveClass(/ab-on/);
      });

      await test.step('Step 5: Cancel AB clears all highlighting', async () => {
        await page.evaluate(() => abCancel());
        expect(await page.evaluate(() => abMode)).toBe(0);
        const anyLit = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('#markList .ab'))
            .some(b => b.classList.contains('ab-on'));
        });
        expect(anyLit).toBe(false);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Clear bookmarks and AB state', async () => {
      await page.evaluate(() => {
        localStorage.removeItem('ielts-marks');
        abCancel();
        toggleMarkPop(false);
      });
    }).catch(() => {});
  });
});
