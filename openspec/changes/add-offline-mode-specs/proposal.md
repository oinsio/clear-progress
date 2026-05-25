# Add Offline Mode Specs

## Why

The app follows a client-first (offline-first) architecture: all data lives in IndexedDB, UI never blocks on network, and changes sync asynchronously. This behavior is fully implemented — but there is no dedicated OpenSpec specification for offline mode as a user-facing capability. Sync orchestration and sync protocol specs cover _how_ sync works, but not the offline-first guarantees from the user's perspective: local-first data access, connection status feedback, seamless offline CRUD, and data durability across restarts.

Additionally, BDD tests exist for sync orchestration (triggers, recovery, cleanup) but not for connection status derivation or offline data access patterns.

## What Changes

- **ADDED**: OpenSpec specification for offline mode (`openspec/specs/offline-mode/spec.md`)
- **ADDED**: BDD unit tests (vitest-cucumber) for connection status derivation logic
- **ADDED**: BDD unit tests for offline data access guarantees (CRUD works without network)

## Goals

- G1: Every offline-mode business rule has an executable Gherkin specification
- G2: Connection status derivation logic is covered by BDD scenarios

## Non-Goals

- NG1: Changing any application code — this is documentation and tests only
- NG2: Duplicating sync orchestration or sync protocol specs — this spec covers what they don't
- NG3: E2E tests for offline mode — real offline testing requires service worker and network simulation beyond current CI capabilities
- NG4: Adding new offline features (e.g., offline queue UI, conflict resolution UI)

## Users & Scenarios

- U1: Developer changes useConnectionStatus logic -> BDD tests catch regressions in status derivation
- U2: Developer modifies SyncProvider offline detection -> BDD tests verify offline status is set correctly
- U3: New developer reads spec.md -> understands offline-first guarantees without reading implementation code
- U4: Developer changes repository layer -> tests verify data access works regardless of network state

## Requirements

### Functional

- FR1: All data reads come from IndexedDB — never block on network availability
- FR2: All data writes go to IndexedDB first — network sync happens asynchronously
- FR3: Local changes are marked with `needsSync=true` and persist until server confirms
- FR4: Connection status is derived from backend config, auth state, and sync status in priority order: not_configured > no_auth > offline > error > unauthorized > syncing > synced
- FR5: When `navigator.onLine` is false at mount, sync status is set to "offline" without attempting sync
- FR6: When network becomes unavailable during operation, sync status transitions to "offline" or "error"
- FR7: Data created/updated/deleted while offline is preserved in IndexedDB and synced when connection restores
- FR8: The app is fully functional for CRUD operations without any backend configured (not_configured state)

### Non-Functional

#### Performance

- NFR-P1: All CRUD operations complete within IndexedDB response time — no network latency in the critical path

## UX Acceptance Criteria

- UX1: Sync indicator shows current connection state (syncing spinner, synced checkmark, error/offline red badge)
- UX2: User can create, read, update, and delete entities with no visible difference between online and offline states
- UX3: Unsynced records show amber left border indicator

## Behavior

See `packages/client/src/test/features/offline_mode/*.feature` (tags `@add-offline-mode-specs`)

## Affected IA

No changes.

## Success Metrics

- M1: All BDD unit scenarios pass (100% green)
- M2: Connection status derivation has 100% branch coverage via BDD scenarios
- M3: Mutation testing score >= 95% on useConnectionStatus

## Open Questions

_No open questions._

## Capabilities

### New Capabilities

- `offline-mode`: Client-first data access, connection status derivation, and offline CRUD guarantees

### Modified Capabilities

_No changes to existing specs._

## Impact

- `openspec/specs/offline-mode/` — new spec
- `packages/client/src/test/features/offline_mode/` — new BDD tests
- No application code changes
