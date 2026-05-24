# Tasks: task-core-specs

## 1. Create stable spec in openspec/specs/tasks/

- [ ] 1.1 Verify spec content covers all FR1-FR11 requirements from proposal.md
- [ ] 1.2 Archive delta spec to openspec/specs/tasks/spec.md (via /opsx:sync or /opsx:archive)

## 2. BDD: Task CRUD (FR1)

- [ ] 2.1 Create `features/tasks/tasks_crud.feature` — scenarios: create with defaults, read by id, read nonexistent, update name, update nonexistent throws error. Tag `@task-core-specs @FR1`
- [ ] 2.2 Create `features/tasks/steps/tasks_crud.steps.ts` — step definitions using TaskService with fake-indexeddb
- [ ] 2.3 Verify all scenarios pass: `npx vitest run --reporter=verbose` filtering tasks_crud

## 3. BDD: Task Boxes (FR2)

- [ ] 3.1 Create `features/tasks/tasks_boxes.feature` — scenarios: get by box sorted, empty box, deleted excluded, move between boxes, move to same box is no-op. Tag `@task-core-specs @FR2`
- [ ] 3.2 Create `features/tasks/steps/tasks_boxes.steps.ts`
- [ ] 3.3 Verify all scenarios pass

## 4. BDD: Task Completion (FR3, FR4)

- [ ] 4.1 Create `features/tasks/tasks_completion.feature` — scenarios: complete a task, uncomplete a task, complete nonexistent throws, completed list sorted by completed_at desc, deleted excluded from completed list. Tag `@task-core-specs @FR3 @FR4`
- [ ] 4.2 Create `features/tasks/steps/tasks_completion.steps.ts`
- [ ] 4.3 Verify all scenarios pass

## 5. BDD: Task Reorder (FR5)

- [ ] 5.1 Create `features/tasks/tasks_reorder.feature` — scenarios: sequential sort_order, only changed marked for sync, empty no-op, same order no-op. Tag `@task-core-specs @FR5`
- [ ] 5.2 Create `features/tasks/steps/tasks_reorder.steps.ts`
- [ ] 5.3 Verify all scenarios pass

## 6. BDD: Task Search (FR6)

- [ ] 6.1 Create `features/tasks/tasks_search.feature` — scenarios: search by name, by description, case-insensitive, incomplete before completed, no matches. Tag `@task-core-specs @FR6`
- [ ] 6.2 Create `features/tasks/steps/tasks_search.steps.ts`
- [ ] 6.3 Verify all scenarios pass

## 7. BDD: Task Duplicate (FR7)

- [ ] 7.1 Create `features/tasks/tasks_duplicate.feature` — scenarios: duplicate task, duplicate copies checklist, duplicate nonexistent throws. Tag `@task-core-specs @FR7`
- [ ] 7.2 Create `features/tasks/steps/tasks_duplicate.steps.ts`
- [ ] 7.3 Verify all scenarios pass

## 8. BDD: Task Associations (FR8)

- [ ] 8.1 Create `features/tasks/tasks_associations.feature` — scenarios: get by goal, get by context (completed excluded), get by category, task counts per goal/context/category, empty association not counted. Tag `@task-core-specs @FR8`
- [ ] 8.2 Create `features/tasks/steps/tasks_associations.steps.ts`
- [ ] 8.3 Verify all scenarios pass

## 9. BDD: Task Soft Delete & Cascade (FR1, FR9, FR10)

- [ ] 9.1 Create `features/tasks/tasks_soft_delete.feature` — scenarios: soft-delete task, restore task, cascade delete to checklist, cascade restore checklist, soft-delete task with no checklist. Tag `@task-core-specs @FR1 @FR9 @FR10`
- [ ] 9.2 Create `features/tasks/steps/tasks_soft_delete.steps.ts`
- [ ] 9.3 Verify all scenarios pass

## 10. BDD: Task Dirty Flag (FR1)

- [ ] 10.1 Create `features/tasks/tasks_dirty_flag.feature` — scenarios: smart dirty flag on update, no-op update, dirty flag on create/delete/restore/complete. Tag `@task-core-specs @FR1`
- [ ] 10.2 Create `features/tasks/steps/tasks_dirty_flag.steps.ts`
- [ ] 10.3 Verify all scenarios pass

## 11. Verification

- [ ] 11.1 Run full BDD test suite: `npx vitest run` — all new and existing tests pass
- [ ] 11.2 Run build: `pnpm run build` — no compilation errors
- [ ] 11.3 Verify traceability: every FR from proposal has at least one @FR-X tag in .feature files
