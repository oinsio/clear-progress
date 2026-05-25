# Tasks — search-specs

## 1. Stable specification

- [ ] 1.1 Create `openspec/specs/search/spec.md` based on delta spec from `specs/search/spec.md` (FR1-FR5)

## 2. BDD Unit tests for useSearch

- [ ] 2.1 Create feature file `packages/client/src/test/features/search/cross_entity_search.feature` with Gherkin scenarios (@search-specs @FR1-FR5)
- [ ] 2.2 Create step definitions `packages/client/src/test/features/search/steps/cross_entity_search.steps.ts`
- [ ] 2.3 Run BDD tests — verify all GREEN

## 3. Verification

- [ ] 3.1 Run `pnpm run build` — verify build passes
- [ ] 3.2 Run `npx vitest run` — verify all tests pass
