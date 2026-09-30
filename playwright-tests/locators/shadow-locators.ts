import type { Locator, Page } from '@playwright/test';

// Shared locators for the shadow-reading page (extracted during compilation:
// play button, playing-sentence highlight and progress label repeat in 6 specs).
export const shadowLocators = {
  playButton: (page: Page): Locator =>
    page.getByRole('button', { name: /播放|暂停/ }),
  playingSentence: (page: Page): Locator => page.locator('.sent.playing'),
  progressLabel: (page: Page): Locator => page.locator('#abTitle'),
  // Topbar round-trip toggles (extracted 2026-09-30 during dark-mode /
  // hide-zh-gloss compilation — each repeats twice inside its spec).
  darkButton: (page: Page): Locator =>
    page.getByRole('button', { name: '切换夜间模式' }),
  zhToggle: (page: Page): Locator =>
    page.getByRole('button', { name: '显示或隐藏中文全句翻译' }),
  glossToggle: (page: Page): Locator =>
    page.getByRole('button', { name: '显示或隐藏行内单词词义' }),
};
