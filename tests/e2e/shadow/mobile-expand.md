# Mobile expand animation
<!-- status: new -->

## Summary
Verifies the audiobar mini-to-expanded transition on mobile (≤700px): CSS transitions fire, blur locks at 16px, and expanded layout doesn't stretch AB button.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Set mobile viewport
Navigate to `{E2E_BASE_URL}/index.html`.
Set viewport to 375×812 (iPhone-like).
**Verify:** `window.innerWidth <= 700`.

### Setup 2. Scroll into mini state
Fresh load is neither `body.scrolled` nor `force-mini`, so both expand/collapse buttons are `display:none`. Scroll down 600px and wait for `body.scrolled` (audiobar collapses to mini capsule, expand button appears).
**Verify:** `document.body` has `scrolled` class and `.ab-expand` is visible.

## Test Steps

### 1. Click expand button
Click `.ab-expand`.
**Verify:** `.audiobar` gains `expanded` class.

### 2. Blur locks at 16px
**Verify:** Computed `backdrop-filter` on `.audiobar.expanded` contains `blur(16px)`.

### 3. AB button not stretched
**Verify:** `#btnAB` in expanded state has computed `flex-grow: 0` (does not stretch to fill container; fixed width via `min-width: 4.2em`).

### 4. Click collapse button
Click `.ab-collapse` and wait 500ms.
**Verify:** `.audiobar` loses `expanded` class. Returns to mini state.

**Pass condition:** Mobile expand animation fires transitions, blur locks correctly, and layout doesn't stretch control buttons.

## After Hook

### Teardown 1. Reset viewport
Set viewport back to 1280×720.
