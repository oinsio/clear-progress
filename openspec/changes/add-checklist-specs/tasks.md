# Tasks: add-checklist-specs

## 1. Create stable spec in openspec/specs/checklists/

- [ ] 1.1 Verify spec content covers all FR1-FR6 requirements from proposal.md

## 2. BDD: Checklist CRUD (FR1)

- [ ] 2.1 Create `features/checklists/checklists_crud.feature` — scenarios: create with defaults, sort_order defaults to end, UUID generated, timestamps set, get by task sorted, deleted excluded, empty list, read by id, read nonexistent. Tag `@add-checklist-specs @FR1`
- [ ] 2.2 Create `features/checklists/steps/checklists_steps.helpers.ts` — shared helper: create scenario context with ChecklistService + ChecklistRepository + fake-indexeddb
- [ ] 2.3 Create `features/checklists/steps/checklists_crud.steps.ts` — step definitions using ChecklistService with fake-indexeddb
- [ ] 2.4 Verify all scenarios pass: `npx vitest run --reporter=verbose` filtering checklists_crud

## 3. BDD: Checklist Toggle (FR2)

- [ ] 3.1 Create `features/checklists/checklists_toggle.feature` — scenarios: toggle incomplete to completed, toggle completed to incomplete, toggle nonexistent throws. Tag `@add-checklist-specs @FR2`
- [ ] 3.2 Create `features/checklists/steps/checklists_toggle.steps.ts`
- [ ] 3.3 Verify all scenarios pass

## 4. BDD: Checklist Update (FR3)

- [ ] 4.1 Create `features/checklists/checklists_update.feature` — scenarios: update name, no-op update, update nonexistent throws. Tag `@add-checklist-specs @FR3`
- [ ] 4.2 Create `features/checklists/steps/checklists_update.steps.ts`
- [ ] 4.3 Verify all scenarios pass

## 5. BDD: Checklist Delete/Restore (FR4)

- [ ] 5.1 Create `features/checklists/checklists_delete_restore.feature` — scenarios: soft-delete, restore. Tag `@add-checklist-specs @FR4`
- [ ] 5.2 Create `features/checklists/steps/checklists_delete_restore.steps.ts`
- [ ] 5.3 Verify all scenarios pass

## 6. BDD: Checklist Reorder (FR5)

- [ ] 6.1 Create `features/checklists/checklists_reorder.feature` — scenarios: sequential sort_order, only changed marked, empty no-op, same order no-op. Tag `@add-checklist-specs @FR5`
- [ ] 6.2 Create `features/checklists/steps/checklists_reorder.steps.ts`
- [ ] 6.3 Verify all scenarios pass

## 7. BDD: Checklist Progress (FR6)

- [ ] 7.1 Create `features/checklists/checklists_progress.feature` — scenarios: mixed completion, no items, deleted excluded. Tag `@add-checklist-specs @FR6`
- [ ] 7.2 Create `features/checklists/steps/checklists_progress.steps.ts`
- [ ] 7.3 Verify all scenarios pass

## 8. Verification

- [ ] 8.1 Run full BDD test suite: `npx vitest run` — all new and existing tests pass
- [ ] 8.2 Run build: `pnpm run build` — no compilation errors
- [ ] 8.3 Verify traceability: every FR from proposal has at least one @FR-X tag in .feature files
