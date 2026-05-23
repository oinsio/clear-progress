# Tasks: Add Context & Category Specs

## 1. OpenSpec Documentation

- [x] 1.1 Write `proposal.md` with FR1-FR6, M1-M3
- [x] 1.2 Write `design.md` — D1: keep existing tests, D2: single change
- [x] 1.3 Write `specs/contexts/spec.md` — 5 requirements, 17 scenarios
- [x] 1.4 Write `specs/categories/spec.md` — 5 requirements, 17 scenarios
- [x] 1.5 Write `tasks.md`

## 2. BDD Unit Infrastructure

- [x] 2.1 Create `contexts_steps.helpers.ts` — createScenarioContext, seedContext (FR1-FR6)
- [x] 2.2 Create `categories_steps.helpers.ts` — createScenarioContext, seedCategory (FR1-FR6)

## 3. BDD Unit Features + Steps — Contexts

- [x] 3.1 `contexts_crud.feature` + `contexts_crud.steps.ts` (FR1, FR2, FR3)
- [x] 3.2 `contexts_soft_delete.feature` + `contexts_soft_delete.steps.ts` (FR4, FR5)
- [x] 3.3 `contexts_ordering.feature` + `contexts_ordering.steps.ts` (FR6)
- [x] 3.4 `contexts_dirty_flag.feature` + `contexts_dirty_flag.steps.ts` (FR3, FR6)

## 4. BDD Unit Features + Steps — Categories

- [x] 4.1 `categories_crud.feature` + `categories_crud.steps.ts` (FR1, FR2, FR3)
- [x] 4.2 `categories_soft_delete.feature` + `categories_soft_delete.steps.ts` (FR4, FR5)
- [x] 4.3 `categories_ordering.feature` + `categories_ordering.steps.ts` (FR6)
- [x] 4.4 `categories_dirty_flag.feature` + `categories_dirty_flag.steps.ts` (FR3, FR6)

## 5. Verification

- [x] 5.1 All BDD unit tests green: `pnpm test`
- [x] 5.2 Build passes: `pnpm run build`
- [x] 5.3 Traceability: every FR has at least one BDD scenario
