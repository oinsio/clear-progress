# Tasks: Add Goals Specs

## 1. OpenSpec Documentation

- [x] 1.1 Create `.openspec.yaml` (schema: spec-driven)
- [x] 1.2 Write `proposal.md` with FR1-FR13, NFR-A1, UX1-UX2, M1-M2
- [x] 1.3 Write `design.md` — D1: keep existing tests, D2: follow Ideas structure, D3: reuse shared helpers
- [x] 1.4 Write `specs/goals/spec.md` — 9 requirements, 38 scenarios
- [x] 1.5 Write `tasks.md`

## 2. BDD Unit Infrastructure

- [ ] 2.1 Create `test/helpers/bdd/goals/helpers.ts` — createScenarioContext, seedGoal (FR1-FR13)
- [ ] 2.2 Create `test/helpers/bdd/goals/stepDefinitions.ts` — shared Given/When/Then steps
- [ ] 2.3 Create `test/helpers/bdd/goals/assertions.ts` — shared assertion helpers

## 3. BDD Unit Features + Steps

- [ ] 3.1 `goals_crud.feature` + `goals_crud.steps.ts` (FR1, FR2, FR3)
- [ ] 3.2 `goals_status.feature` + `goals_status.steps.ts` (FR8)
- [ ] 3.3 `goals_cover.feature` + `goals_cover.steps.ts` (FR11)
- [ ] 3.4 `goals_soft_delete.feature` + `goals_soft_delete.steps.ts` (FR4, FR5)
- [ ] 3.5 `goals_ordering.feature` + `goals_ordering.steps.ts` (FR6, FR10)
- [ ] 3.6 `goals_search.feature` + `goals_search.steps.ts` (FR7)
- [ ] 3.7 `goals_dirty_flag.feature` + `goals_dirty_flag.steps.ts` (FR9)
- [ ] 3.8 `goals_tasks.feature` + `goals_tasks.steps.ts` (FR12, FR13, UX1, UX2)

## 4. Verification

- [ ] 4.1 All BDD unit tests green: `pnpm test`
- [ ] 4.2 Build passes: `pnpm run build`
- [ ] 4.3 Traceability: every FR/NFR/UX has at least one BDD scenario
