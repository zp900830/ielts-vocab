# Global E2E Conventions

## Environment
- `E2E_BASE_URL` (default: `http://localhost:8931`): static server root serving `shadow/` (e.g. `python3 -m http.server 8931 --directory shadow/`). Navigate to `{E2E_BASE_URL}/index.html`, never a hardcoded domain.
- `E2E_ENVIRONMENT` (default: `local`). No backend, no auth, no test data needed.

## Session Management
- Fresh browser profile per run; clear `localStorage` when a test depends on clean progress/bookmarks.

## Interaction Patterns
- Locate elements via accessibility snapshot refs (`browser_snapshot` → `browser_click`/`browser_type`), never CSS selectors from source.
- Speech output is not assertable headless: assert UI state instead — play button text (播放/暂停), `.sent.playing` highlight, `#abTitle` progress text, `localStorage` (`ielts-pos`, `ielts-marks`).
- After any click that starts speech, allow one utterance cycle before asserting chain state.

## Wait Strategy
- Prefer state assertions (button text, class presence) over fixed sleeps.
- `browser_snapshot` after each page transition before interacting.

## Functional Areas
| Area | Path | Scope |
|------|------|-------|
| shadow | `tests/e2e/shadow/` | 影子跟读单页：播放链、单词弹窗、词库搜索、书签、跳转、键盘 |
