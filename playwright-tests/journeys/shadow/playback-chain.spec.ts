// Compiled from: tests/e2e/shadow/playback-chain.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals
declare const playing: boolean;
declare function playFrom(i: number): void;

test.describe('Playback chain advances sentence by sentence', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/playback-chain.md',
    });

    await test.step('Setup 1: Open the app', async () => {
      await page.goto(`${baseURL}/index.html`);
      await expect(page.getByRole('heading', { name: /雅思词汇/ }).first()).toBeVisible();
      // 句数由数据决定，别写死：改课文时这里会误红，而真正的意图是「渲染没漏句」
      await expect
        .poll(
          async () =>
            page.evaluate(() => {
              const want =
                typeof SECTIONS === 'undefined'
                  ? -1
                  : SECTIONS.reduce(
                      (a, c) => a + c.paragraphs.reduce((x, p) => x + p.length, 0),
                      0,
                    );
              return want > 0 && document.querySelectorAll('.sent').length === want;
            }),
          { timeout: currentTimeout() },
        )
        .toBe(true);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'playback advances with highlight and autosave',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Start playback', async () => {
        await shadow.playButton(page).click();
        await expect(shadow.playButton(page)).toHaveText(/暂停/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 2: Chain advances', async () => {
        const first = await shadow.playingSentence(page).first().textContent();
        await expect
          .poll(async () => shadow.playingSentence(page).first().textContent(), {
            timeout: currentTimeout(),
          })
          .not.toBe(first);
      });

      await test.step('Step 3: Progress auto-saves', async () => {
        const pos = await page.evaluate(() => localStorage.getItem('ielts-pos'));
        expect(pos).not.toBeNull();
        expect(JSON.parse(pos as string).i).toBeGreaterThanOrEqual(0);
      });

      await test.step('Step 4: Pause', async () => {
        await shadow.playButton(page).click();
        await expect(shadow.playButton(page)).toHaveText(/播放/, {
          timeout: currentTimeout(),
        });
      });
    },
  );

  /* 2026-09-24 实测的 P1：`launch()` 里那条 `i >= sents.length` 越界分支（给 fire3 预取
     i+1/i+2 用的）顺手写了 `playing=false; idx=-1; paint()`，于是点倒数第 1/2 句时，
     这句自己的预取反手把高亮和 playing 一起掐掉 —— 声音出来了，高亮没了，链子断在这儿。
     真正的「整章播完」由 completion 回调里那条 `i + 1 >= sents.length` 负责。 */
  test(
    '尾巴：点倒数第一、二句，高亮与播放状态不许被自己的预取掐掉',
    { tag: ['@regression', '@shadow'] },
    async ({ page }) => {
      const n = await page.evaluate(() => document.querySelectorAll('.sent').length);
      expect(n, '正文没渲够 = 这条什么都没测').toBeGreaterThan(10);
      for (const off of [1, 0]) {
        const idx = n - 1 - off;
        await page.evaluate((i) => {
          // 引擎换成录音笔：只接住「发射了哪句」，不出声、也不兑现结束
          const w = window as unknown as { speak: (t: string, cb?: () => void) => void; __seq: string[] };
          w.__seq = [];
          w.speak = function (t: string) { w.__seq.push(String(t)); };
          playFrom(i);
        }, idx);
        const got = await page.evaluate(() => ({
          playing,
          hi: [...document.querySelectorAll('.sent')].findIndex((e) => e.classList.contains('playing')),
          spoken: (window as unknown as { __seq: string[] }).__seq.length,
        }));
        expect(got.spoken, `点倒数第 ${off + 1} 句：引擎一句都没接到`).toBeGreaterThan(0);
        expect(got.playing, `点倒数第 ${off + 1} 句后 playing 被预取掐了`).toBe(true);
        expect(got.hi, `点倒数第 ${off + 1} 句后高亮被预取掐了`).toBe(idx);
      }
    },
  );
});
