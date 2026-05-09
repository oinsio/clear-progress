## Context

The `useMenuOrder` hook is used in two places simultaneously:
1. `MenuOrderSection` (settings) — writes via `setMenuOrder`
2. `RightFilterPanel` (navigation) — reads `menuOrder`

The current broadcast mechanism is broken: `useEffect([])` fires only on mount, so the event is not dispatched on subsequent `setMenuOrder` calls.

## Goals / Non-Goals

**Goals:**
- Reliable cross-instance reactivity via `useSyncExternalStore` (FR1)
- Easily testable architecture: store separated from React

**Non-Goals:**
- Replacing localStorage with another storage mechanism
- Switching to an external state manager (zustand, jotai)

## Decisions

### D1: useSyncExternalStore instead of custom event broadcast

Split into two modules:
- **`stores/menuOrderStore.ts`** — external store (plain TypeScript, no React). Contains module-level snapshot, subscribers Set, `getSnapshot()`, `subscribe()`, `setMenuOrder()`. All logic (Zod validation, migration, localStorage persistence) lives here.
- **`hooks/useMenuOrder.ts`** — thin wrapper (~10 lines): `useSyncExternalStore(subscribe, getSnapshot)`.

**Why not patch event-dispatch:** Ref-based broadcast is the same category of fragile code that caused the original bug. `useSyncExternalStore` is the canonical React 18 API for external stores, eliminating this entire class of problems.

**Why not module-level store without useSyncExternalStore:** Would require manually implementing subscriptions and tearing prevention — exactly what `useSyncExternalStore` provides out of the box.

### D2: Removal of MENU_ORDER_CHANGED_EVENT

The custom event `MENU_ORDER_CHANGED_EVENT` is no longer needed — subscription via the store's `subscribe()` replaces it. The constant is only used in `useMenuOrder.ts`.

### D3: _resetForTesting() for tests

The store uses module-level state, so a reset is needed between tests. We export `_resetForTesting()` (underscore prefix signals: for tests only).

## Risks / Trade-offs

**[Risk]** Referential stability: if `getSnapshot()` returns a new array on every call, `useSyncExternalStore` will cause infinite re-renders.
> **Mitigation**: `currentSnapshot` is only updated inside `setMenuOrder()`, `getSnapshot()` returns the same reference between calls.

**[Risk]** Module-level state in tests: without a reset, one test can affect another.
> **Mitigation**: `_resetForTesting()` is called in `beforeEach`.
