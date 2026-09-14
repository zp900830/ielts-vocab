// Compiled from: tests/e2e/shadow/note-bar.md
// Compiled at: 2026-09-14
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (const/let globals resolve by bare reference inside evaluate)
declare const VOCAB: any;

test.describe('Note bar under sentences with analysis-worthy words', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/note-bar.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.locator('.sent').first()).toBeVisible();
    });
  });

  test(
    'note bars render only where notes exist',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Note bar renders for swear', async () => {
        const bar = page.locator('.notebar', { hasText: 'swear at sb' });
        await expect(bar).toBeVisible();
        expect(await bar.locator('.nb-t').textContent()).toContain('swear');
        expect(await bar.locator('.nb-n').textContent()).toContain('辨析');
      });

      await test.step('Step 2: Bars follow sentences, plain sentences have none', async () => {
        const check = await page.evaluate(() => {
          const bars = [...document.querySelectorAll('.notebar')];
          if (!bars.length) return { ok: false, reason: 'no-bars' };
          for (const b of bars) {
            // A bar follows .sent/.sent-zh, or another bar (stacked cards
            // when one sentence holds several noted words, e.g. curse+swear)
            const prev = b.previousElementSibling;
            if (!prev || (!prev.classList.contains('sent') && !prev.classList.contains('sent-zh') && !prev.classList.contains('notebar')))
              return { ok: false, reason: 'bar-not-after-sentence' };
          }
          const noted = new Set(
            Object.keys(VOCAB || {}).filter((k: string) => VOCAB[k] && (VOCAB[k] as any).note),
          );
          let plainChecked = 0;
          for (const s of document.querySelectorAll('.sent')) {
            const marks = [...s.querySelectorAll('.w')].map((el) =>
              (el as HTMLElement).dataset.w || '');
            if (!marks.some((m) => noted.has(m))) {
              const nx = s.nextElementSibling;
              if (nx && nx.classList.contains('notebar'))
                return { ok: false, reason: 'bar-after-plain-sentence' };
              plainChecked += 1;
              if (plainChecked >= 5) break;
            }
          }
          return { ok: true, bars: bars.length, plainChecked };
        });
        expect(check.ok).toBe(true);
      });

      await test.step('Step 3: Card word opens popup', async () => {
        const bar = page.locator('.notebar', { hasText: 'swear at sb' });
        await bar.locator('.w').click();
        await expect(page.locator('#pop')).toBeVisible();
        expect(await page.locator('#pw').textContent()).toBeTruthy();
      });
    },
  );

  test.afterEach(async ({ page }) => {
    await test.step('Teardown 1: Dismiss popup', async () => {
      await page.keyboard.press('Escape');
    }).catch(() => {});
  });
});
