# Implementation Tasks: Reduce Sync Triggers

## 1. Remove Event Listeners and Handlers (FR1, FR2, FR3)

- [x] 1.1 Remove `handleVisibilityChange` function definition from SyncProvider.tsx
- [x] 1.2 Remove `handleFocus` function definition from SyncProvider.tsx
- [x] 1.3 Remove `handlePageShow` function definition from SyncProvider.tsx
- [x] 1.4 Remove `window.addEventListener("focus", handleFocus)` from useEffect
- [x] 1.5 Remove `window.addEventListener("pageshow", handlePageShow)` from useEffect
- [x] 1.6 Remove `document.addEventListener("visibilitychange", handleVisibilityChange)` from useEffect
- [x] 1.7 Remove `window.removeEventListener("focus", handleFocus)` from useEffect cleanup
- [x] 1.8 Remove `window.removeEventListener("pageshow", handlePageShow)` from useEffect cleanup
- [x] 1.9 Remove `document.removeEventListener("visibilitychange", handleVisibilityChange)` from useEffect cleanup

## 2. Update Tests

- [x] 2.1 Remove `describe("SyncProvider — visibilitychange")` block from SyncProvider.test.tsx (lines 1090-1129)
- [x] 2.2 Verify no other tests reference the removed event listeners

## 3. Verification (UX1, UX2, M1, M2)

- [x] 3.1 Run `pnpm test` to ensure all tests pass
- [x] 3.2 Run `pnpm run build` to verify build succeeds
- [x] 3.3 Manual test: switch tabs → verify no spinner appears (UX1, M2)
- [x] 3.4 Manual test: verify sync still works on mount, periodic (5min), after mutations (15s debounce), and on network recovery (UX2)
- [x] 3.5 Verify no sync triggers from tab/window focus events (M1)
