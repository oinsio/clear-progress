# Design: Reduce Sync Triggers

## Context

The `SyncProvider` component currently listens to three browser events that trigger sync when the user returns to the app:
- `visibilitychange` (when tab becomes visible)
- `focus` (when window receives focus)
- `pageshow` (when page is restored from bfcache)

Each of these events calls `sync()`, which shows a spinner and blocks perceived interactivity. This creates visual noise on every tab switch.

The app already has other sync triggers that maintain data freshness:
- Mount sync (when SyncProvider mounts)
- Periodic sync (every 5 minutes via `setInterval`)
- Post-mutation sync (via `schedulePush` with 15s debounce)
- Online recovery (via `online` event listener + ping interval)

## Goals / Non-Goals

**Goals:**
- G1: Remove sync-on-return-to-tab behavior (implements FR1, FR2, FR3)
- G2: Maintain data freshness through remaining sync triggers

**Non-Goals:**
- NG1: Changing the sync spinner UX (silent sync) — out of scope
- NG2: Adding cooldown/throttle logic — unnecessary given the removal approach
- NG3: Changing periodic sync interval or debounce timing

## Decisions

### Decision 1: Remove event listeners entirely (not throttle/cooldown)

**Rationale:** The proposal explicitly states that cooldown/throttle is unnecessary (NG2). The remaining sync triggers (mount, periodic, post-mutation, online recovery) are sufficient for a personal app with rare multi-device concurrent editing.

**Alternatives considered:**
- Throttle/cooldown on return-to-tab events → Rejected: adds complexity without addressing the core UX issue (spinner still appears, just less frequently)
- Silent sync on return-to-tab → Rejected: out of scope (NG1)

### Decision 2: Keep `online` event listener

**Rationale:** The `online` event listener triggers `performPing()`, not `sync()` directly. It's part of the network recovery mechanism and does not show a spinner immediately — it only starts the ping interval. This is distinct from the return-to-tab triggers being removed.

### Decision 3: Remove handler functions along with listeners

**Rationale:** The handler functions (`handleVisibilityChange`, `handleFocus`, `handlePageShow`) will have no other callers after removing the event listeners. Keeping dead code violates the codebase's cleanliness standards.

## Risks / Trade-offs

**Risk:** Changes made on another device will appear within up to 5 minutes (next periodic sync) instead of immediately on tab switch.

**Mitigation:** Acceptable for a personal app with rare multi-device concurrent editing (stated in proposal's "Tradeoffs Accepted" section). User-initiated mutations still sync within 15 seconds via `schedulePush`.

**Risk:** Tests covering the removed event listeners will fail.

**Mitigation:** Remove the corresponding test cases in `SyncProvider.test.tsx` (the `describe("SyncProvider — visibilitychange")` block and any tests for `focus`/`pageshow` if they exist).

## Implementation Notes

**File to modify:** `packages/client/src/app/providers/SyncProvider.tsx`

**Changes:**
1. Remove handler function definitions:
   - `handleVisibilityChange`
   - `handleFocus`
   - `handlePageShow`
2. Remove event listener registrations in the `useEffect` cleanup:
   - `window.addEventListener("focus", handleFocus)`
   - `window.addEventListener("pageshow", handlePageShow)`
   - `document.addEventListener("visibilitychange", handleVisibilityChange)`
3. Remove event listener cleanup in the `useEffect` return:
   - `window.removeEventListener("focus", handleFocus)`
   - `window.removeEventListener("pageshow", handlePageShow)`
   - `document.removeEventListener("visibilitychange", handleVisibilityChange)`

**Tests to remove:** `packages/client/src/app/providers/SyncProvider.test.tsx`
- Remove the entire `describe("SyncProvider — visibilitychange")` block (lines 1090-1129 based on current file)
- Check for and remove any tests covering `focus` and `pageshow` events (none found in current file)

**Verification:**
- Run `pnpm test` to ensure all tests pass after removal
- Manually verify: switch tabs → no spinner appears
- Manually verify: data still syncs on mount, every 5 minutes, after mutations, and on network recovery
