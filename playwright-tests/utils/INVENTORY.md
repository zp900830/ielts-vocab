# Utility Inventory
<!-- Auto-maintained by browser-test:compiler. Manual edits will be overwritten. -->
<!-- Last updated: 2026-09-30 | Compilation: dark-mode / hide-zh-gloss / silent-audio-alert -->

| Function | File | Signature | Purpose | When to Use |
|----------|------|-----------|---------|-------------|
| `currentTimeout` | `utils/timeouts.ts` | `currentTimeout(): number` | Retry-aware expect cap (2/3/4 min) | Any non-trivial wait or assertion timeout |
| `smartWaitFor` | `utils/timeouts.ts` | `smartWaitFor(locator): Promise<void>` | Poll visibility with retry-aware cap | Waiting for elements after navigation |
| `clearLocalKey` | `utils/storage-helpers.ts` | `clearLocalKey(page, key): Promise<void>` | Remove a localStorage key and fail if it survives | Setup/teardown key resets (extracted 2026-09-30; pattern was inlined in 10+ specs) |
