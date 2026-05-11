# spec-sync-protocol

## Why

The sync protocol is the core of Clear Progress client-server interaction: push/pull, conflict resolution, revisions, dirty flags, soft delete, purge, cover sync. This functionality is already implemented but lacks a formal specification. Without a spec, it is impossible to write targeted tests, validate contracts, and safely refactor.

The existing `sync-orchestration` spec describes **when** synchronization is triggered (triggers, preconditions, error handling). This spec describes **how** the protocol works: request/response format, push/pull algorithms, conflict resolution, revision tracking, dirty flag lifecycle, cover dedup.

## What Changes

- **ADDED**: Formal sync protocol specification (retrospective documentation)
- **ADDED**: Dirty flag lifecycle and revision tracking specification
- **ADDED**: Cover sync protocol specification with SHA-256 deduplication
- **ADDED**: Test coverage tasks (BDD unit, contract tests) for missing scenarios

## Capabilities

### New Capabilities
- `sync-protocol`: Push/pull sync protocol — wire types, conflict resolution (LWW), revision tracking, dirty flag lifecycle, soft delete, purge, settings sync
- `cover-sync-protocol`: Goal cover sync protocol — upload (single/batch), download, delete, SHA-256 deduplication, local cover lifecycle

### Modified Capabilities
_No changes to existing spec requirements._

## Goals

- G1: Capture all sync protocol business rules in formal specs for traceability
- G2: Provide a foundation for targeted BDD tests and contract tests

## Non-Goals

- NG1: Changing sync protocol behavior — this is retrospective documentation
- NG2: Describing triggers and orchestration — already covered in `sync-orchestration`
- NG3: Describing UI sync indicator — separate concern
- NG4: Changing GAS backend code

## Users & Scenarios

- U1: Developer refactoring sync — needs spec as a contract
- U2: Developer writing tests — needs spec as a source of scenarios
- U3: Developer adding a new entity to sync — needs spec as a reference

## Requirements

### Functional

- FR1: Spec must describe PushRequest/PushResponse format for all entity types
- FR2: Spec must describe PullRequest/PullResponse format with revision-based filtering
- FR3: Spec must describe conflict resolution (last-write-wins by updated_at)
- FR4: Spec must describe dirty flag lifecycle (set true -> push -> clear/keep)
- FR5: Spec must describe revision tracking (client-side last_known_revision, server-side next_revision)
- FR6: Spec must describe soft delete and purge protocol
- FR7: Spec must describe settings sync (timestamp-based, no revision)
- FR8: Spec must describe cover upload with SHA-256 deduplication
- FR9: Spec must describe cover batch upload (up to 10 items)
- FR10: Spec must describe cover download and caching
- FR11: Spec must describe cover delete with ref_count
- FR12: Spec must describe init/ping lifecycle
- FR13: Spec must describe pull protection (do not overwrite needsSync=true records)
- FR14: Spec must describe resetAndPull (force pull with revision=0)
- FR15: Spec must describe push results: created, accepted, conflict, rejected

### Non-Functional

#### Performance
- NFR-P1: None (documentation, not runtime)

#### Accessibility
- NFR-A1: None (no UI)

#### Responsive
- NFR-R1: None (no UI)

## UX Acceptance Criteria

_No UI changes._

## Behavior

Scenarios are described in specs `specs/sync-protocol/spec.md` and `specs/cover-sync-protocol/spec.md`.

## Visual Reference

_No visual changes._

## Affected IA

No changes.

## Success Metrics

- M1: All sync protocol business rules are captured in specs (FR1-FR15)
- M2: Every rule has at least one BDD scenario or contract test

## Open Questions

_None._

## Impact

- `packages/contract/src/ports/sync-adapter.ts` — described interface
- `packages/contract/src/protocol/` — described types
- `packages/client/src/services/SyncService.ts` — described implementation
- `packages/client/src/services/CoverSyncService.ts` — described implementation
- `packages/contract/tests/contracts/` — existing contract tests
- `packages/client/src/db/repositories/` — dirty flag mechanism
