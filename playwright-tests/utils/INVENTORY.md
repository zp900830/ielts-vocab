# Utility Inventory
<!-- Auto-maintained by browser-test:compiler. Manual edits will be overwritten. -->
<!-- Last updated: 2026-09-12 | Compilation: shadow playback-chain -->

| Function | File | Signature | Purpose | When to Use |
|----------|------|-----------|---------|-------------|
| `currentTimeout` | `utils/timeouts.ts` | `currentTimeout(): number` | Retry-aware expect cap (2/3/4 min) | Any non-trivial wait or assertion timeout |
| `smartWaitFor` | `utils/timeouts.ts` | `smartWaitFor(locator): Promise<void>` | Poll visibility with retry-aware cap | Waiting for elements after navigation |
| `gotoApp` | `utils/timeouts.ts` | `gotoApp(page, baseURL): Promise<void>` | Navigate to the app root page | Test setup navigation |
