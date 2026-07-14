# rework-house-locale

## Why

The Dr. House dialect locale (`house.json`) grew organically and suffers from inconsistent terminology: tasks are called «страдание», «пациент», «жалоба», or «случай» depending on the screen; goals are «иллюзии» in one place and «навязчивые идеи» in another; deletion is «ампутировать», «ликвидировать», or «удалить». Since locale fallback to the base language was implemented (deduplicate-i18n-common-keys), the file can also shed every key that merely duplicates `ru.json`. This change rebuilds the locale around a single coherent glossary (the Princeton-Plainsboro hospital metaphor) and trims it to themed-only overrides.

## What Changes

- **MODIFIED**: `packages/client/src/locales/house.json` is rewritten from scratch: new glossary-driven phrases (in Russian), removal of all keys identical to the `ru.json` base, removal of themed overrides for accessibility and data-repair strings.
- **ADDED**: a documented glossary and theming rules for the House locale, enforced by automated content tests.
- **MODIFIED**: the purge confirmation count message gains grammatical number agreement. The old single key interpolated six counts and produced «1 озарений»/«1 задач»; it is split into per-entity plural keys (`_one`/`_few`/`_many` in ru, `_one`/`_other` in en) composed into a list by `DeletedPage`.
- The i18n mechanism and i18n-check tooling stay as-is.

## Capabilities

### New Capabilities

- `house-locale`: content rules for the Dr. House dialect locale — fixed entity glossary, minimal-override principle, no-theming zones (accessibility, data-repair instructions, server configuration), placeholder and plural-structure parity with the base locale.

### Modified Capabilities

- `deleted-entities`: the purge confirmation dialog SHALL show grammatically agreed per-entity counts (new requirement).
- `i18n`: dialect locales SHALL resolve plural rules through their base language (new requirement; without it, plural overrides in dialect files are unreachable — `Intl.PluralRules("house")` yields root rules where every count maps to `other`). `i18n-check` is untouched.

## Goals

- G1: One entity — one term across the entire locale (0 synonym drift for tasks, goals, ideas, boxes, deletion verbs).
- G2: `house.json` contains only keys whose values differ from `ru.json` (0 redundant overrides).
- G3: Themed strings never degrade accessibility or error recovery (aria/alt and repair instructions always fall back to base).

## Non-Goals

- NG1: No changes to i18n runtime, locale registry, or fallback mechanics — except dialect plural-rule inheritance (FR10): dialect locale codes are not BCP 47 languages, so `Intl.PluralRules` degrades them to root rules; plural rules now resolve through `_meta.baseLanguage`.
- NG2: No changes to `ru.json` / `en.json` base locales beyond the purge-count pluralization keys of FR9.
- NG3: No new i18n-check rules or CLI features.
- NG4: No theming of the `context` namespace (deliberate fallback — contexts stay neutral).

## Users & Scenarios

- U1: A Russian-speaking user who selected the Dr. House locale sees a consistent hospital narrative: tasks are patients, goals are diagnoses, ideas are epiphanies, deleted items live in the morgue.
- U2: A screen-reader user on the House locale hears functional labels (from base fallback) for drag handles, checkboxes, and file actions — jokes never replace operability.
- U3: A user hitting a sync data-repair alert gets the plain base instruction, not a joke, so they can fix the problem.

## Requirements

### Functional

- FR1: `house.json` SHALL contain only keys whose values differ from the corresponding `ru.json` values; keys identical to base SHALL be removed (fallback covers them).
- FR2: All themed strings SHALL use the fixed glossary terms for app entities (see design.md): task = «пациент», goal = «диагноз», idea = «озарение», category = «отделение», checklist = «назначения», attachment = «снимок», memo = «советы Уилсона», deleted = «морг», box = «палата», inbox/today/week/later/all = «Приёмный покой»/«Критические»/«Под наблюдением»/«Лист ожидания»/«Обход».
- FR3: Action verbs SHALL be consistent: delete living entities = «в морг», delete structural entities = «закрыть», restore = «реанимировать», complete task = «выписать», hide = «карантин», purge = «кремация», move = «перевести».
- FR4: `house.json` SHALL NOT override accessibility-only strings (aria-labels, alt texts, screen-reader position announcements), except where the glossary term itself is the clearest action name (e.g. `deleted.restoreAriaLabel` «Реанимировать {{name}}»).
- FR5: `house.json` SHALL NOT override data-repair and configuration instruction strings: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, `repeat.ruleNotRecognized`, `repeat.invalidRuleAlert*`.
- FR6: Every overridden key SHALL preserve the interpolation placeholders (`{{count}}`, `{{date}}`, `{{name}}`, …) and plural/ordinal suffix structure of its base key.
- FR7: `_meta` SHALL be preserved with `code: "house"`, `baseLanguage: "ru"` and remain the only namespace allowed to be absent from base.
- FR8: All direct addresses to the user SHALL use capitalized «Вы»/«Ваш» forms.
- FR9: The purge confirmation count message SHALL agree entity names with their counts in every locale (ru: «1 задача / 2 задачи / 5 задач»; house: «1 озарение / 2 озарения / 5 озарений»; en: «1 task / 2 tasks») via per-entity plural keys composed into a list; the house locale SHALL override the plural keys of themed entities only (contexts fall back).
- FR10: Dialect locales (where `_meta.baseLanguage` differs from the locale code) SHALL select CLDR plural forms using the plural rules of their base language, both for keys overridden in the dialect file and for keys served via fallback.

### Non-Functional

#### Accessibility

- NFR-A1: With the House locale active, every interactive element SHALL still expose a meaningful accessible name (via base fallback for non-themed aria keys); axe-core checks pass unchanged.

## UX Acceptance Criteria

- UX1: Empty states, confirmations, and statuses read as one coherent hospital story; no screen mixes two different terms for the same entity.
- UX2: Destructive confirmation buttons (`disconnectConfirm`, `purgeConfirm`, common `cancel`/`save`) remain instantly comprehensible: either base fallback or a glossary verb whose meaning is unambiguous («Кремировать»).

## UI States Matrix

Not applicable — content-only change; no components or states are added or modified.

## Behavior

- `packages/client/src/test/features/i18n/house-locale.feature` — BDD unit scenarios (tagged `@rework-house-locale`) validating FR1–FR8 against the JSON content: no redundant overrides, no orphan keys, forbidden-zone keys absent, placeholder parity, glossary conformance for entity page names.

## Visual Reference

Not applicable — no visual changes; design tokens untouched.

## Affected IA

No changes.

## Success Metrics

- M1: `i18n-check` exits 0 — no `override-orphans`, no `undefined` keys.
- M2: 0 keys in `house.json` with a value identical to `ru.json` (verified by automated test).
- M3: 0 overridden keys inside the no-theming zones of FR4/FR5 (verified by automated test).
- M4: 100% of overridden keys preserve base placeholders (verified by automated test).
- M5: purge counts 0, 1, 2, 5, 21 render grammatically agreed entity names in ru, en, and house locales (verified by automated test).

## Open Questions

None — glossary and phrase inventory were settled during the explore session (2026-07-13).
