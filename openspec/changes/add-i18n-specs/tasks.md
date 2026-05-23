# Tasks: Add i18n Specs

## 1. OpenSpec Documentation

- [x] 1.1 Write `proposal.md` with FR1-FR12, M1-M4
- [x] 1.2 Write `design.md` -- D1: keep existing tests, D2: direct import, D3: JSON key comparison
- [x] 1.3 Write `specs/i18n/spec.md` -- 8 requirements, 22 scenarios
- [x] 1.4 Write `tasks.md`

## 2. BDD Unit Infrastructure

- [ ] 2.1 Create `i18n_steps.helpers.ts` -- test utilities, localStorage mock, navigator mock

## 3. BDD Unit Features + Steps -- Language Detection & Persistence

- [ ] 3.1 `i18n_detection.feature` + `i18n_detection.steps.ts` (FR1, FR2)
- [ ] 3.2 `i18n_switching.feature` + `i18n_switching.steps.ts` (FR3, FR4)
- [ ] 3.3 `i18n_persistence.feature` + `i18n_persistence.steps.ts` (FR5, FR6)

## 4. BDD Unit Features + Steps -- Locale Registry

- [ ] 4.1 `i18n_registry.feature` + `i18n_registry.steps.ts` (FR7, FR8, FR9)
- [ ] 4.2 `i18n_fallback.feature` + `i18n_fallback.steps.ts` (FR10)

## 5. BDD Unit Features + Steps -- Translation Quality

- [ ] 5.1 `i18n_completeness.feature` + `i18n_completeness.steps.ts` (FR11)
- [ ] 5.2 `i18n_pluralization.feature` + `i18n_pluralization.steps.ts` (FR12)

## 6. BDD Unit Features + Steps -- Utility Functions

- [ ] 6.1 `i18n_utilities.feature` + `i18n_utilities.steps.ts` (FR7 utilities)

## 7. Verification

- [ ] 7.1 All BDD unit tests green: `pnpm test`
- [ ] 7.2 Build passes: `pnpm run build`
- [ ] 7.3 Traceability: every FR has at least one BDD scenario
