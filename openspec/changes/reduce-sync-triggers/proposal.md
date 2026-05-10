# Reduce Sync Triggers

## Problem

When the user returns to the app (switches tabs, focuses the window, restores from bfcache), a sync cycle fires immediately showing a spinner. This happens because three browser event listeners all trigger `sync()`:

- `visibilitychange` (visible)
- `focus`
- `pageshow` (persisted)

This causes two problems:
1. The spinner appears on every tab switch, creating visual noise
2. The user feels they shouldn't interact with the app while sync is running, delaying their workflow

## Goals

- G1: Eliminate sync-on-return-to-tab behavior that shows a spinner every time the user switches back
- G2: Maintain data freshness through remaining sync triggers (mount, periodic, post-mutation, online recovery)

## Non-Goals

- NG1: Changing the sync spinner UX (silent sync) — out of scope for this change
- NG2: Adding cooldown/throttle logic — unnecessary given the removal approach
- NG3: Changing periodic sync interval or debounce timing

## Functional Requirements

- FR1: Remove the `visibilitychange` event listener that triggers sync when tab becomes visible
- FR2: Remove the `focus` event listener that triggers sync when window receives focus
- FR3: Remove the `pageshow` event listener that triggers sync on bfcache restore

## Non-Functional Requirements

- NFR-P1: No impact on sync latency for user-initiated mutations (schedulePush remains unchanged)

## UX Acceptance Criteria

- UX1: Switching to the app tab does not show a sync spinner
- UX2: Data still syncs on app start, every 5 minutes, after mutations (15s debounce), and on network recovery

## Success Metrics

- M1: Zero sync triggers from tab/window focus events
- M2: User never sees a spinner solely from switching to the tab

## Tradeoffs Accepted

Changes made on another device will appear within up to 5 minutes (next periodic sync) instead of immediately on tab switch. Acceptable for a personal app with rare multi-device concurrent editing.

## Scope

One file: `packages/client/src/app/providers/SyncProvider.tsx` — remove three event listeners and their handler functions.
