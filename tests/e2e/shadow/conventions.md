# Shadow Area Conventions

## Standard shadow preconditions
- Fresh browser session at `{E2E_BASE_URL}/index.html`.
- No login (cloud features are out of scope for these tests).
- `localStorage` cleared unless the test asserts persistence.
- NOTE: `browser_close` + navigate does NOT wipe the profile — `ielts-pos`/`ielts-marks` persist across runs. Tests asserting storage contents must clear the relevant keys in Before Hook.

## Named procedures
- **Start playback**: Click the play button (name 播放). Verify: button text becomes 暂停.
- **Stop playback**: Click the play button (name 暂停). Verify: button text becomes 播放.
- **Current sentence**: The element with class `playing` (`document.querySelector('.sent.playing')`).

## Markers
- Phase: `@regression`; polarity: `@positive` unless stated; area: `@shadow`.

## Headless / no-audio environments (discovered 2026-09-12)
- Speech never sounds, but the chain still advances via watchdog retries: button text, `.playing` highlight and `ielts-pos` all update normally. Assert UI state, never audibility.
- After ~12s of continuous silent playback the app raises the no-audio guidance `alert`. Pause before that in tests, or expect and dismiss it. The alert text always starts with `语音播不出来`.
- `browser_close` while the alert is up lands on `about:blank`; just navigate fresh afterwards.
- Static server responses get heuristically cached: after changing the app, navigate with a cache-buster (`{E2E_BASE_URL}/index.html?v=N`, bump N per change) and verify via `fetch(location.href)` that the new code is loaded before running.
