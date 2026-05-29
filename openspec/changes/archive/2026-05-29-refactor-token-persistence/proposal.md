# Refactor Token Persistence

## Why

`tokenManager` always persists access_token to localStorage regardless of backend type. This was needed for GAS (no refresh_token — localStorage lets users avoid re-login for ~1 hour). For Supabase this is redundant: the SDK manages its own session with refresh_token in localStorage and auto-refreshes. The duplication creates a race condition (AuthProvider must skip localStorage restore for Supabase to avoid 401s before SDK initializes). Introducing a strategy pattern makes token storage extensible for future backends without if-guards.

## What Changes

- **ADDED**: `TokenPersistence` interface with two implementations: `localStoragePersistence` (GAS) and `noopPersistence` (Supabase/default)
- **MODIFIED**: `tokenManager` uses injected persistence strategy instead of hardcoded localStorage calls
- **MODIFIED**: `tokenManager` no longer runs module-level localStorage restore — persistence is configured explicitly via `configureTokenPersistence()`
- **MODIFIED**: `AuthProvider` simplified — delegates token restore to tokenManager instead of duplicating localStorage logic

## Capabilities

### New Capabilities

_None_ — this is an internal refactoring with no new user-facing capabilities.

### Modified Capabilities

- `supabase-auth`: Token persistence behavior changes — Supabase path no longer writes/reads custom localStorage keys for access_token. Session persistence is fully delegated to Supabase SDK.

## Goals

- G1: Token persistence strategy is determined by backend type, not hardcoded
- G2: Adding a new backend type requires only implementing `TokenPersistence`, not modifying tokenManager internals

## Non-Goals

- NG1: Changing Supabase SDK's own localStorage behavior (it manages `sb-*-auth-token` key independently)
- NG2: Removing GAS localStorage persistence (still needed — no refresh_token)
- NG3: Changing the public API shape of `getAccessToken()` / `setAccessToken()`

## Users & Scenarios

- U1: User with Supabase backend — token stored only in memory (SDK handles persistence via refresh_token)
- U2: User with GAS backend — token stored in localStorage as before (survives page reload for ~1 hour)
- U3: User switching backends — persistence strategy reconfigured on backend change

## Requirements

### Functional

- FR1: `TokenPersistence` interface SHALL define `save(token, expiresAt)`, `load()`, and `clear()` methods
- FR2: `localStoragePersistence` SHALL read/write `STORAGE_KEYS.ACCESS_TOKEN` and `ACCESS_TOKEN_EXPIRES_AT` in localStorage (current GAS behavior)
- FR3: `noopPersistence` SHALL be a no-op implementation (all methods do nothing / return null)
- FR4: `configureTokenPersistence(strategy)` SHALL set the active strategy and call `load()` to restore token from the strategy
- FR5: `setAccessToken()` SHALL delegate persistence to the active strategy instead of directly calling localStorage
- FR6: Default persistence (before `configureTokenPersistence` is called) SHALL be `noopPersistence`
- FR7: AuthProvider SHALL call `configureTokenPersistence(localStoragePersistence)` for GAS backend before reading initial token state

### Non-Functional

#### Performance

- NFR-P1: No additional localStorage reads per token operation — same or fewer reads than current implementation

## UX Acceptance Criteria

- UX1: GAS users experience no change — token survives page reload within expiry window
- UX2: Supabase users experience no change — SDK handles session restore transparently

## Behavior

No new Gherkin scenarios — this is an internal refactoring. Existing auth behavior is preserved.

## Visual Reference

No UI changes.

## Affected IA

No changes.

## Success Metrics

- M1: All existing tokenManager tests pass (adapted to new API)
- M2: All existing AuthProvider tests pass
- M3: No localStorage keys `access_token` / `access_token_expires_at` written when Supabase backend is active
- M4: Mutation testing score >=90% on tokenManager

## Open Questions

_None_
