# Dark mode toggle round-trip and persistence
<!-- status: compiled | spec: playwright-tests/journeys/shadow/dark-mode.spec.ts | date: 2026-09-30 -->

## Summary
Verifies the 夜间模式 toggle: on/off round-trip (body/html class, theme-color meta, icon swap), `ielts-dark` persistence across reload, and clean default when the key is absent.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 0. Clear dark-mode key
Remove the `ielts-dark` key from `localStorage` (the browser profile persists across runs).
**Verify:** `localStorage.getItem('ielts-dark')` is `null`.

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** default is light mode: `body` has no `dark` class, `meta[name=theme-color]` is `#faf8f4`, `#btnDark` icon is `ri-moon-line`.

## Test Steps

### 1. Turn dark mode on
Click the button whose accessible name is 切换夜间模式 (`#btnDark`).
**Verify:** `body.dark` and `html.dark` are both present; `meta[name=theme-color]` is `#1c1a17`; `#btnDark` icon is `ri-sun-line`; `localStorage.ielts-dark` is `"1"`.

### 2. Dark mode survives a reload
Navigate to `{E2E_BASE_URL}/index.html` again (cache-buster query allowed).
**Verify:** still dark after load: `body.dark` present, icon `ri-sun-line`, `ielts-dark` still `"1"`.

### 3. Turn dark mode back off
Click 切换夜间模式 again.
**Verify:** `body.dark` and `html.dark` are absent; `meta[name=theme-color]` is `#faf8f4`; icon is `ri-moon-line`; `ielts-dark` is `"0"`.

**Pass condition:** Toggle flips all four coupled states (class, theme-color, icon, storage) in both directions, and the on-state survives a reload.

## After Hook

### Teardown 1. Remove dark-mode key
Remove the `ielts-dark` key from `localStorage` if present (back to scheme-following default).
