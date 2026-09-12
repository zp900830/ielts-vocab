import type { Locator, Page } from '@playwright/test';

// Shared locators for the shadow-reading page (extracted during compilation:
// play button, playing-sentence highlight and progress label repeat in 6 specs).
export const shadowLocators = {
  playButton: (page: Page): Locator =>
    page.getByRole('button', { name: /播放|暂停/ }),
  playingSentence: (page: Page): Locator => page.locator('.sent.playing'),
  progressLabel: (page: Page): Locator => page.locator('#abTitle'),
};
