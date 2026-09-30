# Hide translation and inline gloss toggles round-trip
<!-- status: compiled | spec: playwright-tests/journeys/shadow/hide-zh-gloss.spec.ts | date: 2026-09-30 -->

## Summary
Verifies the two topbar visibility switches: `#btnZh` (全句译文) and `#btnGloss` (行内词义) — body classes, button label/active flip, actual DOM hiding, `ielts-shadow-prefs` persistence across reload, and restore via UI.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 0. Clear prefs
Remove the `ielts-shadow-prefs` key from `localStorage` (the browser profile persists across runs).
**Verify:** `localStorage.getItem('ielts-shadow-prefs')` is `null`.

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** both switches are in default (shown) state: `body` has neither `hide-zh` nor `hide-gl`; `#btnZh` text is 隐藏全句译文 with `active` class; `#btnGloss` text is 隐藏行内词义 with `active` class; a `.sent-zh` element is displayed (`display != none`).

## Test Steps

### 1. Hide the sentence translations
Click the button whose accessible name is 显示或隐藏中文全句翻译 (`#btnZh`).
**Verify:** `body.hide-zh` is present; `#btnZh` text flips to 显示全句译文 and loses `active`; `aria-pressed="false"`; a `.sent-zh` element has `display: none`; `localStorage["ielts-shadow-prefs"]` parses to `{"hideZh": true}`.

### 2. Hide the inline glosses
Click the button whose accessible name is 显示或隐藏行内单词词义 (`#btnGloss`).
**Verify:** `body.hide-gl` is present; `#btnGloss` text flips to 显示行内词义 and loses `active`; a `.gl` element has `display: none`; `ielts-shadow-prefs` now parses to `{"hideZh": true, "hideGl": true}` (both keys survive together).

### 3. Both hides survive a reload
Navigate to `{E2E_BASE_URL}/index.html` again (cache-buster query allowed).
**Verify:** `body` has both `hide-zh` and `hide-gl`; both buttons read 显示…; a `.sent-zh` element has `display: none`.
KNOWN GAP (see area conventions, syncToggleAria initial-load race): right after load `aria-pressed` may still be `"true"` while the state is hidden — do **not** assert `aria-pressed` in this step; it self-heals on the next click.

### 4. Restore both via the UI
Click `#btnZh`, then `#btnGloss`.
**Verify:** `body` has neither `hide-zh` nor `hide-gl`; `#btnZh` reads 隐藏全句译文 and `#btnGloss` reads 隐藏行内词义 (both `active` again); `aria-pressed="true"` on both (click-time sync); `ielts-shadow-prefs` parses to `{"hideZh": false, "hideGl": false}`.

**Pass condition:** Each switch flips its body class, button label and stored pref together; hiding actually removes translations/glosses from layout; reload restores both; a second click restores the default view.

## After Hook

### Teardown 1. Clear prefs
Remove the `ielts-shadow-prefs` key from `localStorage` if present.
