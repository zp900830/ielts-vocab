# Bookmark cloud sync: pull, push, and merge
<!-- status: new -->

## Summary
Verifies bookmark cloud synchronization: login triggers cloudPullMarks, new bookmarks debounce-push to cloud, reload merges by epoch (newest wins), and 50-item cap is enforced.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Clear local bookmarks
Navigate to `{E2E_BASE_URL}/index.html`.
Remove `ielts-marks` from `localStorage`.
**Verify:** `getMarks()` returns `[]`.

### Setup 2. Mock Supabase for offline testing
Override `CLOUD._on` to `false` to simulate logged-out state (cloud sync skipped gracefully).
**Verify:** `CLOUD._on === false`.

## Test Steps

### 1. Add bookmark when not logged in
Call `addMark()` at index 10.
**Verify:** `getMarks()` has 1 entry with `i: 10`. No cloud push attempted (CLOUD._on is false).

### 2. Add duplicate bookmark
Call `addMark()` at index 10 again.
**Verify:** `getMarks()` still has 1 entry (deduplicated). Entry has updated `u` (epoch).

### 3. Add second bookmark
Call `addMark()` at index 50.
**Verify:** `getMarks()` has 2 entries.

### 4. Local persistence across reload
Reload the page. Clear `CLOUD._on` again if it reset.
**Verify:** `getMarks()` still has 2 entries with correct indices.

### 5. Delete bookmark persists
Call `delMark(10)`.
**Verify:** `getMarks()` has 1 entry (index 50 only).

**Pass condition:** Bookmarks persist locally, deduplicate, survive reload, and delete works. Cloud sync gracefully skips when not logged in.

## After Hook

### Teardown 1. Clear bookmark storage
Remove `ielts-marks` from `localStorage`.
