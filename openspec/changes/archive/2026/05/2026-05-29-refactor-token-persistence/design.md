## Context

`tokenManager.ts` persists access_token to localStorage on every `setAccessToken()` call and restores it from localStorage at module load. This was designed for GAS backend (no refresh_token). Supabase SDK manages its own session persistence with refresh_token — the extra localStorage writes are redundant and cause a race condition (AuthProvider:48-53 must skip restore for Supabase).

Currently, AuthProvider duplicates the localStorage restore logic with a backend-type check. The goal is to move persistence behavior into a strategy so tokenManager handles it cleanly.

**Key files:**
- `packages/client/src/services/tokenManager.ts` — token state + localStorage persistence
- `packages/client/src/app/providers/AuthProvider.tsx` — duplicates restore logic (lines 46-67)
- `packages/client/src/services/connectionService.ts` — provides `getBackendType()`, `disconnect()` removes token keys

## Goals / Non-Goals

**Goals:**
- G1 (from proposal): Persistence strategy determined by backend type, not hardcoded
- G2 (from proposal): New backends only need to implement `TokenPersistence`

**Non-Goals:**
- Changing Supabase SDK's own localStorage behavior
- Moving tokenManager to a class-based architecture
- Changing `getAccessToken()` / `setAccessToken()` public API signatures

## Decisions

### D1: Strategy interface with two implementations — driven by FR1-FR3

**Decision:** Define `TokenPersistence` interface with `save`, `load`, `clear`. Two implementations: `localStoragePersistence` (GAS) and `noopPersistence` (default).

**Why not check backend type directly:** If-guards (`if (type === "gas")`) inside tokenManager couple it to backend knowledge and require modification for every new backend. A strategy decouples the "what to persist" from "where to persist".

**Why not a class:** tokenManager is a simple module with shared state. A class adds ceremony (instantiation, singleton management) without benefit. The strategy is the only part that varies.

### D2: Explicit configuration via `configureTokenPersistence()` — driven by FR4, FR6

**Decision:** Export `configureTokenPersistence(strategy)` that sets the active strategy and calls `strategy.load()` to restore any persisted token. Default is `noopPersistence` (no persistence until configured).

**Why not auto-detect from connectionService:** Module-level auto-detection would create a dependency on connectionService import order and coupling. Explicit configuration makes the dependency visible and testable.

**Where to call:** In AuthProvider's `useState` initializer for GAS backend — same place that currently does manual localStorage restore. This preserves the timing: token is available before first render.

### D3: Keep `connectionService.disconnect()` localStorage cleanup as-is

**Decision:** `connectionService.disconnect()` (lines 53-55) directly removes `STORAGE_KEYS.ACCESS_TOKEN` and `ACCESS_TOKEN_EXPIRES_AT`. Keep this as-is — `localStorage.removeItem` on non-existent keys is harmless, and adding a cross-module call to `persistence.clear()` would create tighter coupling than the current approach.

### D4: AuthProvider delegates initial token to `getAccessToken()` — driven by FR7

**Decision:** Replace AuthProvider's 20-line `useState` initializer (lines 46-67) with `useState(() => getAccessToken())`. After `configureTokenPersistence(localStoragePersistence)` is called for GAS, `getAccessToken()` returns the restored token. For Supabase (default noop), it returns null — exactly what the current code does with its `if (config?.type === "supabase") return null` guard.

## Risks / Trade-offs

- **[Risk] Module-level code removal breaks GAS restore timing** → Mitigation: `configureTokenPersistence` is called in AuthProvider's `useState` initializer (synchronous, before first render), same timing as current module-level code.
- **[Risk] Existing tests assume localStorage persistence by default** → Mitigation: Tests that rely on localStorage must call `configureTokenPersistence(localStoragePersistence)` in setup. Tests for in-memory-only behavior use default (noop).
- **[Trade-off] Two objects instead of one** → Acceptable: `noopPersistence` is 3 lines, `localStoragePersistence` is ~15 lines. No file size concern.
