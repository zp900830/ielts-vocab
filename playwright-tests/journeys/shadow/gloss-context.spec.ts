// Compiled from: tests/e2e/shadow/gloss-context.md
// Compiled at: 2026-09-19
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

const glossOf = (key: string, left: string, right: string) =>
  // 在页面里调用应用自己的渲染函数，测的是真实链路而不是复刻一份逻辑
  // eslint-disable-next-line no-eval
  `glossHTML(${JSON.stringify(key)}, ${JSON.stringify(key)}, ${JSON.stringify(left)}, ${JSON.stringify(right)})`;

test.describe('Inline gloss picks the sense that fits the sentence', () => {
  test.skip(!['local', 'preview'].includes(ENV), `not allowed in ${ENV}`);

  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({ type: 'source', description: 'tests/e2e/shadow/gloss-context.md' });
    await test.step('Setup: open the app with every sentence rendered', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect
        .poll(async () => page.locator('.sent').count(), { timeout: currentTimeout() * 3 })
        .toBeGreaterThanOrEqual(1800);
    });
  });

  test(
    'sense selection is correct and conservative',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: same word, two senses in one sentence', async () => {
        const r = await page.evaluate(() => {
          const out: Record<string, string> = {};
          document.querySelectorAll('.sent').forEach((sent) => {
            const ws = Array.from(sent.querySelectorAll('.w'));
            const stables = ws.filter((e) => e.dataset.w === 'stable');
            if (stables.length === 2) {
              stables.forEach((e, i) => {
                out['a' + i] = (e.nextElementSibling as HTMLElement).textContent || '';
              });
              out.ctx = sent.textContent || '';
            }
          });
          return out;
        });
        expect(Object.keys(r).length, '找不到一句里出现两次 stable 的句子').toBeGreaterThan(2);
        expect(r.a0 + r.a1).toMatch(/稳定|马厩/);
        const hits = [r.a0, r.a1];
        expect(hits.some((h) => /稳定/.test(h)), '其中一个 stable 应显示「稳定的」').toBe(true);
        expect(hits.some((h) => /马厩/.test(h)), '另一个 stable 应显示「马厩」').toBe(true);
      });

      await test.step('Steps 2–3: modal / linking verb cues', async () => {
        const cases = await page.evaluate(() => {
          const want: [string, string, string, RegExp][] = [
            ['trace', 'hoping to ', ' the leak', /追踪/],
            ['fire', 'until the ', ' in the room', /火/],
            ['fine', 'her liver looked ', ', but', /很好/],
            ['leak', 'to the ', ' that same', /漏洞/],
          ];
          const res: string[] = [];
          for (const [k, l, r, rx] of want) {
            const html = (window as unknown as { glossHTML: (a: string, b: string, c: string, d: string) => string })
              .glossHTML(k, k, l, r);
            if (!rx.test(html)) res.push(`${k}「${l}__${r}」渲染成 ${html}，期望含 ${rx}`);
          }
          return res;
        });
        expect(cases).toEqual([]);
      });

      await test.step('Step 4: no placeholder senses, no lost glosses', async () => {
        const bad = await page.evaluate(() => {
          const out: string[] = [];
          let n = 0;
          document.querySelectorAll('.w').forEach((el) => {
            const gl = el.nextElementSibling as HTMLElement | null;
            const t = gl && gl.classList.contains('gl') ? gl.textContent || '' : '';
            n++;
            if (/复数词形|现在分词词形|过去式|过去分词/.test(t)) out.push(`${el.dataset.w}: ${t}`);
            if (!t && (window as unknown as { VOCAB: Record<string, { m?: string }> }).VOCAB[el.dataset.w]?.m)
              out.push(`丢了小字: ${el.dataset.w}`);
          });
          return { out: out.slice(0, 8), n };
        });
        expect(bad.out, '占位义项或丢失的小字').toEqual([]);
        expect(bad.n).toBeGreaterThan(4000);
      });

      await test.step('Step 5: -ly adjectives are not read as adverbs', async () => {
        const got = await page.evaluate(() =>
          (window as unknown as { glossHTML: (a: string, b: string, c: string, d: string) => string })
            .glossHTML('monthly', 'monthly', 'sharing ', ' drawings'));
        expect(got).toMatch(/每月的/);
        expect(got).not.toMatch(/每月一次/);
      });
    },
  );
});
