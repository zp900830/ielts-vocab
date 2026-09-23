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

### 3. Reaching the end of a chapter keeps the resume point
Force the **real** end-of-chapter path: stub `speak` to capture the callback, `playFrom(last)`, then
fire that callback (it stands for "末句 onend 到了") so the completion handler's `i + 1 >= sents.length`
branch runs.
> Do **not** simulate it with `launch(sents.length, ...)` any more — 2026-09-24 that overshoot branch
> was changed to "越界只可能是预取，绝不许碰正在念的那句的状态", because it used to kill `playing`/`idx`
> on sentences 倒数第 1/2 句 (see `playback-chain` case 5).
**Verify:** `idx === -1` and `ielts-pos` records the **last** sentence — `i === chapterSentStart + last` when a chapter is selected (`chapterI === last` too), `i === last` in the default 全部文章 view — never `i: 0`. Reloading then restores the reader to the last sentence instead of throwing them back to the beginning.

**Pass condition:** Reload restores index 50 with the sentence in view and no autoplay, and finishing a chapter leaves the resume point on its last sentence rather than resetting to sentence 1.

## After Hook
_None — read-only test, no state created._
