## Context

Checklist items are subtasks within a task. The domain logic is implemented in `ChecklistService` with `ChecklistRepository` for persistence. Cascade behavior (task delete/restore cascading to checklist items) is implemented in `TaskService` and already has both specs and BDD tests via the `cascade-checklist-delete` change. This change adds specs and BDD tests for core checklist operations only.

Context: driven by G1 and G2 from proposal — filling the specification gap for an already-implemented feature.

## Goals / Non-Goals

**Goals:**
- Spec file accurately reflects the implemented behavior in `ChecklistService`
- BDD tests exercise `ChecklistService` directly with `fake-indexeddb` (same pattern as tasks BDD tests)
- Feature files organized per requirement area (CRUD, toggle, update, delete/restore, reorder, progress)

**Non-Goals:**
- No production code changes
- No cascade/sync behavior (already covered elsewhere)
- No UI/hook layer tests

## Decisions

- **D1**: BDD tests use `ChecklistService` with real `ChecklistRepository` + `fake-indexeddb`, not mocks. This matches the pattern established in task-core-specs.
- **D2**: Feature files placed in `packages/client/src/test/features/checklists/` with shared helpers in `steps/checklists_steps.helpers.ts`.
- **D3**: Spec file goes to `openspec/specs/checklists/spec.md` as a new capability (not a delta of tasks spec). Checklists are a distinct domain concept, even though they belong to tasks.

## Risks / Trade-offs

- **Risk**: BDD tests may overlap with existing unit tests for `ChecklistService`. **Mitigation**: BDD tests focus on behavior (Given/When/Then), unit tests cover edge cases and error paths. Both are valuable.
- **Risk**: Spec may drift from implementation over time. **Mitigation**: BDD tests are executable — they will fail if behavior changes.
