# Locator Inventory
<!-- Auto-maintained by browser-test:compiler. Manual edits will be overwritten. -->
<!-- Last updated: 2026-09-30 | Compilation: dark-mode / hide-zh-gloss / silent-audio-alert -->

| Function | File | Signature | Purpose | When to Use |
|----------|------|-----------|---------|-------------|
| `shadowLocators.playButton` | `locators/shadow-locators.ts` | `playButton(page): Locator` | Play/pause toggle button (matches either state) | Any spec starting or stopping playback |
| `shadowLocators.playingSentence` | `locators/shadow-locators.ts` | `playingSentence(page): Locator` | Currently highlighted sentence | Asserting chain position |
| `shadowLocators.progressLabel` | `locators/shadow-locators.ts` | `progressLabel(page): Locator` | Chapter/sentence progress capsule (`#abTitle`) | Asserting progress text |
| `shadowLocators.darkButton` | `locators/shadow-locators.ts` | `darkButton(page): Locator` | Topbar 夜间模式 toggle (aria name 切换夜间模式) | Any spec clicking or asserting the dark-mode button/icon |
| `shadowLocators.zhToggle` | `locators/shadow-locators.ts` | `zhToggle(page): Locator` | Topbar 全句译文 toggle (aria name 显示或隐藏中文全句翻译) | Any spec toggling or asserting sentence translations |
| `shadowLocators.glossToggle` | `locators/shadow-locators.ts` | `glossToggle(page): Locator` | Topbar 行内词义 toggle (aria name 显示或隐藏行内单词词义) | Any spec toggling or asserting inline glosses |
