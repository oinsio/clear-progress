# Tasks: rework-house-locale

## 1. Behavior spec (RED)

- [ ] 1.1 Write `packages/client/src/test/features/i18n/house-locale.feature` — Gherkin scenarios tagged `@rework-house-locale` + `@FR1`…`@FR8`: no redundant overrides vs `ru.json` (FR1), no orphan keys (FR1), glossary page names and deletion verbs (FR2, FR3), accessibility keys absent (FR4), repair/config keys absent (FR5), placeholder parity for every override (FR6), `_meta` intact (FR7), capitalized «Вы» forms (FR8), flattened inventory equals the normative table from `specs/house-locale/spec.md` (no extra / no missing keys)
- [ ] 1.2 Write step definitions `house-locale.steps.ts` (vitest-cucumber) that import `house.json` + `ru.json` directly and reuse the flatten helper from `scripts/i18n-check`; encode the normative inventory as a fixture module derived from the spec table
- [ ] 1.3 Run the new suite only (`npx vitest run src/test/features/i18n/house-locale`) — confirm scenarios FAIL against the current locale (red)

## 2. Locale rewrite (GREEN)

- [ ] 2.1 Rewrite `packages/client/src/locales/house.json`: keep `_meta`, replace all overrides with the normative inventory from `specs/house-locale/spec.md`, delete every key not in the inventory (implements FR1–FR8)
- [ ] 2.2 Run the new suite again — confirm all scenarios PASS (green)

## 3. Verification

- [ ] 3.1 Run `i18n-check` from `packages/client` — 0 `override-orphans`, 0 `undefined` errors (M1)
- [ ] 3.2 Run the existing i18n unit/BDD suite (one command, foreground) — locale registry still discovers `house` with valid `_meta` (NFR-A1 fallback path unchanged)
- [ ] 3.3 Call `get_file_problems` for changed files and run `pnpm run build` — no errors
- [ ] 3.4 Note: Stryker not applicable — no production TS changed (JSON content + tests only); do not launch mutation runs

## 4. Manual smoke (single pass, not a test plan)

- [ ] 4.1 Switch app language to «Доктор Хаус» and walk boxes/goals/ideas/deleted/settings pages once to confirm the narrative reads coherently and nothing renders a raw key
