# Playback resumes from saved position after reload
<!-- status: compiled | spec: playwright-tests/journeys/shadow/playback-resume.spec.ts | date: 2026-09-12 -->

## Summary
Verifies reopening the page restores the last saved sentence position and scrolls it into view without autoplaying.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Save a known position
Navigate to `{E2E_BASE_URL}/index.html`, start playback from sentence 50, then pause.
**Verify:** `localStorage` key `ielts-pos` holds index 50.

## Test Steps

### 1. Reload the page
Reload.
**Verify:** `idx` equals 50, sentence 50 is inside the viewport, and the progress label reads chapter 1, 51/336.

### 2. No autoplay after reload
**Verify:** Play button text reads 播放 (position restored, playback not started).

**Pass condition:** Reload restores index 50 with the sentence in view and no autoplay.

## After Hook
_None — read-only test, no state created._
