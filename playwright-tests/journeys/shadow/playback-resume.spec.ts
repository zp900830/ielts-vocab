// Compiled from: tests/e2e/shadow/playback-resume.md
// Compiled at: 2026-09-12
// Source is authoritative — do not edit; re-compile from markdown if broken.

import { test, expect } from '../../fixtures';
import { currentTimeout } from '../../utils/timeouts';
import { waitShadowReady } from '../../utils/app-ready';
import { shadowLocators as shadow } from '../../locators/shadow-locators';

const ENV = process.env.E2E_ENVIRONMENT || 'local';

// App globals (top-level `let` in a classic script: visible in page scope,
// NOT as window properties — never read them via `window.idx`).
declare let idx: number;
declare const sents: HTMLElement[];
declare let playing: boolean;
declare let speakToken: number;
declare function playFrom(i: number): void;
declare const chapterSentStart: number;
declare const currentChapter: number;

test.describe('Playback resumes from saved position after reload', () => {
  test.skip(
    !['local', 'preview'].includes(ENV),
    `Test not allowed in "${ENV}" (allowed: local, preview)`,
  );

  // === Before Hook (from markdown ## Before Hook) ===
  test.beforeEach(async ({ page, baseURL }, testInfo) => {
    testInfo.setTimeout(currentTimeout() * 6);
    testInfo.annotations.push({
      type: 'source',
      description: 'tests/e2e/shadow/playback-resume.md',
    });

    await test.step('Setup 1: Save a known position', async () => {
      await page.goto(`${baseURL}/index.html`);
      // goto 在 load 就返回，sents 还没渲染时 playFrom(50) 会静默空转、不落盘。
      await waitShadowReady(page);
      await page.evaluate(() => {
        (
          window as unknown as { playFrom: (i: number) => void; togglePlay: () => void }
        ).playFrom(50);
        (
          window as unknown as { togglePlay: () => void }
        ).togglePlay();
      });
      const saved = await page.evaluate(() =>
        JSON.parse(localStorage.getItem('ielts-pos') || '{}'),
      );
      expect(saved.i).toBe(50);
    });
  });

  // === Test Steps (from markdown ## Test Steps) ===
  test(
    'reload restores position without autoplay',
    { tag: ['@regression', '@positive', '@shadow'] },
    async ({ page }) => {
      await test.step('Step 1: Reload the page', async () => {
        await page.reload();
        await expect
          .poll(async () => page.evaluate((): number => idx), {
            timeout: currentTimeout(),
          })
          .toBe(50);
        await expect
          .poll(
            async () =>
              page.evaluate(() => {
                const r = sents[idx].getBoundingClientRect();
                return r.top >= 0 && r.bottom <= window.innerHeight;
              }),
            { timeout: currentTimeout() },
          )
          .toBe(true);
        await expect(shadow.progressLabel(page)).toContainText('第1章');
      });

      await test.step('Step 2: No autoplay after reload', async () => {
        await expect(shadow.playButton(page)).toHaveText(/播放/, {
          timeout: currentTimeout(),
        });
      });

      await test.step('Step 3: End of chapter keeps the resume point', async () => {
        const r = await page.evaluate(async () => {
          const wait = (ms: number) => new Promise(res => setTimeout(res, ms));
          /* 走**真实**的整章收尾：末句的 completion（onend）→ 回调里那条 `i + 1 >= sents.length`。
             不能再用 `launch(sents.length)` 来模拟 —— 2026-09-24 那条越界分支已改成
             「越界只可能是预取，绝不许碰正在念的那句的状态」，否则点倒数第 1/2 句时，
             这句自己的预取会把高亮和 playing 一起掐掉（实测 P1，见 playback-chain ⑤）。 */
          const w = window as unknown as { speak: (t: string, cb?: () => void) => void };
          const cbs: (() => void)[] = [];
          w.speak = (_t: string, cb?: () => void) => { if (cb) cbs.push(cb); };
          playing = false; speakToken++;
          await wait(40);
          const last = sents.length - 1;
          playFrom(last);
          await wait(40);
          const cb = cbs[cbs.length - 1];
          if (cb) cb();                       // 末句真的放完了
          await wait(40);
          return {
            last,
            start: chapterSentStart,
            chapter: currentChapter,
            idxAfter: idx,
            pos: JSON.parse(localStorage.getItem('ielts-pos') || '{}'),
          };
        });
        expect(r.idxAfter, '整章播完要给 idx 收尾成 -1').toBe(-1);
        // 默认视图是「全部文章」（currentChapter < 0），此时 savePos 只写全局句号 i；
        // 选了章节才会写 chapter/chapterI。两种模式下都不能把续读位倒回 0。
        expect(r.pos.i).toBe(r.chapter >= 0 ? r.start + r.last : r.last);
        expect(r.pos.i).toBeGreaterThan(0);
        if (r.chapter >= 0) expect(r.pos.chapterI).toBe(r.last);
      });
    },
  );
});
