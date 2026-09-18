# A-B loop: arm, select, loop, and cancel
<!-- status: new -->

## Summary
Verifies the A-B loop state machine: arm A via AB button, tap sentences to set A/B points, auto-normalize reverse, loop within range, and cancel via AB button or float tab.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Page title contains 影子跟读 and sentences render.

### Setup 2. Ensure AB loop is off
Call `abCancel()` to reset any prior AB state.
**Verify:** `abMode === 0`.

## Test Steps

### 1. Arm A-B loop
Click the AB button (name "AB").
**Verify:** Button text changes to "设A" and `abMode === 1`. Toast message indicates "点句子...设为起点A".

### 2. Set A by tapping a sentence
Tap sentence at index 10 (`.sent` nth(10)).
**Verify:** `abMode === 2`, `abStart === 10`, button text changes to "设B". Toast confirms "起点A：第11句". Sentence 10 gets class `ab-a`.

### 3. Set B by tapping another sentence
Tap sentence at index 20 (`.sent` nth(20)).
**Verify:** `abMode === 3`, `abStart === 10`, `abEnd === 20`. Toast shows "A-B循环：第11~21句，共11句". Sentences 10-20 get class `ab-in`. Sentence 10 has `ab-a`, sentence 20 has `ab-b`. Button text returns to "AB" with class `ab-active`.

### 4. Reverse selection auto-normalize
Set A to index 30, then set B to index 15.
**Verify:** `abStart === 15`, `abEnd === 30` (auto-corrected). Toast shows range 16~31. CSS classes applied correctly (15=`ab-a`, 30=`ab-b`).

### 5. Single-sentence loop
Set A and B to the same sentence (index 5).
**Verify:** `abStart === 5`, `abEnd === 5`. Toast says "单句循环：第6句". Only sentence 5 has `ab-a` class (no `ab-b` since a===b). `ab-in` applied to sentence 5.

### 6. Cancel via AB button
With loop active, click the AB button.
**Verify:** `abMode === 0`, `abStart === -1`, `abEnd === -1`. Button text is "AB", no `ab-active` or `ab-arm` classes. All `ab-a`/`ab-b`/`ab-in` classes removed from sentences. Toast says "A-B循环已取消".

### 7. Tapping a sentence outside the range exits and jumps there
With loop 10–20 active, dispatch a click on sentence 40 itself (`sents[40].click()`, not on a word inside it).
**Verify:** `abMode === 0` (the loop exited — previously the tap was silently swallowed and the loop kept running), and playback restarted at or after index 40 (`idx >= 40`, `playing === true`).

### 8. The exit chip is visible while looping and cancels on tap
Re-arm loop 10–20, then check `#abLive`.
**Verify:** `#abLive` is displayed with text `A-B 循环中：第 11–21 句 · 点击退出`. Tapping it sets `abMode === 0` and hides the chip (`display: none`).

**Pass condition:** AB state machine transitions correctly through all states (0→1→2→3), reverse selection normalizes, single-sentence loop works, cancel resets all state, an out-of-range tap exits instead of doing nothing, and the persistent exit chip tracks the loop state.

## After Hook

### Teardown 1. Cancel any active AB loop
Call `abCancel()` to ensure clean state.
