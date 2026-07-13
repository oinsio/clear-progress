# Tasks: rework-house-locale

## 1. Behavior spec (RED)

- [x] 1.1 Write `packages/client/src/test/features/i18n/house_locale.feature` — Gherkin scenarios tagged `@rework-house-locale` + `@FR1`…`@FR8`: no redundant overrides vs `ru.json` (FR1), no orphan keys (FR1), glossary page names and deletion verbs (FR2, FR3), accessibility keys absent (FR4), repair/config keys absent (FR5), placeholder parity for every override (FR6), `_meta` intact (FR7), capitalized «Вы» forms (FR8), flattened inventory equals the normative table from `specs/house-locale/spec.md` (no extra / no missing keys)
- [x] 1.2 Write step definitions `house_locale.steps.ts` (vitest-cucumber) that import `house.json` + `ru.json` directly with a local flatten helper (importing from `scripts/i18n-check` would cross module boundaries); encode the normative inventory as a fixture module derived from the spec table
- [x] 1.3 Run the new suite only (`npx vitest run src/test/features/i18n/house-locale`) — confirm scenarios FAIL against the current locale (red)

## 2. Locale rewrite (GREEN)

- [x] 2.1 Rewrite `packages/client/src/locales/house.json`: keep `_meta`, replace all overrides with the normative inventory from `specs/house-locale/spec.md`, delete every key not in the inventory (implements FR1–FR8)
- [x] 2.2 Run the new suite again — confirm all scenarios PASS (green)

## 3. Verification

- [x] 3.1 Run `i18n-check` from `packages/client` — 0 `override-orphans`, 0 `undefined` errors (M1)
- [x] 3.2 Run the existing i18n unit/BDD suite (one command, foreground) — locale registry still discovers `house` with valid `_meta` (NFR-A1 fallback path unchanged)
- [x] 3.3 Call `get_file_problems` for changed files and run `pnpm run build` — no errors
- [x] 3.4 Note: Stryker not applicable — no production TS changed (JSON content + tests only); do not launch mutation runs

## 4. Purge count pluralization (FR9, added after smoke feedback)

- [x] 4.1 RED: write `packages/client/src/test/features/i18n/purge_count_agreement.feature` + steps — scenarios for ru/house/en counts (0, 1, 2, 5, 21) via `i18n.t("deleted.purgeCount*", { count, lng })`, plus composed `purgeConfirmCount` with `{{items}}`; update `house_locale.inventory.ts` with new plural keys; run the two suites — confirm FAIL
- [x] 4.2 GREEN: add per-entity plural keys (`deleted.purgeCountTasks`…`purgeCountIdeas`) to `ru.json` (`_one`/`_few`/`_many`) and `en.json` (`_one`/`_other`), switch `purgeConfirmCount` to `{{items}}` in both; override themed entities in `house.json` (contexts fall back)
- [x] 4.3 GREEN: compose the six counts in `DeletedPage.tsx` and pass as `items` to `deleted.purgeConfirmCount`
- [x] 4.4 GREEN: dialect plural-rule inheritance (FR10) — wrap `services.pluralResolver.getRule` in `i18n.ts` to resolve rules via `_meta.baseLanguage` (without it `Intl.PluralRules("house")` gives root rules and house plural overrides are unreachable); add a fallback-key scenario to the feature
- [x] 4.5 Verify: both new suites green, full i18n suite green, `i18n:check` OK, `get_file_problems` clean, `pnpm run build` passes

## 5. Manual smoke (single pass, not a test plan)

- [x] 5.1 Switch app language to «Доктор Хаус» and walk boxes/goals/ideas/deleted/settings pages once to confirm the narrative reads coherently and nothing renders a raw key (incl. purge dialog counts)
