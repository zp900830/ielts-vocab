// Compiled from: tests/e2e/shadow/marker-integrity.md
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

declare const VOCAB: Record<string, { m?: string }>;
declare const dataReady: boolean;

test.describe('Highlight markers stay whole in the rendered sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 4);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/marker-integrity.md',
    });
    await page.goto(`${baseURL}/index.html`);
    await expect(page.locator('.sent').first()).toBeVisible();
    await expect
      .poll(async () => page.evaluate((): boolean => dataReady), {
        timeout: currentTimeout(),
      })
      .toBe(true);
  });

  test(
    'no split-word highlights and every word resolves',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: no orphan inflection suffix after a highlight', async () => {
        const offenders = await page.evaluate(() => {
          const out: string[] = [];
          document.querySelectorAll<HTMLElement>('.sent').forEach((sent, si) => {
            let prevWord = false;
            for (const node of Array.from(sent.childNodes)) {
              if (node.nodeType === 3) {
                const t = node.textContent || '';
                // 紧跟在高亮词（或它的行内释义）之后的文本若以小写字母开头
                // = 词尾掉在了标记外面，屏幕上会渲染出 simplifyd 这种不存在的词
                if (prevWord && /^[a-z]/.test(t)) out.push(`${si}: ${t.slice(0, 20)}`);
                prevWord = false;
              } else if (node.nodeType === 1) {
                const el = node as HTMLElement;
                if (el.classList.contains('w')) prevWord = true;
                else if (el.classList.contains('gl')) {
                  /* 行内释义仍视为词的一部分 */
                } else prevWord = false;
              }
            }
          });
          return out;
        });
        expect(offenders).toEqual([]);
      });

      await test.step('Step 2: every highlighted word resolves in the dictionary', async () => {
        const bad = await page.evaluate(() => {
          const missing: string[] = [];
          document.querySelectorAll<HTMLElement>('.w').forEach((el) => {
            const k = el.dataset.w || '';
            const e = (typeof VOCAB === 'undefined' ? null : VOCAB[k]) || null;
            if (!e || !e.m) missing.push(k);
          });
          return missing;
        });
        expect(bad).toEqual([]);
      });
    },
  );
});
