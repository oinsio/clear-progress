# Tasks: add-checklist-specs

## 1. Create stable spec in openspec/specs/checklists/

- [x] 1.1 Verify spec content covers all FR1-FR6 requirements from proposal.md

## 2. BDD: Checklist CRUD (FR1)

- [x] 2.1 Create `features/checklists/checklists_crud_create.feature` + `checklists_crud_read.feature` — split by create/read, 9 scenarios total. Tag `@add-checklist-specs @FR1`
- [x] 2.2 Create `features/checklists/steps/checklists_steps.helpers.ts` — shared helper: create scenario context with ChecklistService + ChecklistRepository + fake-indexeddb
- [x] 2.3 Create `features/checklists/steps/checklists_crud_create.steps.ts` + `checklists_crud_read.steps.ts` — step definitions using ChecklistService with fake-indexeddb
- [x] 2.4 Verify all scenarios pass: 36/36 tests passed

## 3. BDD: Checklist Toggle (FR2)

- [x] 3.1 Create `features/checklists/checklists_toggle.feature` — 3 scenarios. Tag `@add-checklist-specs @FR2`
- [x] 3.2 Create `features/checklists/steps/checklists_toggle.steps.ts`
- [x] 3.3 Verify all scenarios pass: 12/12 tests passed

## 4. BDD: Checklist Update (FR3)

- [x] 4.1 Create `features/checklists/checklists_update.feature` — 3 scenarios. Tag `@add-checklist-specs @FR3`
- [x] 4.2 Create `features/checklists/steps/checklists_update.steps.ts`
- [x] 4.3 Verify all scenarios pass: 11/11 tests passed

## 5. BDD: Checklist Delete/Restore (FR4)

- [x] 5.1 Create `features/checklists/checklists_delete_restore.feature` — 2 scenarios. Tag `@add-checklist-specs @FR4`
- [x] 5.2 Create `features/checklists/steps/checklists_delete_restore.steps.ts`
- [x] 5.3 Verify all scenarios pass: 8/8 tests passed

## 6. BDD: Checklist Reorder (FR5)

- [x] 6.1 Create `features/checklists/checklists_reorder.feature` — 4 scenarios. Tag `@add-checklist-specs @FR5`
- [x] 6.2 Create `features/checklists/steps/checklists_reorder.steps.ts`
- [x] 6.3 Verify all scenarios pass: 16/16 tests passed

## 7. BDD: Checklist Progress (FR6)

- [x] 7.1 Create `features/checklists/checklists_progress.feature` — 3 scenarios. Tag `@add-checklist-specs @FR6`
- [x] 7.2 Create `features/checklists/steps/checklists_progress.steps.ts`
- [x] 7.3 Verify all scenarios pass: 9/9 tests passed

## 8. Verification

- [x] 8.1 Run full BDD test suite: `npx vitest run` — 3424 tests passed, 4 pre-existing e2e failures (unrelated)
- [x] 8.2 Run build: `pnpm run build` — no compilation errors
- [x] 8.3 Verify traceability: every FR from proposal has at least one @FR-X tag in .feature files
