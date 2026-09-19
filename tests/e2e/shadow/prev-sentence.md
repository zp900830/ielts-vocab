# Play bar "previous sentence" rewinds one sentence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/prev-sentence.spec.ts | date: 2026-09-18 -->

## Summary
Verifies that pressing 上一句 rewinds exactly one sentence and submits only that sentence to the
speech engine, instead of queueing lookahead siblings behind a just-cancelled engine.

Regression background: `playFrom()` fired the target sentence **plus two lookahead siblings** 250 ms
after `speechSynthesis.cancel()`. Chrome swallows utterances submitted right after a cancel, and any
sibling that survived could not start before the 6 s silent-watchdog expired — that watchdog retried
with a single-shot `speak()`, which cancelled the whole queue again, so the highlight jumped ahead and
the previous sentence was never read.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** The article renders every sentence in <code>data/sections.json</code> (count derived from data, not hardcoded).

## Test Steps

### 1. Start playback at sentence 6
Call `playFrom(6)` directly rather than waiting for the chain to advance.
**Verify:** The play button reads 暂停 and `idx === 6`.

_Rationale: the macOS speech engine is process-wide and shared, so waiting for real audio to advance
the chain makes the case flaky; what this case asserts is what the cut submits, which is observable
without audio._

### 2. Press 上一句
Instrument `speak()` to count submissions, then press 上一句.
**Verify:** `idx` becomes exactly `5`, and the highlighted `.sent.playing` element is sentence 5.

### 3. Only the target sentence is submitted
Wait 600 ms (the cut delays submission by 250 ms for the Chrome swallow workaround).
**Verify:** At most one utterance was handed to the speech engine — never the old burst of three.

**Pass condition:** 上一句 rewinds exactly one sentence and submits only that sentence.

## After Hook

### Teardown 1. Stop playback
Pause if still playing so the next case starts from a quiet engine.
