# Task Core Specs

## Why

Task management is the central functionality of Clear Progress. All task operations (CRUD, boxes, completion, reorder, search, duplicate, associations, cascade delete) are already implemented and covered by unit tests, but there are no formal specifications (openspec) or BDD tests (.feature + steps) for this functionality. This creates a documentation gap: other entities (Goals, Ideas, Categories, Contexts) have both specs and BDD tests, while Tasks — the most complex entity — have neither.

Documenting existing behavior as specs + BDD tests will:
- Establish a single source of truth for task behavior
- Catch regressions via executable Gherkin scenarios
- Enable safe refactoring with confidence

## What Changes

- **ADDED** `tasks` capability spec documenting all core task operations
- **ADDED** BDD unit tests (.feature + .steps.ts) covering task CRUD, boxes, completion, reorder, search, duplicate, associations, cascade checklist delete/restore, swipe action, and dirty flag behavior

No code changes to production logic. This is a documentation + test-only change.

## Goals

- **G1**: Every core task operation has a formal requirement in the spec
- **G2**: Every requirement has at least one BDD scenario with passing step definitions
- **G3**: BDD test coverage aligns with existing unit test coverage (no gaps)

## Non-Goals

- **NG1**: Recurring tasks (repeat_rule, hidden clone, reveal, appear_date) — separate change
- **NG2**: Sync protocol for tasks — already covered by sync-protocol specs
- **NG3**: UI component tests or E2E tests — this change focuses on domain/service layer BDD
- **NG4**: Changing any existing production code or behavior

## Users & Scenarios

- **U1**: Developer modifying task logic — reads spec to understand expected behavior, runs BDD tests to verify changes
- **U2**: AI agent implementing a new feature on tasks — uses spec as context to avoid regressions

## Requirements

### Functional

- **FR1**: Task CRUD — create with defaults, read by id, update with smart dirty flag, soft delete, restore
- **FR2**: Task boxes — get tasks by box (inbox/today/week/later), move task between boxes
- **FR3**: Task completion — mark as completed (sets is_completed + completed_at), undo completion (clears both)
- **FR4**: Completed tasks list — retrieve completed tasks sorted by completed_at descending
- **FR5**: Task reorder — drag-and-drop reorder within a box, sequential sort_order, smart dirty flag
- **FR6**: Task search — search by name and description, case-insensitive, active tasks sorted by completion then updated_at
- **FR7**: Task duplicate — create a copy with same fields (name, box, description, goal_id, context_id, category_id, repeat_rule) and copy checklist items
- **FR8**: Task associations — get tasks by goal_id, context_id, category_id; count active incomplete tasks per goal/context/category
- **FR9**: Cascade checklist delete — soft-deleting a task cascades is_deleted to all its checklist items
- **FR10**: Cascade checklist restore — restoring a task cascades is_deleted=false to all its checklist items
- **FR11**: Swipe right action — swipe right to complete/uncomplete with threshold-based activation; swipe left is cancelled (no action)

### Non-Functional

#### Performance

- **NFR-P1**: All task operations complete within 100ms on a dataset of 500 tasks

#### Accessibility

- **NFR-A1**: Task list and swipe actions accessible via keyboard

#### Responsive

- **NFR-R1**: Task list renders correctly on viewports from 320px to 2560px

## UX Acceptance Criteria

- **UX1**: Creating a task in a box appends it to the end of the list
- **UX2**: Completing a task removes it from the box list and adds it to the completed list
- **UX3**: Swiping right past threshold triggers completion/uncompletion
- **UX4**: Swiping left is ignored (no action)
- **UX5**: Search results show active tasks first, then completed, sorted by recency

## UI States Matrix

| Network | Data                 | UI                                         |
|---------|----------------------|--------------------------------------------|
| Online  | Tasks exist          | Task list with items, sorted by sort_order |
| Online  | No tasks             | Empty state message                        |
| Online  | Loading              | Loading skeleton                           |
| Offline | Tasks exist (cached) | Task list from IndexedDB                   |
| Offline | No tasks             | Empty state message                        |
| Any     | Error                | Error message with retry                   |

## Behavior

BDD scenarios defined in:
- `features/tasks/tasks_crud.feature` — FR1
- `features/tasks/tasks_boxes.feature` — FR2
- `features/tasks/tasks_completion.feature` — FR3, FR4
- `features/tasks/tasks_reorder.feature` — FR5
- `features/tasks/tasks_search.feature` — FR6
- `features/tasks/tasks_duplicate.feature` — FR7
- `features/tasks/tasks_associations.feature` — FR8
- `features/tasks/tasks_soft_delete.feature` — FR1 (delete/restore), FR9, FR10
- `features/tasks/tasks_dirty_flag.feature` — FR1 (smart dirty flag)

All scenarios tagged `@task-core-specs`.

## Visual Reference

No visual changes. Existing UI components remain unchanged.

## Affected IA

No changes to information architecture.

## Success Metrics

- **M1**: 100% of FR1-FR10 have at least one BDD scenario; FR11 covered by existing unit tests
- **M2**: All BDD step definitions pass
- **M3**: Mutation score >= 90% on task domain/service code (existing + new tests combined)

## Open Questions

None.
