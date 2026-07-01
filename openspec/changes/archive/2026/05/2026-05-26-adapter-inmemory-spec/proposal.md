# Adapter In-Memory Spec

## Why

The in-memory SyncAdapter implementation (`packages/adapter-inmemory`) is used as the test double for unit and E2E tests across the entire project. It implements the full SyncAdapter contract (ping, init, push, pull, covers, purge) but lacks formal specifications and BDD tests. Other adapters (GAS, Supabase) and related features (sync protocol, adapter loader) all have dedicated openspec specs and BDD tests. The in-memory adapter is a gap in documentation coverage, making it harder to verify correctness of test infrastructure and detect regressions.

## What Changes

- **ADDED**: OpenSpec capability spec for the in-memory sync adapter (lifecycle, push/pull, validation, conflict resolution, cover management, purge, settings)
- **ADDED**: BDD feature files covering all InMemorySyncAdapter behaviors
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every in-memory adapter behavior has a formal specification in openspec
- G2: BDD feature files cover all adapter operations (ping, init, push, pull, covers, purge, settings)
- G3: Close the documentation gap between adapter-inmemory and other adapter packages

## Non-Goals

- NG1: No changes to InMemorySyncAdapter implementation code
- NG2: No E2E/Playwright tests (adapter is internal test infrastructure)
- NG3: No changes to the shared SyncAdapter contract tests (already exist in packages/contract)
- NG4: No changes to other adapter implementations (GAS, Supabase)

## Users & Scenarios

- U1: Developer maintaining the in-memory adapter — uses specs as reference for expected behavior
- U2: AI agent implementing a new SyncAdapter — uses in-memory adapter specs to understand the contract requirements and edge cases

## Requirements

### Functional

- FR1: Spec documents lifecycle operations (ping returns initialized status, init sets initialized flag, init is idempotent)
- FR2: Spec documents push operation (entity creation with revision assignment, accepted status for updates with newer timestamp)
- FR3: Spec documents pull operation (filtering by since_revision, current_revision tracking, empty state response)
- FR4: Spec documents entity validation (UUID format check, blank name rejection, invalid box rejection)
- FR5: Spec documents conflict resolution (server-wins when server updated_at is newer, conflict status with server_record)
- FR6: Spec documents settings push/pull (key-based storage, conflict resolution by updated_at, filtering by settings_updated_at)
- FR7: Spec documents single cover upload (new upload, deduplication via data_hash with ref_count increment)
- FR8: Spec documents batch cover upload (batch processing, max batch size limit, partial failure on invalid mime type)
- FR9: Spec documents cover retrieval (by hash array, error for missing covers)
- FR10: Spec documents cover deletion (ref_count decrement, physical deletion at ref_count zero, idempotent delete of missing cover)
- FR11: Spec documents purge operation (removal of soft-deleted entities, purge_revision increment, non-deleted entities preserved)
- FR12: BDD scenarios cover all adapter operations with passing step definitions

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/adapter_inmemory/adapter_inmemory_lifecycle.feature` — @adapter-inmemory-spec @FR1
- `features/adapter_inmemory/adapter_inmemory_push.feature` — @adapter-inmemory-spec @FR2 @FR4 @FR5
- `features/adapter_inmemory/adapter_inmemory_pull.feature` — @adapter-inmemory-spec @FR3
- `features/adapter_inmemory/adapter_inmemory_settings.feature` — @adapter-inmemory-spec @FR6
- `features/adapter_inmemory/adapter_inmemory_covers.feature` — @adapter-inmemory-spec @FR7 @FR8 @FR9 @FR10
- `features/adapter_inmemory/adapter_inmemory_purge.feature` — @adapter-inmemory-spec @FR11

## Affected IA

No changes.

## Success Metrics

- M1: 100% of in-memory adapter behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

(none)

## Capabilities

### New Capabilities

- `adapter-inmemory`: In-memory SyncAdapter implementation — lifecycle (ping/init), push with validation and conflict resolution, pull with revision filtering, settings CRUD, cover management with deduplication and ref-counting, purge of soft-deleted entities

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/adapter-inmemory/spec.md`
- New feature files: 6 files under `packages/client/src/test/features/adapter_inmemory/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
