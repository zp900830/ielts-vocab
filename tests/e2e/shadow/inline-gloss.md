# Inline gloss displays truncated Chinese meaning
<!-- status: new -->

## Summary
Verifies that inline gloss (tooltip) shows Chinese meaning truncated to 12 characters for multi-character words, HAND words show correct Chinese, and gloss HTML is properly generated.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Sentences render with `.w` word elements.

## Test Steps

### 1. Find a HAND word with gloss
Locate a `.w` element with a `data-word` attribute that is a HAND word (e.g., "smog", "oasis", "fume").
**Verify:** The element exists and has a gloss tooltip (`.gloss` or similar inline element).

### 2. Gloss shows Chinese meaning
**Verify:** The gloss text contains Chinese characters (not empty).

### 3. Gloss truncated to 12 chars
Get the gloss text content.
**Verify:** Length ≤ 12 characters (the `slice(0,12)` behavior).

### 4. Click word opens popup
Click the `.w` element.
**Verify:** `#pop` popup becomes visible. `#pw` shows the word. `#pm` shows full Chinese meaning (not truncated).

### 5. Gloss has two senses and no trailing separator
Scan all `.gl` inline glosses (meaning text after the `.gl-p` phonetic span).
**Verify:** ① at least one gloss contains two senses joined by `；`/`;` (twoSense > 0); ② no gloss ends with a trailing separator (`；`/`;`); ③ no gloss has an empty sense (no `empty-sense` problems).

**Pass condition:** Inline gloss shows truncated Chinese for HAND words, and clicking opens full popup.

## After Hook

### Teardown 1. Dismiss popup
Press Escape to close word popup if open.
