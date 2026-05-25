## Context

The offline-first architecture is fully implemented but undocumented as a standalone capability. Sync orchestration spec covers triggers and recovery; sync protocol spec covers push/pull mechanics. This change fills the documentation gap for the user-facing offline guarantees and adds BDD tests for connection status derivation.

Context: driven by FR1-FR8 from proposal.

## Goals / Non-Goals

**Goals:**
- Document offline-mode as a self-contained spec with clear boundaries to sync-orchestration and sync-protocol
- Add BDD unit tests for connection status derivation (useConnectionStatus hook)
- Add BDD unit tests for offline data access guarantees

**Non-Goals:**
- Changing application code
- Duplicating scenarios already covered by sync_orchestration or sync_protocol features
- E2E offline testing (requires service worker and network-level mocking)

## Decisions

### D1: Spec scope — user-facing guarantees only

The offline-mode spec describes WHAT the user experiences, not HOW sync works internally. It covers:
1. Local-first data access (reads/writes always go to IndexedDB)
2. Connection status derivation (the state machine from config + auth + sync status)
3. Offline CRUD guarantees (data persists, dirty flag queues changes)

The spec explicitly references sync-orchestration and sync-protocol for recovery and push/pull mechanics.

### D2: BDD test organization

New feature files go into `packages/client/src/test/features/offline_mode/`:
- `connection_status.feature` — connection status derivation scenarios (FR4)
- `offline_data_access.feature` — offline CRUD and dirty flag guarantees (FR1-FR3, FR7-FR8)

Connection status tests use vitest-cucumber with mocked providers (same pattern as existing unit test). Offline data access tests verify repository behavior using fake-indexeddb.

### D3: No overlap with existing tests

Existing coverage:
- `sync_orchestration/sync_preconditions.feature` — covers navigator.onLine check at mount (FR5)
- `sync_orchestration/sync_recovery.feature` — covers ping recovery after offline (FR6 partially)
- `sync_protocol/sync_dirty_flag.feature` — covers hasEntityChanged and needsSync lifecycle (FR3 partially)
- `useConnectionStatus.test.ts` — plain unit tests for status derivation (FR4 partially)

New BDD tests fill the gap: connection status as executable Gherkin spec, and offline CRUD scenarios that verify data access without network.

## Risks / Trade-offs

- **Risk**: BDD tests for connection status may partially overlap with existing plain unit tests in `useConnectionStatus.test.ts`. Mitigation: BDD tests describe behavior in Gherkin (specification), plain tests remain as implementation-level checks. Both provide value.
- **Trade-off**: Not adding E2E offline tests limits verification to unit level. Accepted because true offline E2E requires service worker mocking which is not yet in the CI pipeline.
