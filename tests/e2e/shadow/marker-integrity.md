# Highlight markers stay whole in the rendered sentence
<!-- status: new -->

## Summary
Guards the shadowing corpus against `[[word:word]]ed`-style broken markers: the inflection
suffix must live **inside** the highlight. When it leaks outside, the learner sees the gloss
inserted mid-word and reads a misspelled token (`simplifyd`, `foreseed`, `purifyed`), which is
exactly what 22 markers did before this fix.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** sentences render and data is loaded.

## Test Steps

### 1. No orphan inflection suffix after a highlighted word
Walk every `.sent` node; for each text node that directly follows a `.w` (or its `.gl` gloss)
element, assert it does not begin with a lowercase letter.
**Verify:** zero offenders across all 1809 sentences.

### 2. Every highlighted word resolves in the dictionary
For each `.w`, assert `data-w` exists as a key in `VOCAB` and carries a meaning.
**Verify:** zero unresolved keys, zero entries missing `m`.

**Pass condition:** the rendered text contains no split-word highlights and every tappable word
has a dictionary entry behind it.

## After Hook
_None — read-only test._
