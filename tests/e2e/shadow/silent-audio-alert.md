# Silent engine raises the no-audio guidance alert and stops the chain
<!-- status: compiled | spec: playwright-tests/journeys/shadow/silent-audio-alert.spec.ts | date: 2026-09-30 -->

## Summary
Verifies the user-visible no-audio contract: when the speech engine exists but never reports progress, continuous playback raises the guidance `alert` (message 本机语音引擎无响应…), the alert is dismissed immediately, and playback returns to idle (播放) with the current-sentence highlight intact — instead of spinning silently forever.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environment note:** this case *manufactures* the no-audio environment from the area conventions "Headless / no-audio environments" section deterministically — the local machine's real TTS reports onstart/onend and would never take the error path. See Setup 1.
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 0. Clear progress
Remove `ielts-pos` from `localStorage` (the profile persists across runs).
**Verify:** `localStorage.getItem('ielts-pos')` is `null`.

### Setup 1. Install the silent-engine stub before playback
Navigate to `{E2E_BASE_URL}/index.html`, then — before clicking play — install a page-context stub that replaces `speechSynthesis.speak/cancel/pause/resume` with no-ops (an init script before navigation also works; both are valid because the app reads `speechSynthesis.speak` at call time, not at load). The API object still exists — `HAS_SPEECH` stays true — but utterance events never fire: exactly the engine-present-but-silent shape the watchdog path handles.
**Verify:** the play button (accessible name contains 播放) reads 播放.

## Test Steps

### 1. Start playback in the silent environment
Click the play button. Dialog handling must be armed before this click (code-level `page.on('dialog')`, or capture on arrival — either mechanism, but the message must not be lost): whatever dialog appears is captured and dismissed/swallowed immediately, never left open.
**Verify:** button label flips to 暂停 (chain is running).

### 2. Wait for the guidance alert and capture it
Wait until a dialog appears — up to 45 seconds (observed ≈17s: two watchdog rounds per sentence, `errStreak` reaches 3 on the third sentence). The moment it appears: capture `type` + `message`, then dismiss/swallow immediately.
**Verify:** exactly one dialog fired; it is an `alert`; the message starts with `本机语音引擎无响应`.

### 3. After dismissal the app is idle, not spinning
(Immediately after the auto-dismiss from step 1.)
**Verify:** play button reads 播放 again (`playing` was cleared by the alert path); the current sentence still carries the `.playing` highlight (position marker is kept); no second dialog was raised.

**Pass condition:** A silent engine triggers the guidance alert with the correct message exactly once; dismissing it returns the UI to the idle 播放 state with the highlight preserved — no silent infinite spinning.

## After Hook

### Teardown 1. Clear progress
Remove `ielts-pos` from `localStorage` if present. The speech stub lives only in this page context and dies with it; ensure no dialog is still open before closing (it was dismissed in step 1).
