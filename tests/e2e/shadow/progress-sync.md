# Progress cloud sync: pull, push, and latest-wins

## Summary
Verifies playback progress synchronizes across devices via the `user_data` table: cloud pull applies only when the cloud `pos.t` is newer than local `ielts-pos.t`, local newer wins, and `savePos()` debounce-pushes `pos` to cloud. Never interrupts active playback.

## Preconditions
- **Standard shadow preconditions** (see area conventions)
- **Environments:** local, preview
- **Markers:** @regression @positive @shadow

## Before Hook

### Setup 1. Clear local progress
Navigate to `{E2E_BASE_URL}/index.html`.
Remove `ielts-pos` from `localStorage`.
**Verify:** `localStorage.getItem('ielts-pos')` is null.

### Setup 2. Install fake Supabase client
Replace `CLOUD.client()` with a fake returning a fixed session and scripted `user_data` row. Record all `upsert` payloads on `window.__upserts`.
**Verify:** fake `getSession()` returns user id `test-user`.

## Test Steps

### 1. Cloud newer overwrites local
Script fake row to `{ marks: [], pos: { i: 20, t: <now> } }` with no local pos. Call `cloudPullMarks()`.
**Verify:** `ielts-pos.i` is 20 and global `idx` is 20 (jumped to cloud position).

### 2. Local newer wins
Set local `ielts-pos` to `{ i: 5, t: <now + 100s> }`. Script fake row to `{ marks: [], pos: { i: 20, t: 1000 } }`. Call `cloudPullMarks()`.
**Verify:** `ielts-pos.i` is still 5 (stale cloud ignored).

### 3. savePos debounce-pushes pos to cloud
Click sentence 30 (starts playback, sets idx). Wait 3s for the 2s debounce push.
**Verify:** last captured `upsert` payload has `pos.i` 30 and `user_id` `test-user`.

**Pass condition:** Newer side wins in both directions, push carries pos, and no error is thrown when cloud is unreachable (covered by existing offline specs).

## After Hook

### Teardown 1. Clear progress storage
Remove `ielts-pos` from `localStorage` and reload the page (restores real `CLOUD.client`).
