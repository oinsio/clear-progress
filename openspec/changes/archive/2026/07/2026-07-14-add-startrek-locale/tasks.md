# Tasks: add-startrek-locale

## 1. Behavior spec (RED)

- [x] 1.1 Write `packages/client/src/test/features/i18n/startrek_locale.feature` — Gherkin scenarios tagged `@add-startrek-locale` + `@FR1`…`@FR9`: no redundant overrides vs `ru.json` (FR1), no orphan keys (FR1), glossary page names and deletion verbs (FR2, FR3), accessibility keys absent (FR4), repair/config keys absent (FR5), placeholder parity for every override (FR6), `_meta` exact incl. emoji 🖖 (FR7), capitalized «Вы» forms and lowercase «капитан» address (FR8), sync string length budget vs base (FR9), flattened inventory equals the normative table from `specs/startrek-locale/spec.md` (no extra / no missing keys)
- [x] 1.2 Write step definitions `startrek_locale.steps.ts` (vitest-cucumber) following the `house_locale.steps.ts` pattern: import `startrek.json` + `ru.json` directly with the local flatten helper; encode the normative inventory as `steps/startrek_locale.inventory.ts` derived from the spec table (single source of truth for tests)
- [x] 1.3 Run the new suite only (`npx vitest run src/test/features/i18n/startrek_locale`) — confirm scenarios FAIL while the locale file does not exist (red)

## 2. Locale file (GREEN)

- [x] 2.1 Create `packages/client/src/locales/startrek.json`: `_meta` per FR7 plus exactly the overrides of the normative inventory from `specs/startrek-locale/spec.md` (implements FR1–FR9 of add-startrek-locale)
- [x] 2.2 Run the new suite again — confirm all scenarios PASS (green)

## 3. Verification

- [x] 3.1 Run `i18n-check` from `packages/client` — 0 `override-orphans`, 0 `undefined` errors (M1)
- [x] 3.2 Run the existing i18n unit/BDD suite (one command, foreground) — locale registry discovers `startrek` with valid `_meta`, dialect plural rules resolve through `ru` for the new locale (existing `applyDialectPluralRules` path), house suite untouched and green
- [x] 3.3 Verify purge counts for the startrek locale render agreed forms for 1, 2, 5, 21 («1 задание / 2 задания / 5 заданий», «1 мир / 2 мира / 5 миров») via the existing purge-count agreement suite pattern (M4)
- [x] 3.4 Call `get_file_problems` for changed files and run `pnpm run build` — no errors
- [x] 3.5 Note: Stryker not applicable — no production TS changed (JSON content + tests only); do not launch mutation runs

## 4. Manual smoke (single pass, not a test plan)

- [x] 4.1 Switch app language to «Звёздный путь» 🖖 and walk boxes/goals/ideas/deleted/settings pages once to confirm the crew-to-captain narrative reads coherently, nothing renders a raw key, and «Прокладываем курс» / «Проложить другой курс» do not co-occur confusingly on one screen (UX3)
