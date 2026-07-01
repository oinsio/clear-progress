# Deleted Entities Spec

## Why

The "deleted entities" feature (trash page) is fully implemented but lacks formal specifications and BDD tests. The page allows users to view all soft-deleted entities grouped by type (tasks, checklists, goals, contexts, categories) and restore them. Other domain entities have dedicated openspec specs and BDD feature files. This is a documentation and test coverage gap.

## What Changes

- **ADDED**: OpenSpec capability spec for deleted-entities (aggregation of soft-deleted entities, restore, empty state, loading state)
- **ADDED**: BDD feature files covering useDeletedEntities hook (aggregation, filtering, reactivity) and useRestoreEntity hook (restore per entity type, sync scheduling)
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every deleted-entities behavior has a formal specification in openspec
- G2: BDD feature files cover aggregation, restore, and edge cases for the deleted entities page
- G3: Close the documentation gap between deleted-entities and other domain features

## Non-Goals

- NG1: No changes to implementation code (DeletedPage, useDeletedEntities, useRestoreEntity)
- NG2: No E2E/Playwright tests (page-level visual/a11y testing is out of scope)
- NG3: No purge behavior tests (purge has its own spec in `openspec/specs/purge/`)
- NG4: No UI component tests for DeletedPage

## Users & Scenarios

- U1: Developer maintaining deleted-entities code — uses specs as reference for expected behavior
- U2: AI agent implementing changes to trash — uses specs to understand constraints

## Requirements

### Functional

- FR1: Spec documents aggregation of soft-deleted entities from all entity types (tasks, goals, contexts, categories, checklist items)
- FR2: Spec documents restore operation per entity type (sets is_deleted to false, schedules sync push)
- FR3: Spec documents empty state when no deleted entities exist
- FR4: Spec documents loading state while subscriptions initialize
- FR5: Spec documents reactive updates when entities are deleted or restored elsewhere
- FR6: Spec documents checklist items showing parent task name
- FR7: BDD scenarios cover useDeletedEntities aggregation and filtering
- FR8: BDD scenarios cover useRestoreEntity restore operations

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/deleted_entities/deleted_entities_aggregation.feature` — @deleted-entities-spec @FR1 @FR3 @FR4 @FR5
- `features/deleted_entities/deleted_entities_restore.feature` — @deleted-entities-spec @FR2 @FR8
- `features/deleted_entities/deleted_entities_checklist_context.feature` — @deleted-entities-spec @FR6

## Affected IA

No changes.

## Success Metrics

- M1: 100% of deleted-entities behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

(none)

## Capabilities

### New Capabilities

- `deleted-entities`: Aggregation and restore of soft-deleted entities — query, grouping, restore, empty/loading states, reactivity, parent context for checklists

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/deleted-entities/spec.md`
- New feature files: 3 files under `packages/client/src/test/features/deleted_entities/`
- New step definitions: corresponding `.steps.ts` files
- No changes to existing implementation code
