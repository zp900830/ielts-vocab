# Keyboard shortcuts control playback and dismiss popups
<!-- status: compiled | spec: playwright-tests/journeys/shadow/keyboard.spec.ts | date: 2026-09-12 -->

## Summary
Verifies Space toggles playback, arrows step sentences, and Escape dismisses popups.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html` with focus on the page body (not in an input).
**Verify:** Play button text reads 播放.

## Test Steps

### 1. Space toggles playback
Press Space.
**Verify:** Button text becomes 暂停. Press Space again.
**Verify:** Button text returns to 播放.

### 2. Arrows step sentences
Press ArrowRight then ArrowLeft.
**Verify:** Playback restarts from the adjacent sentence each time (button text becomes 暂停).

### 3. Escape dismisses popups
Open the jump dialog, then press Escape.
**Verify:** `#jumpPop` is hidden.

**Pass condition:** Space toggles, arrows restart from adjacent sentences, Escape closes popups; keys typed inside inputs are unaffected.

## After Hook

### Teardown 1. Stop playback
Stop playback if running.
