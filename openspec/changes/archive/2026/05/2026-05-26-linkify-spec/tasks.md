# Tasks — linkify-spec

## 1. Stable specification

- [x] 1.1 Create `openspec/specs/linkify/spec.md` covering FR1-FR22

## 2. BDD Unit tests for extractLinks

- [x] 2.1 Create feature file `packages/client/src/test/features/linkify/linkify_extract_links.feature` (@linkify-spec @FR1-FR8)
- [x] 2.2 Create step definitions `packages/client/src/test/features/linkify/steps/linkify_extract_links.steps.ts`

## 3. BDD Unit tests for shortenUrl

- [x] 3.1 Create feature file `packages/client/src/test/features/linkify/linkify_shorten_url.feature` (@linkify-spec @FR9-FR15)
- [x] 3.2 Create step definitions `packages/client/src/test/features/linkify/steps/linkify_shorten_url.steps.ts`

## 4. BDD Unit tests for LinkedText

- [x] 4.1 Create feature file `packages/client/src/test/features/linkify/linkify_linked_text.feature` (@linkify-spec @FR16-FR22)
- [x] 4.2 Create step definitions `packages/client/src/test/features/linkify/steps/linkify_linked_text.steps.ts`

## 5. Verification

- [x] 5.1 Run BDD tests — verify all GREEN
- [x] 5.2 Run `pnpm run build` — verify build passes
