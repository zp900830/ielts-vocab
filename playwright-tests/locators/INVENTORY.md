# Locator Inventory
<!-- Auto-maintained by browser-test:compiler. Manual edits will be overwritten. -->
<!-- Last updated: 2026-09-12 | Compilation: shadow playback-chain -->

| Function | File | Signature | Purpose | When to Use |
|----------|------|-----------|---------|-------------|
| `shadowLocators.playButton` | `locators/shadow-locators.ts` | `playButton(page): Locator` | Play/pause toggle button (matches either state) | Any spec starting or stopping playback |
| `shadowLocators.playingSentence` | `locators/shadow-locators.ts` | `playingSentence(page): Locator` | Currently highlighted sentence | Asserting chain position |
| `shadowLocators.progressLabel` | `locators/shadow-locators.ts` | `progressLabel(page): Locator` | Chapter/sentence progress capsule (`#abTitle`) | Asserting progress text |
