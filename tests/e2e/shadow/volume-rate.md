# Playback rate menu selection
<!-- status: new -->

## Summary
Verifies the playback rate menu: open menu, select rate, cycle button updates, and rate persists.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Open the app
Navigate to `{E2E_BASE_URL}/index.html`.
**Verify:** Rate cycle button (id `rateCycle`) is visible and shows "1x".

## Test Steps

### 1. Open rate menu
Click the `#rateCycle` button.
**Verify:** `.rate-menu` becomes visible (opacity 1, visibility visible).

### 2. Select 1.5x rate
Click the button with `data-mrate="1.5"` in the rate menu.
**Verify:** `#rateCycle` text changes to "1.5x". The `data-mrate="1.5"` button has `active` class. The `data-mrate="1"` button loses `active` class.

### 3. Rate persists after menu close
Click outside the rate menu to close it.
**Verify:** `#rateCycle` still shows "1.5x".

### 4. Reopen and verify persistence
Click `#rateCycle` again to reopen.
**Verify:** `data-mrate="1.5"` still has `active` class.

**Pass condition:** Rate menu opens, selection updates button text and active class, and persists across menu close/reopen.

## After Hook

### Teardown 1. Reset rate to 1x
Click the `data-mrate="1"` button to restore default.
**Verify:** `#rateCycle` shows "1x".
