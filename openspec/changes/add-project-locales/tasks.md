# Tasks: add-project-locales

## 1. Behavior spec (RED)

- [ ] 1.1 Write `packages/client/src/test/features/i18n/project_locales.feature` — Gherkin scenarios tagged `@add-project-locales` + `@FR1`…`@FR7`, parameterized over both dialects: no redundant overrides vs base (FR1), no orphan keys (FR1), inventory equals the run-time derivation from base via the term regexes `/\bgoals?\b/i` and `/\bцел(ь|ью|и|ей|ям|ями|ях)\b/i` (FR2), flattened files equal the normative inventories from `specs/project-locales/spec.md` (FR2, FR3), no override value matches its base-language term regex (FR3), placeholder and plural-suffix parity (FR4), `_meta` exactness incl. flags 🇺🇸/🇷🇺 (FR5), a11y keys `goal.drag`/`goal.editName` substituted (FR7), base wording `sync.projectPaused` = "Supabase paused" / «Supabase приостановлен» (FR6)
- [ ] 1.2 Write step definitions `steps/project_locales.steps.ts` (vitest-cucumber) following the `startrek_locale.steps.ts` pattern: import both dialect + base JSON files with the local flatten helper; encode the normative inventories as `steps/project_locales.inventory.ts` derived from the spec tables (single source of truth for tests)
- [ ] 1.3 Run the new suite only (`npx vitest run src/test/features/i18n/project_locales`) — confirm scenarios FAIL while the locale files do not exist (red)

## 2. Locale files (GREEN)

- [ ] 2.1 Change `sync.projectPaused` in `packages/client/src/locales/en.json` to "Supabase paused" and in `ru.json` to «Supabase приостановлен»; touch nothing else (implements FR6 of add-project-locales)
- [ ] 2.2 Create `packages/client/src/locales/en-project.json`: `_meta` per FR5 plus exactly the 26 overrides of the normative en-project inventory (implements FR1–FR5, FR7 of add-project-locales)
- [ ] 2.3 Create `packages/client/src/locales/ru-project.json`: `_meta` per FR5 plus exactly the 27 overrides of the normative ru-project inventory (implements FR1–FR5, FR7 of add-project-locales)
- [ ] 2.4 Run the new suite again — confirm all scenarios PASS (green)

## 3. Verification

- [ ] 3.1 Run `i18n-check` from `packages/client` — 0 `override-orphans`, 0 `undefined` errors, house/startrek untouched and still clean (M1)
- [ ] 3.2 Run the existing i18n unit/BDD suite (one command, foreground) — locale registry discovers both new codes with valid `_meta`, dialect plural rules resolve through `en`/`ru`, house and startrek suites stay green (their `sync.projectPaused` overrides still differ from the new base values)
- [ ] 3.3 Verify purge counts for `ru-project` render agreed forms for 1, 2, 5, 21 («1 проект / 2 проекта / 5 проектов / 21 проект») via the existing purge-count agreement suite pattern (M3, M4)
- [ ] 3.4 Grep the repo for tests or snapshots asserting the old literal "Project paused" / «Проект приостановлен» and update any found alongside the wording change (M6)
- [ ] 3.5 Call `get_file_problems` for changed files and run `pnpm run build` — no errors
- [ ] 3.6 Note: Stryker not applicable — no production TS changed (JSON content + tests only); do not launch mutation runs

## 4. Manual smoke (single pass, not a test plan)

- [ ] 4.1 Switch app language to «Русский (проект)» 🇷🇺 and "English (project)" 🇺🇸, walk goals/search/deleted/command-bar/onboarding surfaces once to confirm every goal mention reads «проект»/"project", the switcher sorts the dialects next to their base languages (UX1), and no screen mixes the two terms (UX2)
