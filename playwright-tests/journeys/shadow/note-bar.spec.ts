// Compiled from: tests/e2e/shadow/note-bar.md
// Compiled at: 2026-09-20 (辨析表从句下改挂段末，PRD §7.2)
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (const/let globals resolve by bare reference inside evaluate)
declare const VOCAB: any;

test.describe('Note bar under sentences, compare table at paragraph end', () => {
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
    'word notes sit under the sentence, 辨析 tables sit at paragraph end',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: 词级笔记仍挂在句子下面', async () => {
        const bar = page.locator('.notebar', { hasText: 'heavy traffic' }).first();
        await expect(bar).toBeVisible();
        expect(await bar.locator('.nb-t').textContent()).toContain('traffic');
        expect(await bar.locator('.nb-n').textContent()).toContain('同义词');
      });

      await test.step('Step 2: Plain sentences have no card', async () => {
        const check = await page.evaluate(() => {
          const bars = [...document.querySelectorAll('.notebar')];
          if (!bars.length) return { ok: false, reason: 'no-bars' };
          for (const b of bars) {
            // A bar follows .sent/.sent-zh, or another bar (stacked cards
            // when one sentence holds several noted words)
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

      await test.step('Step 3: 辨析表挂段末、默认折叠、一组只挂一处', async () => {
        const card = page.locator('.cmp-card[data-grp="curse-swear"]');
        await expect(card).toHaveCount(1);            // 重复挂 = 一张表按成员出现几遍
        // 默认那一行的内容不抄进用例：从数据里取「简单记：」那半句，和渲染器同一条规则。
        // 抄文案 = 每次改卡片就得回来改测试（curse-swear 换版时这条就是假红）。
        const want = await page.evaluate(() => {
          const hit = Object.keys(VOCAB || [])
            .map((k) => (VOCAB[k] as any).cmp)
            .filter((n: any) => n && n.group === 'curse-swear')[0];
          const sm = (hit && hit.summary) || '';
          const m = sm.match(/简单记[:：](.+?)\s*$/);
          return (m ? m[1] : sm).trim();
        });
        expect(want.length).toBeGreaterThan(0);       // 数据里没这句 → 断言会变成空断言
        await expect(card.locator('.cmp-line')).toHaveText(want);
        const geo = await card.evaluate((el) => ({
          insidePara: !!el.closest('.para'),          // 必须在段落外面
          prevOfBlock: (el.parentElement as HTMLElement).previousElementSibling?.className || '',
          bodyDisplay: getComputedStyle(el.querySelector('.cmp-body') as Element).display,
        }));
        expect(geo.insidePara).toBe(false);
        expect(geo.prevOfBlock).toContain('para-zh');   // 紧跟段落主题行，不打断正文与译文
        expect(geo.bodyDisplay).toBe('none');
      });

      await test.step('Step 4: 点一下出对比表，再点收回', async () => {
        const head = page.locator('.cmp-card[data-grp="curse-swear"] .cmp-head');
        await head.click();
        await expect(page.locator('.cmp-card[data-grp="curse-swear"] .nb-table').first()).toBeVisible();
        expect(await head.getAttribute('aria-expanded')).toBe('true');
        await head.click();
        await expect(page.locator('.cmp-card[data-grp="curse-swear"] .nb-table').first()).toBeHidden();
        expect(await head.getAttribute('aria-expanded')).toBe('false');
      });

      await test.step('Step 5: Card word is plain text, not clickable', async () => {
        const bar = page.locator('.notebar', { hasText: 'heavy traffic' }).first();
        expect(await bar.locator('.w').count()).toBe(0);
        await expect(page.locator('#pop')).toBeHidden();
        await bar.locator('.nb-w').first().click();
        await expect(page.locator('#pop')).toBeHidden();
      });

      await test.step('Step 6: Sentence word still opens popup', async () => {
        const sentWord = page.locator('.sent .w[data-w="traffic"]').first();
        await sentWord.click();
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
