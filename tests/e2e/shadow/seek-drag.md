# Seek drag jumps playback to the dropped sentence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/seek-drag.spec.ts | date: 2026-09-12 -->

## Summary
Verifies dragging the progress track and releasing starts playback from the nearest sentence.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** The seek track is visible with a nonzero width.

## Test Steps

### 1. Drag to the middle and release
Press on the seek track, move to 50% of its width, release.
**Verify:** Playback starts (button text becomes 暂停) from a sentence near the middle of chapter 1, and `ielts-pos` matches it.

### 2. Zero-width guard
**Verify:** `seekToEvent` on a zero-width track returns the current index (finite), never NaN.

**Pass condition:** Drag-release starts playback at the dropped sentence with position saved; zero-width tracks cannot produce NaN.

## After Hook

### Teardown 1. Stop playback
Pause if playing.
