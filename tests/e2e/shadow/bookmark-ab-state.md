# Bookmark popup A-B button state
<!-- status: new -->

## Summary
Verifies that A/B buttons in bookmark popup rows highlight with `ab-on` class when matching the current AB loop endpoints, and update in real-time as AB state changes.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Clear bookmarks
Navigate to `{E2E_BASE_URL}/index.html`.
**Wait for the text to render:** until the page has more than 50 elements with class `sent` (≤15s).
The bookmark list is filtered by `x.i < sents.length`, so writing indices 10/30/50 before the
article exists makes the popup render 0 rows — this is the whole reason the wait is here.
Remove `ielts-marks` from `localStorage`.
**Verify:** `getMarks()` returns `[]`.

### Setup 2. Add bookmarks
Call `addMark()` at indices 10, 30, 50.
**Verify:** `getMarks()` has 3 entries.

### Setup 3. Cancel any AB state
Call `abCancel()`.
**Verify:** `abMode === 0`.

## Test Steps

### 1. Open bookmark popup
Call `toggleMarkPop(true)`.
**Verify:** `#markPop` is visible with 3 `.mitem` rows.

### 2. Arm A-B loop (mode 1)
Click the AB button to arm.
**Verify:** `abMode === 1`. No row has `ab-on` class (A not yet selected).

### 3. Set A via bookmark row button
Click the first `.ab` button (A) on row for index 10.
**Verify:** Row for index 10 has `.ab-on` class on its first `.ab` button. `abStart === 10`, `abMode === 2`.

### 4. Set B via bookmark row button
Click the second `.ab` button (B) on row for index 30.
**Verify:** Row for index 30 has `.ab-on` class on its second `.ab` button. `abStart === 10`, `abEnd === 30`, `abMode === 3`. Row 10 still has A lit, row 30 has B lit.

### 5. Cancel AB clears all highlighting
Call `abCancel()`.
**Verify:** No rows have `ab-on` class. All buttons return to normal state.

**Pass condition:** Bookmark popup A/B buttons correctly highlight current loop endpoints and update in real-time.

## After Hook

### Teardown 1. Clear bookmarks and AB state
Remove `ielts-marks` from `localStorage`. Call `abCancel()`.
