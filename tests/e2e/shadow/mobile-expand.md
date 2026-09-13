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

### Setup 2. Ensure collapsed state
Force audiobar to collapsed state by removing `expanded` class.
**Verify:** `.audiobar` does not have `expanded` class.

## Test Steps

### 1. Click to expand
Click the audiobar (not on any button inside it).
**Verify:** `.audiobar` gains `expanded` class. Max-width transitions from mini value to full width.

### 2. Blur locks at 16px
**Verify:** Computed `backdrop-filter` on `.audiobar.expanded` contains `blur(16px)`.

### 3. AB button not stretched
**Verify:** `#btnAB` in expanded state has `flex: none` (computed style). Width is fixed, not stretching to fill container.

### 4. Click outside to collapse
Click outside the audiobar (e.g., on the article text).
**Verify:** `.audiobar` loses `expanded` class. Returns to mini state.

**Pass condition:** Mobile expand animation fires transitions, blur locks correctly, and layout doesn't stretch control buttons.

## After Hook

### Teardown 1. Reset viewport
Set viewport back to 1280×720.
