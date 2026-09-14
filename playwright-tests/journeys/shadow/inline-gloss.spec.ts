// Compiled from: tests/e2e/shadow/inline-gloss.md
// Compiled at: 2026-09-13
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Inline gloss displays truncated Chinese meaning', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/inline-gloss.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  test(
    'gloss shows truncated Chinese and popup shows full',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Find a word with gloss', async () => {
        const hasGloss = await page.evaluate(() => {
          const gls = document.querySelectorAll('.gl');
          for (const gl of gls) {
            if (gl.textContent && gl.textContent.trim().length > 0) return true;
          }
          return false;
        });
        expect(hasGloss).toBe(true);
      });

      await test.step('Step 2: Gloss shows Chinese meaning', async () => {
        const hasChinese = await page.evaluate(() => {
          const gls = document.querySelectorAll('.gl');
          for (const gl of gls) {
            const t = gl.textContent || '';
            if (/[\u4e00-\u9fff]/.test(t)) return true;
          }
          return false;
        });
        expect(hasChinese).toBe(true);
      });

      await test.step('Step 3: Meaning part truncated to 12 chars', async () => {
        // The meaning (after phonetic) is truncated to 12 chars via slice(0,12)
        const meaningLen = await page.evaluate(() => {
          const gls = document.querySelectorAll('.gl');
          for (const gl of gls) {
            // Get meaning text: text content after .gl-p phonetic span
            const glP = gl.querySelector('.gl-p');
            let meaningText = '';
            if (glP && glP.nextSibling) {
              // Get all text nodes after .gl-p
              let node: ChildNode | null = glP.nextSibling;
              while (node) {
                meaningText += node.textContent || '';
                node = node.nextSibling;
              }
            } else {
              meaningText = gl.textContent || '';
            }
            meaningText = meaningText.trim();
            if (meaningText.length > 0) return meaningText.length;
          }
          return 0;
        });
        expect(meaningLen).toBeLessThanOrEqual(12);
        expect(meaningLen).toBeGreaterThan(0);
      });

      await test.step('Step 4: Click word opens popup', async () => {
        const wordEl = page.locator('.w').first();
        await wordEl.click();
        await expect(page.locator('#pop')).toBeVisible();
        const pwText = await page.locator('#pw').textContent();
        expect(pwText).toBeTruthy();
        const pmText = await page.locator('#pm').textContent();
        expect(pmText).toBeTruthy();
        expect(pmText!.length).toBeGreaterThan(0);
      });

      await test.step('Step 5: Gloss has two senses and no trailing separator', async () => {
        const bad = await page.evaluate(() => {
          const gls = [...document.querySelectorAll('.gl')];
          let twoSense = 0;
          const problems = [];
          for (const gl of gls) {
            const glP = gl.querySelector('.gl-p');
            let meaningText = '';
            let node = glP && glP.nextSibling ? glP.nextSibling : gl.firstChild;
            while (node) { meaningText += node.textContent || ''; node = node.nextSibling; }
            meaningText = meaningText.trim();
            if (!meaningText) continue;
            if (/[；;]$/.test(meaningText)) problems.push('trailing-sep: ' + meaningText);
            if (/[；;]/.test(meaningText) && !/[；;]\s*$/.test(meaningText)) {
              const parts = meaningText.split(/[；;]/).map((s) => s.trim()).filter(Boolean);
              if (parts.length >= 2) twoSense += 1;
              else problems.push('empty-sense: ' + meaningText);
            }
          }
          return { twoSense, problems: problems.slice(0, 5) };
        });
        expect(bad.problems).toEqual([]);
        expect(bad.twoSense).toBeGreaterThan(0);
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Dismiss popup', async () => {
      await page.keyboard.press('Escape');
    }).catch(() => {});
  });
});
