# Tasks: Add Ideas Specs

## 1. OpenSpec Documentation

- [x] 1.1 Create `.openspec.yaml` (schema: spec-driven)
- [x] 1.2 Write `proposal.md` with FR1-FR11, NFR-A1-A3, NFR-R1, UX1-UX4, M1-M3
- [x] 1.3 Write `design.md` — D1: keep existing tests alongside BDD
- [x] 1.4 Write `specs/ideas/spec.md` — 7 requirements, 28 scenarios
- [x] 1.5 Write `tasks.md`

## 2. BDD Unit Infrastructure

- [x] 2.1 Create `ideas_steps.helpers.ts` — createScenarioContext, seedIdea (FR1-FR10)

## 3. BDD Unit Features + Steps

- [x] 3.1 `ideas_crud.feature` + `ideas_crud.steps.ts` (FR1, FR2, FR3, FR8)
- [x] 3.2 `ideas_soft_delete.feature` + `ideas_soft_delete.steps.ts` (FR4, FR5)
- [x] 3.3 `ideas_ordering.feature` + `ideas_ordering.steps.ts` (FR6, FR10)
- [x] 3.4 `ideas_search.feature` + `ideas_search.steps.ts` (FR7)
- [x] 3.5 `ideas_dirty_flag.feature` + `ideas_dirty_flag.steps.ts` (FR9, FR10)

## 4. BDD E2E Feature + Steps

- [x] 4.1 `ideas_nfr_e2e.feature` + `ideas_nfr_e2e.steps.ts` (NFR-A1, NFR-A2, NFR-A3, NFR-R1, UX1)

## 5. Verification

- [x] 5.1 All BDD unit tests green: `pnpm test`
- [ ] 5.2 All BDD E2E tests green: `pnpm test:bdd` (requires running dev server)
- [x] 5.3 Build passes: `pnpm run build`
- [x] 5.4 Traceability: every FR/NFR/UX has at least one BDD scenario
