# Playback chain advances sentence by sentence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/playback-chain.spec.ts | date: 2026-09-12 -->

## Summary
Verifies continuous playback advances through sentences with highlight following and progress auto-saved.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Page title contains 影子跟读 and 1809 sentences render.

## Test Steps

### 1. Start playback
Start playback.
**Verify:** Play button text becomes 暂停.

### 2. Chain advances
Wait for two utterance cycles.
**Verify:** A `.sent.playing` element exists and its text differs from the first sentence (chain moved past sentence 1).

### 3. Progress auto-saves
**Verify:** `localStorage` key `ielts-pos` exists with a valid sentence index.

### 4. Pause
Stop playback.
**Verify:** Play button text becomes 播放 and `ielts-pos` holds the paused index.

**Pass condition:** Play/pause toggles button text, highlight advances past the first sentence, and the paused index persists in `ielts-pos`.

## After Hook
_None — read-only test, no state created._
