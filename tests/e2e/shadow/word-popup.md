# Word popup shows phonetics, meaning and example
<!-- status: compiled | spec: playwright-tests/journeys/shadow/word-popup.spec.ts | date: 2026-09-12 -->

## Summary
Verifies clicking a marked word opens the popup with UK/US phonetics, Chinese meaning and example sentence.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** At least one `.w` element exists.

## Test Steps

### 1. Open the popup
Click the first `.w` element.
**Verify:** `#pop` is visible, `#pw` shows `atmosphere`, `#ppUK` contains `/ˈætməsfɪə/`, `#pm` shows `n. 大气；气氛；氛围` (no trailing separator).

### 2. Dismiss the popup
Press Escape.
**Verify:** `#pop` is hidden.

**Pass condition:** Popup displays word, both phonetics and clean meaning; Escape dismisses it.

## After Hook
_None — read-only test, no state created._
