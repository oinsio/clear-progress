# Remove Version Field

## Why

The `version` field in all entities (Task, Goal, Idea, Context, Category, ChecklistItem) is redundant. It duplicates the functionality of `updated_at` and is used only once in the codebase for a check that can be replaced with `updated_at`. Removing it simplifies the data model, reduces storage overhead, and eliminates maintenance burden without losing any functionality.

## What Changes

- **REMOVED**: `version` field from all entity schemas (Task, Goal, Idea, Context, Category, ChecklistItem)
- **MODIFIED**: `SyncService._applyEntityPushResults()` to use `updated_at` instead of `version` for detecting concurrent modifications
- **REMOVED**: `TaskRepository.getByMinVersion()` method (unused dead code)
- **REMOVED**: `version` from IndexedDB schema and indices
- **REMOVED**: `version` column from Google Sheets backend

## Capabilities

### New Capabilities
<!-- None -->

### Modified Capabilities
- `sync-protocol`: Change conflict detection after push from version-based to timestamp-based

## Impact

**Affected code:**
- `packages/contract/src/schemas/entities.ts` — Wire schemas for all entities
- `packages/client/src/db/schema.ts` — IndexedDB schema
- `packages/client/src/services/*Service.ts` — All entity services (Task, Goal, Idea, Context, Category, Checklist)
- `packages/client/src/services/SyncService.ts` — Push result handling
- `packages/client/src/services/HiddenTaskService.ts` — Task reveal logic
- `packages/client/src/services/CoverSyncService.ts` — Cover sync logic
- `packages/client/src/db/repositories/TaskRepository.ts` — Remove `getByMinVersion()`
- `packages/adapter-gas/src/server/actions/push.ts` — Server-side push logic
- `packages/adapter-gas/src/server/sheets/*.sheet.ts` — All sheet adapters

**No breaking changes for users:** Since the app is not yet deployed to production, no data migration is needed.

## Goals

- **G1**: Simplify data model by removing redundant field
- **G2**: Reduce storage overhead (one less field per entity record)
- **G3**: Maintain 100% sync protocol correctness

## Non-Goals

- **NG1**: Data migration (not needed — no production deployment yet)
- **NG2**: Backward compatibility with old clients (not needed)
- **NG3**: Changing conflict resolution strategy (still last-write-wins by `updated_at`)

## Users & Scenarios

- **U1**: Developer maintaining the codebase — fewer fields to track, simpler mental model
- **U2**: End user — no visible change, sync continues to work correctly

## Requirements

### Functional

- **FR1**: All entity schemas must not include `version` field
- **FR2**: `SyncService` must detect concurrent modifications during push using `updated_at` instead of `version`
- **FR3**: All entity services must not set or increment `version` field
- **FR4**: Server push logic must not read or write `version` field
- **FR5**: Dead code `getByMinVersion()` must be removed

### Non-Functional

#### Performance
- **NFR-P1**: Sync performance must remain unchanged (±5% acceptable variance)
- **NFR-P2**: IndexedDB query performance must remain unchanged

#### Reliability
- **NFR-R1**: All existing sync protocol tests must pass without modification to test logic (only test data changes)
- **NFR-R2**: Mutation test score must remain ≥90% for affected services

## UX Acceptance Criteria

- **UX1**: User sees no difference in app behavior
- **UX2**: Sync continues to work correctly in all scenarios (online, offline, conflict)

## UI States Matrix

Not applicable — no UI changes.

## Behavior

Existing sync protocol behavior specs remain valid:
- `packages/client/src/test/features/sync_protocol/*.feature` — all scenarios tagged with `@sync-protocol`

## Visual Reference

Not applicable — no visual changes.

## Affected IA

No changes to Information Architecture.

## Success Metrics

- **M1**: All 100% of existing sync tests pass after refactoring
- **M2**: Mutation test score ≥90% maintained for `SyncService`, `TaskService`, `GoalService`
- **M3**: Zero sync-related bugs reported in manual testing
- **M4**: Code complexity reduced (measured by fewer fields in type definitions)

## Open Questions

None — the change is straightforward and well-understood from exploration phase.
