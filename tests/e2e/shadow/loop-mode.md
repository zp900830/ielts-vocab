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
Set loop count to 3 and start playback from sentence 10.
**Verify:** Loop button shows the active state and count `3`.

### 2. Sentence repeats
Wait for two utterance cycles.
**Verify:** The highlight stays on sentence 10 while the repeat counter advances past 0.

### 3. Switch loop off
Set loop count to 0.
**Verify:** Loop button loses the active state.

**Pass condition:** Loop repeats the same sentence with counter advancing; switching off clears the active state.

## After Hook

### Teardown 1. Stop playback and disable loop
Pause if playing and set loop count to 0 if active.
