// Compiled from: tests/e2e/shadow/ab-loop.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const abMode: number;
declare const abStart: number;
declare const abEnd: number;
declare const abCancel: (silent?: boolean) => void;
  declare const toggleAB: () => void;
  declare const toggleABWrap: (e?: Event) => void;
  declare const abTap: (i: number) => boolean;
declare const sents: HTMLElement[];
declare const idx: number;

test.describe('A-B loop: arm, select, loop, and cancel', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/ab-loop.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });

    await test.step('Setup 2: Ensure AB loop is off', async () => {
      await page.evaluate(() => abCancel());
      expect(await page.evaluate(() => abMode)).toBe(0);
    });
  });

  test(
    'AB loop state machine',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Arm A-B loop', async () => {
        await page.evaluate(() => { toggleAB(); });
        expect(await page.evaluate(() => abMode)).toBe(1);
        await expect(page.locator('button:has-text("设A")')).toBeVisible();
      });

      await test.step('Step 2: Set A by tapping a sentence', async () => {
        await page.evaluate(() => abTap(10));
        expect(await page.evaluate(() => abMode)).toBe(2);
        expect(await page.evaluate(() => abStart)).toBe(10);
        await expect(page.locator('button:has-text("设B")')).toBeVisible();
        const hasClass = await page.evaluate(() => sents[10]?.classList.contains('ab-a'));
        expect(hasClass).toBe(true);
      });

      await test.step('Step 3: Set B by tapping another sentence', async () => {
        await page.evaluate(() => abTap(20));
        expect(await page.evaluate(() => abMode)).toBe(3);
        expect(await page.evaluate(() => abStart)).toBe(10);
        expect(await page.evaluate(() => abEnd)).toBe(20);
        const aClass = await page.evaluate(() => sents[10]?.classList.contains('ab-a'));
        const bClass = await page.evaluate(() => sents[20]?.classList.contains('ab-b'));
        const inClass = await page.evaluate(() => sents[15]?.classList.contains('ab-in'));
        expect(aClass).toBe(true);
        expect(bClass).toBe(true);
        expect(inClass).toBe(true);
      });

      await test.step('Step 4: Reverse selection auto-normalize', async () => {
        await page.evaluate(() => abCancel());
        await page.evaluate(() => { toggleAB(); }); // arm
        await page.evaluate(() => abTap(30)); // A=30
        await page.evaluate(() => abTap(15)); // B=15 → normalized to A=15, B=30
        expect(await page.evaluate(() => abStart)).toBe(15);
        expect(await page.evaluate(() => abEnd)).toBe(30);
        const aClass = await page.evaluate(() => sents[15]?.classList.contains('ab-a'));
        const bClass = await page.evaluate(() => sents[30]?.classList.contains('ab-b'));
        expect(aClass).toBe(true);
        expect(bClass).toBe(true);
      });

      await test.step('Step 5: Single-sentence loop', async () => {
        await page.evaluate(() => abCancel());
        await page.evaluate(() => { toggleAB(); }); // arm
        await page.evaluate(() => abTap(5)); // A=5
        await page.evaluate(() => abTap(5)); // B=5 → single sentence
        expect(await page.evaluate(() => abStart)).toBe(5);
        expect(await page.evaluate(() => abEnd)).toBe(5);
        const aClass = await page.evaluate(() => sents[5]?.classList.contains('ab-a'));
        expect(aClass).toBe(true);
      });

      await test.step('Step 6: Cancel via AB button', async () => {
        // First set up a loop
        await page.evaluate(() => abCancel());
        await page.evaluate(() => { toggleAB(); });
        await page.evaluate(() => abTap(10));
        await page.evaluate(() => abTap(20));
        expect(await page.evaluate(() => abMode)).toBe(3);

        // Cancel via AB button
        await page.evaluate(() => { toggleAB(); });
        expect(await page.evaluate(() => abMode)).toBe(0);
        expect(await page.evaluate(() => abStart)).toBe(-1);
        expect(await page.evaluate(() => abEnd)).toBe(-1);
        const anyAbA = await page.evaluate(() => {
          return Array.from(sents).some(el => el.classList.contains('ab-a'));
        });
        expect(anyAbA).toBe(false);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Cancel any active AB loop', async () => {
      await page.evaluate(() => abCancel());
    }).catch(() => {});
  });
});
