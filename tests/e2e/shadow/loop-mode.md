# Single-sentence loop repeats then advances
<!-- status: blocked | reason: repetition window is timing-nondeterministic in silent headless (cycles complete in ms when engine races, seconds when stalled); Step 2 needs a deterministic signal, e.g. assert loop stays active + advancement slower than unlooped baseline, or verify headed -->

## Summary
Verifies loop mode repeats the current sentence the configured times before moving on, and can be switched off.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Sentences render.

## Test Steps

### 1. Enable loop and play
Set loop count to 5 and start playback from sentence 10.
**Verify:** Loop button shows the active state and count `5`.

### 2. Sentence repeats
Poll (up to the retry-aware timeout) for the atomic state: repeat counter above 0 while the highlight is still on sentence 10. Count 5 widens the observation window versus count 3.
**Verify:** The conjunction holds at least once (repetition observed in place).

### 3. Loop completes and switch off
Wait until the highlight advances past sentence 10, then set loop count to 0.
**Verify:** Advancement happens and the loop button loses the active state.

**Pass condition:** Repetition is observed pinned at sentence 10, the chain eventually advances, and switching off clears the active state.

## After Hook

### Teardown 1. Stop playback and disable loop
Pause if playing and set loop count to 0 if active.
