# Jump dialog lists chapters and jumps to a sentence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/jump-dialog.spec.ts | date: 2026-09-12 -->

## Summary
Verifies the quick-jump popup lists all chapters with counts and jumps to the chosen sentence.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Sentences render.

## Test Steps

### 1. Open the jump dialog
Trigger `toggleJumpPop(true)`.
**Verify:** `#jumpCh` holds 6 chapter options and `#jumpHint` mentions the chapter sentence count.

### 2. Jump to chapter 1 sentence 1
Select chapter 1, enter sentence 1, confirm.
**Verify:** Playback starts from the first sentence (button text becomes 暂停).

**Pass condition:** Dialog lists 6 chapters with correct hints; confirming starts playback at the chosen sentence.

## After Hook

### Teardown 1. Stop playback
Stop playback if running.
