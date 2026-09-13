# Vocab drawer on mobile
<!-- status: new -->

## Summary
Verifies the vocabulary panel (词库) on mobile: edge tab opens drawer, drag handle present, search filters, overlay click closes, and opaque background.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Set mobile viewport
Navigate to `{E2E_BASE_URL}/index.html`.
Set viewport to 375×812.
**Verify:** `window.innerWidth <= 700`.

## Test Steps

### 1. Edge tab opens vocab panel
Click the `#edgeTab` element.
**Verify:** `#panel` becomes visible. `body` gains `panel-open` class.

### 2. Drag handle present
**Verify:** `.drag-handle` element exists inside `#panel`.

### 3. Search filters words
Type "ocean" in the vocab search input.
**Verify:** Filtered results appear (count > 0). Search input value is "ocean".

### 4. Clear search shows all
Clear the search input.
**Verify:** Full word list restored (300 items visible with overflow hint).

### 5. Overlay click closes panel
Click on the overlay area (outside `#panel`).
**Verify:** `#panel` is hidden. `body` loses `panel-open` class.

**Pass condition:** Vocab drawer opens via edge tab, has drag handle, search filters correctly, and closes on overlay click.

## After Hook

### Teardown 1. Reset viewport and close panel
Set viewport back to 1280×720. Remove `panel-open` class from body.
