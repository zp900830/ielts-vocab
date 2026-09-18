// Compiled from: tests/e2e/shadow/prev-sentence.md
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (top-level `let`: page-scope visible, not window properties).
declare const idx: number;

test.describe('Play bar previous sentence rewinds one sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/prev-sentence.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.getByRole('heading', { name: /雅思词汇/ }).first()).toBeVisible();
      await expect
        .poll(async () => page.locator('.sent').count(), { timeout: currentTimeout() })
        .toBe(1809);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'previous sentence rewinds exactly one sentence and submits only it',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      // The setup drives playback position directly instead of waiting for the chain to
      // advance: the macOS speech engine is shared and can stall, and this case is about
      // what the cut submits, which is observable without real audio.
      await test.step('Step 1: Start playback at sentence 6', async () => {
        await page.evaluate(() => {
          (window as unknown as { playFrom: (i: number) => void }).playFrom(6);
        });
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
        expect(await page.evaluate((): number => idx)).toBe(6);
      });

      await test.step('Step 2: Press 上一句', async () => {
        // Count utterances handed to the engine right after the cut: a just-cancelled
        // Chrome engine swallows them, and the surviving siblings trip the silent watchdog
        // whose retry cancels the playing sentence and jumps the highlight forward.
        await page.evaluate(() => {
          const w = window as unknown as { __speaks?: string[]; speak: (t: string) => void };
          w.__speaks = [];
          const orig = w.speak;
          w.speak = function (text: string) {
            w.__speaks!.push(String(text).slice(0, 24));
            return orig.apply(w, arguments as unknown as [string]);
          };
        });
        await page.getByTitle('上一句').click();
        await expect
          .poll(async () => page.evaluate((): number => idx), { timeout: 3000 })
          .toBe(5);
        const hl = await page.evaluate(() =>
          [...document.querySelectorAll('.sent')].findIndex((e) =>
            e.classList.contains('playing'),
          ),
        );
        expect(hl).toBe(5);
      });

      await test.step('Step 3: Only the target sentence is submitted', async () => {
        await page.waitForTimeout(600);
        const n = await page.evaluate(
          () => (window as unknown as { __speaks?: string[] }).__speaks?.length ?? 0,
        );
        expect(n).toBeLessThanOrEqual(1);
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
