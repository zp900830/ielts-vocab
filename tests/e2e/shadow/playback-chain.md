# Playback chain advances sentence by sentence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/playback-chain.spec.ts | date: 2026-09-12 -->

## Summary
Verifies continuous playback advances through sentences with highlight following and progress auto-saved.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Page title contains 影子跟读 and every sentence in the data renders (count derived from data).

## Test Steps

### 1. Start playback
Start playback.
**Verify:** Play button text becomes 暂停.

### 2. Chain advances
Wait for two utterance cycles.
**Verify:** A `.sent.playing` element exists and its text differs from the first sentence (chain moved past sentence 1).

### 3. Progress auto-saves
**Verify:** `localStorage` key `ielts-pos` exists with a valid sentence index.

### 4. Pause
Stop playback.
**Verify:** Play button text becomes 播放 and `ielts-pos` holds the paused index.

**Pass condition:** Play/pause toggles button text, highlight advances past the first sentence, and the paused index persists in `ielts-pos`.

### 5. 尾巴：倒数第一、二句不许被自己的预取掐掉
（2026-09-24 实测的 P1）把朗读引擎换成录音笔（`speak` 只把文本记进 `__seq`、不兑现结束），
对 `n-2` 与 `n-1` 各调一次 `playFrom(i)`。
**Verify:** 两次都满足 `spoken > 0`、`playing === true`、`.sent.playing` 的第 index 恰为目标句。
背景：`launch()` 里那条给 `fire3` 预取（`i+1/i+2`）用的 `i >= sents.length` 越界分支，
以前顺手写 `playing=false; idx=-1; paint()` —— 点倒数第 1/2 句时这句自己的预取把高亮和
`playing` 一起掐了（声音出来了、高亮没了、链子断在这儿）。整章收尾交给 completion 回调里
那条 `i + 1 >= sents.length`，越界分支只许 `return`。

## After Hook
_None — read-only test, no state created._
