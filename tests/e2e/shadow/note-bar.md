# Note bar under sentences with analysis-worthy words

## Summary
Verifies 辨析 cards render below sentences containing words with a `note` field: card shows word, phonetics, full meaning and the analysis line; sentences without noted words have no card; tapping the card word opens the popup.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** `.sent` first is visible.

## Test Steps

### 1. Note bar renders for swear
Find `.notebar` containing `swear at sb`.
**Verify:** card exists; `.nb-t` has `swear`; `.nb-n` contains `辨析`.

### 2. Sentences without noted words have no card
Each `.notebar` must follow `.sent`/`.sent-zh` (or another `.notebar` when one sentence holds several noted words); sampled plain sentences have no `.notebar` after them.
**Verify:** structural check passes.

### 3. Card word opens popup
Click `.notebar .w` inside the swear card.
**Verify:** `#pop` is visible and `#pw` shows the word.

**Pass condition:** Cards render only where notes exist, content complete, word tap opens popup.

## After Hook

### Teardown 1. Dismiss popup
Press Escape.
