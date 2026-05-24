# Add Checklist Specs

## Why

Checklist items (subtasks within a task) are fully implemented — CRUD, toggle, progress, reorder, cascade delete/restore, self-healing sync — but there is no formal capability spec (`openspec/specs/checklists/spec.md`). Cascade behavior has BDD tests, but core checklist operations (create, toggle, delete, reorder, progress) lack BDD coverage. Other entities (Tasks, Goals, Ideas, Categories, Contexts) already have both specs and BDD tests. This gap makes it harder to understand expected behavior, catch regressions, and safely refactor.

## What Changes

- **ADDED** `checklists` capability spec documenting all core checklist operations
- **ADDED** BDD unit tests (.feature + .steps.ts) covering checklist CRUD, toggle, progress, reorder, soft delete/restore, and dirty flag behavior

No code changes to production logic. This is a documentation + test-only change.

## Capabilities

### New Capabilities

- `checklists`: Core checklist item operations — CRUD, toggle completion, progress calculation, reorder, soft delete/restore, smart dirty flag

### Modified Capabilities

(none)

## Impact

No production code changes. New files:
- `openspec/specs/checklists/spec.md`
- `packages/client/src/test/features/checklists/*.feature`
- `packages/client/src/test/features/checklists/steps/*.steps.ts`

## Goals

- **G1**: Every core checklist operation has a formal requirement in the spec
- **G2**: Every requirement has at least one BDD scenario with passing step definitions
- **G3**: BDD test coverage aligns with existing unit test coverage (no gaps)

## Non-Goals

- **NG1**: Cascade delete/restore — already covered by `cascade-checklist-delete` change and BDD tests
- **NG2**: Self-healing sync for orphaned checklist items — already covered by `cascade-checklist-delete`
- **NG3**: UI component tests or E2E tests — this change focuses on domain/service layer BDD
- **NG4**: Changing any existing production code or behavior
- **NG5**: useChecklist hook tests — React hook layer, separate concern

## Users & Scenarios

- **U1**: Developer modifying checklist logic — reads spec to understand expected behavior, runs BDD tests to verify changes
- **U2**: AI agent implementing a new feature on checklists — uses spec as context to avoid regressions

## Requirements

### Functional

- **FR1**: Checklist item CRUD — create with defaults (sort_order, timestamps, needsSync), read by task, read by id
- **FR2**: Toggle completion — toggle `is_completed` flag with updated_at refresh
- **FR3**: Update checklist item — update name with smart dirty flag
- **FR4**: Soft delete and restore — set/unset is_deleted with needsSync
- **FR5**: Reorder — reassign sort_order values, only update changed items, no-op for unchanged order
- **FR6**: Progress calculation — return completed/total counts for a task's active checklist items

### Non-Functional

#### Performance

- **NFR-P1**: All checklist operations complete within 50ms on a dataset of 100 items per task

## UX Acceptance Criteria

- **UX1**: Creating a checklist item appends it to the end of the list
- **UX2**: Toggling an item preserves its position in the list
- **UX3**: Reordering only syncs items whose position actually changed

## Behavior

BDD scenarios defined in:
- `features/checklists/checklists_crud.feature` — FR1
- `features/checklists/checklists_toggle.feature` — FR2
- `features/checklists/checklists_update.feature` — FR3
- `features/checklists/checklists_delete_restore.feature` — FR4
- `features/checklists/checklists_reorder.feature` — FR5
- `features/checklists/checklists_progress.feature` — FR6

All scenarios tagged `@add-checklist-specs`.

## Visual Reference

No visual changes. Existing UI components remain unchanged.

## Affected IA

No changes to information architecture.

## Success Metrics

- **M1**: 100% of FR1-FR6 have at least one BDD scenario
- **M2**: All BDD step definitions pass
- **M3**: Mutation score >= 90% on checklist service code (existing + new tests combined)

## Open Questions

None.
