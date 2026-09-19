# Vocabulary search filters and counts
<!-- status: compiled | spec: playwright-tests/journeys/shadow/vocab-search.spec.ts | date: 2026-09-12 -->

## Summary
Verifies the word-bank search filters by keyword and shows match/total counts.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** `#vlist` contains items and `#vcnt` shows the total.

## Test Steps

### 1. Search for a word
Before typing, read the total out of `#vcnt` (the `N` in `… / N词`) and keep it as `{vocabTotal}`.
Type `oxygen` into the search input and wait for the debounced render.
**Verify:** Exactly 1 `.item` renders and `#vcnt` reads `1 / {vocabTotal}词`.
Do not hardcode the word count — it changes every time a card is added, and a hardcoded
number turns a content change into a red test.

### 2. Clear the search
Clear the search input.
**Verify:** The list truncates at 300 rendered items with an overflow hint.

**Pass condition:** Keyword search narrows to the exact match with correct counts; empty search caps rendering with a hint.

## After Hook
_None — read-only test, no state created._
