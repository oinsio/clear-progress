## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/deleted-entities/spec.md` — deleted entities capability (aggregation, restore, empty/loading states, reactivity, checklist parent context) — implements FR1, FR2, FR3, FR4, FR5, FR6

## 2. BDD Feature Files — Aggregation

- [x] 2.1 Create `features/deleted_entities/deleted_entities_aggregation.feature` — scenarios for multi-type aggregation, filtering only deleted, empty state, loading state — @deleted-entities-spec @FR1 @FR3 @FR4 @FR5

## 3. BDD Step Definitions — Aggregation

- [x] 3.1 Create `features/deleted_entities/steps/deleted_entities_aggregation.steps.ts` — step definitions using fake-indexeddb + entity repositories

## 4. BDD Feature Files — Restore

- [x] 4.1 Create `features/deleted_entities/deleted_entities_restore.feature` — scenarios for restore per entity type (task, goal, context, category, checklist item), cascade restore for task — @deleted-entities-spec @FR2 @FR8

## 5. BDD Step Definitions — Restore

- [x] 5.1 Create `features/deleted_entities/steps/deleted_entities_restore.steps.ts` — step definitions using services with fake-indexeddb

## 6. BDD Feature Files — Checklist Context

- [x] 6.1 Create `features/deleted_entities/deleted_entities_checklist_context.feature` — scenarios for parent task name mapping, deleted parent tasks — @deleted-entities-spec @FR6

## 7. BDD Step Definitions — Checklist Context

- [x] 7.1 Create `features/deleted_entities/steps/deleted_entities_checklist_context.steps.ts` — step definitions for task name map behavior

## 8. Verification

- [x] 8.1 Run all BDD tests and verify they pass: 3 files, 50 tests passed in 980ms
- [x] 8.2 Verify build: `pnpm run build` — passed
