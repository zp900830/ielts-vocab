# Bookmarks save, deduplicate, jump and delete
<!-- status: compiled | spec: playwright-tests/journeys/shadow/bookmarks.spec.ts | date: 2026-09-12 -->

## Summary
Verifies manual bookmarks persist, deduplicate, jump back and delete.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 0. Clear bookmark storage
Remove the `ielts-marks` key from `localStorage` (the browser profile persists across runs).
**Verify:** `getMarks()` returns `[]`.

### Setup 1. Open the app with a known position
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Sentences render.

## Test Steps

### 1. Save the current position twice
Open the bookmark popup and trigger `addMark()` twice.
**Verify:** `localStorage` key `ielts-marks` holds exactly 1 entry (deduplicated) and 1 `.mitem` renders.

### 2. Jump to the bookmark
Trigger `jumpMark()` for the saved index.
**Verify:** Playback starts and the button text becomes 暂停.

### 3. Delete the bookmark
Trigger `delMark()` for the saved index.
**Verify:** `ielts-marks` is empty.

**Pass condition:** Duplicate saves collapse to one entry, jump resumes playback, delete clears storage.

## After Hook

### Teardown 1. Clear bookmark storage
Remove the `ielts-marks` key from `localStorage` if present.
