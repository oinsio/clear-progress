# add-startrek-locale

## Why

The app has one dialect locale (Dr. House) proving that themed locales work on top of the base-language fallback. Star Trek is the second dialect: a Russian-language «Звёздный путь» locale where the app is the starship Enterprise and the user is its captain. The glossary, voice, and box naming were settled during the explore sessions of 2026-07-13/14; this change turns those decisions into a shipped locale built with the content rules proven by `rework-house-locale`.

## What Changes

- **ADDED**: `packages/client/src/locales/startrek.json` — a new dialect locale (base language `ru`, emoji 🖖) containing only themed overrides that differ from `ru.json`.
- **ADDED**: a documented glossary, verb system, and voice rules for the Star Trek locale, enforced by automated content tests (BDD inventory, same pattern as the House locale).
- No changes to the i18n mechanism, locale registry, `i18n-check` tooling, or existing locales — the registry discovers the new file automatically.

## Capabilities

### New Capabilities

- `startrek-locale`: content rules for the Star Trek dialect locale — fixed entity glossary (starship metaphor), crew-to-captain voice with character cameo quotes (TOS + TNG), minimal-override principle, no-theming zones (accessibility, data-repair instructions, server configuration), placeholder and plural-structure parity with the base locale.

### Modified Capabilities

None — `i18n` (including dialect plural-rule inheritance) and `house-locale` are untouched.

## Goals

- G1: One entity — one term across the entire locale (0 synonym drift for tasks, goals, ideas, boxes, deletion verbs).
- G2: `startrek.json` contains only keys whose values differ from `ru.json` (0 redundant overrides).
- G3: Themed strings never degrade accessibility or error recovery (aria/alt and repair instructions always fall back to base).
- G4: Every phrase derived from a franchise quote is canon-accurate (0 known misquotes, e.g. no literal «Beam me up, Scotty»).

## Non-Goals

- NG1: No changes to i18n runtime, locale registry, fallback mechanics, or plural-rule inheritance (already implemented by `rework-house-locale` FR10).
- NG2: No changes to `ru.json`, `en.json`, or `house.json`.
- NG3: No theming of the `context` namespace (deliberate fallback — contexts stay neutral; alternatives «пост»/«станция»/«точка высадки» were considered and rejected).
- NG4: No new i18n-check rules or CLI features.
- NG5: No English-based Star Trek dialect (this locale is a `ru` dialect only).

## Users & Scenarios

- U1: A Russian-speaking user who selected the Star Trek locale sees a consistent starship narrative: the crew reports to them as captain — ideas are new worlds, goals are missions, tasks are assignments, deleted items drift «за бортом».
- U2: A fan recognizes character voices in designated spots (Spock on illogical states, Scotty on engineering, McCoy on lost connection) and canon-accurate references; a non-fan still understands every control because terms are self-explanatory in Russian.
- U3: A screen-reader user on the Star Trek locale hears functional labels (from base fallback) for drag handles, checkboxes, and file actions — jokes never replace operability.
- U4: A user hitting a sync data-repair alert gets the plain base instruction, not a joke, so they can fix the problem.

## Requirements

### Functional

- FR1: `startrek.json` SHALL contain only keys whose values differ from the corresponding `ru.json` values; keys identical to base SHALL be removed (fallback covers them).
- FR2: All themed strings SHALL use the fixed glossary terms for app entities (see design.md): idea = «новый мир», goal = «миссия», task = «задание», checklist item = «директива», category = «отсек», box (generic) = «курс», inbox/today/week/later/all = «Первый контакт»/«Прямо по курсу»/«Ближний космос»/«Глубокий космос»/«Вся галактика», completed-group headers = «Журнал миссий» wording, memo = «Журнал капитана», deleted = «За бортом», attachment = «голозапись», search = «сканирование», sync = «телеметрия», settings = «Машинное отделение».
- FR3: Action verbs SHALL be consistent: delete tasks/goals = «за борт», delete idea = «покинуть орбиту», delete structural entities (category) = «задраить», restore from bin = «поднять на борт», purge = «отпустить в дрейф», complete task = «выполнено», uncomplete = «возобновить», hide = «включить маскировку», unhide = «снять маскировку», move between boxes = «проложить другой курс», recurring = «регулярный патруль».
- FR4: `startrek.json` SHALL NOT override accessibility-only strings (aria-labels, alt texts, screen-reader position announcements), except where the glossary term itself is the clearest action name (e.g. restore aria-label «Поднять на борт {{name}}»).
- FR5: `startrek.json` SHALL NOT override data-repair and configuration instruction strings: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, `repeat.ruleNotRecognized`, `repeat.invalidRuleAlert*`, `auth.*`.
- FR6: Every overridden key SHALL preserve the interpolation placeholders (`{{count}}`, `{{date}}`, `{{name}}`, …) and plural/ordinal suffix structure of its base key.
- FR7: `_meta` SHALL be `{ code: "startrek", name: "Star Trek", nativeName: "Звёздный путь", baseLanguage: "ru", emoji: "🖖" }`.
- FR8: The locale voice SHALL be the crew addressing the user as «капитан» (lowercase mid-sentence); where base keys address the user directly, overrides SHALL use either the «капитан» address or capitalized «Вы»/«Ваш» forms; character cameo lines (Spock, Picard, Scotty, McCoy) are allowed only in empty states, statuses, loading, and error texts — never on action buttons.
- FR9: Sync status strings SHALL stay short enough for the status indicator: no themed sync string may exceed its `ru.json` counterpart by more than 10 characters.

### Non-Functional

#### Accessibility

- NFR-A1: With the Star Trek locale active, every interactive element SHALL still expose a meaningful accessible name (via base fallback for non-themed aria keys); axe-core checks pass unchanged.

## UX Acceptance Criteria

- UX1: Empty states, confirmations, and statuses read as one coherent starship story; no screen mixes two different terms for the same entity.
- UX2: Destructive confirmation buttons remain instantly comprehensible: either base fallback or a glossary verb whose meaning is unambiguous; the purge confirmation states irreversibility explicitly («Отпустить в дрейф» + plain-language warning).
- UX3: The «Прокладываем курс» goal status and the «Проложить другой курс» move action never appear side by side on one screen with conflicting meaning (verified during inventory review).

## UI States Matrix

Not applicable — content-only change; no components or states are added or modified.

## Behavior

- `packages/client/src/test/features/i18n/startrek_locale.feature` — BDD unit scenarios (tagged `@add-startrek-locale`) validating FR1–FR9 against the JSON content: no redundant overrides, no orphan keys, forbidden-zone keys absent, placeholder parity, glossary conformance, `_meta` exactness, sync string length budget.

## Visual Reference

Not applicable — no visual changes; design tokens untouched. The locale emoji 🖖 appears in the existing locale switcher.

## Affected IA

No changes.

## Success Metrics

- M1: `i18n-check` exits 0 — no `override-orphans`, no `undefined` keys.
- M2: 0 keys in `startrek.json` with a value identical to `ru.json` (verified by automated test).
- M3: 0 overridden keys inside the no-theming zones of FR4/FR5 (verified by automated test).
- M4: 100% of overridden keys preserve base placeholders and plural suffix structure (verified by automated test).
- M5: `startrek.json` matches the normative phrase inventory exactly — no missing and no extra keys (verified by automated test).
- M6: 0 themed sync strings exceeding the FR9 length budget (verified by automated test).

## Open Questions

None — glossary, voice, box naming, and emoji were settled during the explore sessions (2026-07-13/14).
