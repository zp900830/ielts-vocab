// 2026-09-25 用户：「快捷键别丢了，空格是播放/暂停当前高亮句，⬅️是播放上一句，➡️是播放下一句」。
// 现状验证：/app/ 的全局 keydown（照搬 shadow 的那套）在任务模式里仍然有效 ——
//   空格 = togglePlay（当前句）；→ = TASK.next()（① 态 = 放这一句 / 下一句，高亮同步开播）；
//   ← = TASK.prev()（回到上一句并开播）。
// 这条锁把三颗键钉住，防止以后加浮窗/输入框时把全局 handler 挡掉（要排除输入框/浮窗按键）。
import { test, expect } from '../../fixtures';

declare const TASK: {
  resetV2(): void;
  initPlan(minutes: number): void;
};
declare const ShadowPlan: { articleScope(sections: unknown, article: number): Set<number> };
declare const SECTIONS: unknown[];

const rootUrl = process.env.E2E_ROOT_URL || '';

/* 六篇，第 0 篇 12 句（够排一整批、够翻好几句），其余各 2 句。 */
const SIX: Record<string, string> = (() => {
  const mk = (title: string, ai: number, n: number) => ({
    title, zh: title, subheads: [''],
    paragraphs: [Array.from({ length: n }, (_, i) => `Sentence ${i} about [[a${ai}_w${i}:a${ai}_w${i}]].`)],
    sentZh: [Array.from({ length: n }, (_, i) => `第 ${i} 句。`)],
    paraZh: [''],
  });
  const titles = ['地球与生命', '校园与文化', '衣食住行', '社会与规则', '历史与发明', '身体与时间'];
  const vocab: Record<string, { m: string }> = {};
  for (let a = 0; a < 6; a++) for (let i = 0; i < 12; i++) vocab[`a${a}_w${i}`] = { m: `a${a}_w${i}` };
  return {
    'sections.json': JSON.stringify(titles.map((t, i) => mk(t, i, i === 0 ? 12 : 2))),
    'vocab.json': JSON.stringify(vocab),
    'chapters.json': '[]',
  };
})();

async function stubData(page: import('@playwright/test').Page, payloads: Record<string, string>) {
  for (const [name, body] of Object.entries(payloads)) {
    await page.route(`**/shadow/data/${name}*`, (r) =>
      r.fulfill({ status: 200, contentType: 'application/json', body }));
  }
}

async function enterTask(page: import('@playwright/test').Page) {
  await stubData(page, SIX);
  await page.goto(`${rootUrl}/app/index.html#/home`);
  await page.waitForFunction(() => {
    try {
      return typeof dataReady !== 'undefined' && dataReady
        && !!(window as unknown as { APP3?: unknown }).APP3
        && document.querySelectorAll('.art-card').length > 0;
    } catch (e) { return false; }
  });
  await page.evaluate(() => { TASK.resetV2(); TASK.initPlan(15); });
  await page.locator('.art-card .a-open').first().click();
  await expect(page.locator('body')).toHaveClass(/task-mode/);
  await expect(page.locator('#taskBar')).toHaveAttribute('data-state', 'read');
}

const playing = (page: import('@playwright/test').Page) =>
  page.locator('#btnPlay').evaluate((el) => /暂停/.test(el.textContent || ''));

// .sent 没有 data-i，高亮位置按 `#art .sent` 的 DOM 顺序取下标。
const playingIdx = (page: import('@playwright/test').Page) =>
  page.evaluate(() => Array.from(document.querySelectorAll('#art .sent')).findIndex((el) => el.classList.contains('playing')));

test.describe('3.0 任务模式键盘快捷键（H）', () => {
  test('空格 = 播放/暂停当前句；→ = 下一句；← = 上一句（高亮跟着走）', async ({ page }) => {
    await enterTask(page);

    // 空格：播放 → 暂停
    await page.keyboard.press('Space');
    await expect.poll(() => playing(page), '空格应开始播放').toBe(true);
    await page.keyboard.press('Space');
    await expect.poll(() => playing(page), '再按空格应暂停').toBe(false);

    // ➡️：播放下一句（这里第一次是「放这一句」，行为上同样进入播放）
    const first = await playingIdx(page);
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => playing(page), '→ 应开播').toBe(true);
    // 再按一次 → 高亮真的往后挪
    await page.keyboard.press('ArrowRight');
    await expect.poll(() => playingIdx(page), '→ 应把高亮挪到下一句').not.toBe(first);

    // ⬅️：回到上一句并开播
    await page.keyboard.press('ArrowLeft');
    await expect.poll(() => playing(page), '← 应开播').toBe(true);
    await expect.poll(() => playingIdx(page), '← 应把高亮挪回上一句').toBe(first);
  });

  test('输入框里按空格不触发全局播放（不抢键）', async ({ page }) => {
    await enterTask(page);
    await page.evaluate(() => { (window as unknown as { toggleJumpPop: () => void }).toggleJumpPop(); });
    const input = page.locator('#jumpN');
    await expect(input).toBeVisible();
    await input.focus();
    await page.keyboard.press('Space');
    expect(await playing(page), '输入框里按空格不该开播').toBe(false);
    await page.keyboard.press('Escape');
  });
});
