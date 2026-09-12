// Compiled from: tests/e2e/shadow/vocab-search.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '@playwright/test';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

test.describe('Vocabulary search filters and counts', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/vocab-search.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      // Panel starts collapsed: open it first (real user flow), then assert visibility
      await page.getByRole('button', { name: '词库' }).first().click();
      await expect(page.locator('#vlist .item').first()).toBeVisible({
        timeout: currentTimeout(),
      });
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'search filters with counts and truncates',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Search for a word', async () => {
        await page.getByPlaceholder('搜索单词或释义…').fill('oxygen');
        await expect
          .poll(async () => page.locator('#vlist .item').count(), {
            timeout: currentTimeout(),
          })
          .toBe(1);
        await expect(page.locator('#vcnt')).toHaveText('1 / 3219词');
      });

      await test.step('Step 2: Clear the search', async () => {
        await page.getByPlaceholder('搜索单词或释义…').fill('');
        await expect
          .poll(async () => page.locator('#vlist .item').count(), {
            timeout: currentTimeout(),
          })
          .toBe(300);
        await expect(page.getByText('仅显示前', { exact: false })).toBeVisible();
      });
    },
  );
});
