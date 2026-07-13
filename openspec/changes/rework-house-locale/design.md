# Design: rework-house-locale

## Context

`house.json` is a dialect locale (`_meta.baseLanguage: "ru"`) that overrides `ru.json`. Since deduplicate-i18n-common-keys, missing keys fall back to the base locale, and `i18n-check` reports override keys absent from base as `override-orphans` errors. The current file predates fallback: it carries ~150 keys, many identical to base, and its terminology drifted across namespaces (4 synonyms for "task", 3 for "goal", 3 deletion verbs).

Decisions below were made with the user during the explore session (2026-07-13). Context: driven by FR1–FR8 from proposal.

## Goals / Non-Goals

**Goals:**
- A single glossary (Princeton-Plainsboro hospital metaphor) every current and future key must follow.
- Minimal file: themed overrides only, everything else falls back.
- Codified no-theming zones so humor never costs operability.

**Non-Goals:**
- No i18n runtime or tooling changes; no base-locale changes; no `en`-based House locale.

## Decisions

### D1: Entity glossary

| App entity         | House term        | Rationale / alternatives rejected                                                                                                                                                  |
|--------------------|-------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Task               | пациент           | Full lifecycle maps to canon (admit → quarantine → discharge → relapse → morgue → resuscitate). Rejected: «назначение» (dry everyday strings), «страдание» (no lifecycle)          |
| Goal               | диагноз           | Achieving = confirming («Подтверждён. Я был прав»), abandoning = «Опровергнут». Rejected: «загадка» (weaker medical verbs), «случай» (forces task rename), «курс лечения» (clunky) |
| Task→Goal link     | поставить диагноз | Falls out of the two rows above for free                                                                                                                                           |
| Idea               | озарение          | House's epiphany moments; matches "capture fleeting thought". Rejected: «гипотеза» (drier), «доска» (whiteboard isn't memorable in RU dub), «версия» (collides with app version)   |
| Checklist item     | назначение        | Doctor's orders: «МРТ, пункция, посев»                                                                                                                                             |
| Category           | отделение         | Hospital departments = life spheres                                                                                                                                                |
| Context            | — (fallback)      | User's contexts are time/state-based; «кабинет» would lie. Deliberate neutral zone                                                                                                 |
| Box (generic)      | палата            | «Палата по умолчанию»; «отделение» taken, «крыло» colder                                                                                                                           |
| Inbox              | Приёмный покой    | Entry point for the unsorted                                                                                                                                                       |
| Today              | Критические       | Rejected: «Реанимация» (collides with restore = «реанимировать»)                                                                                                                   |
| Week               | Под наблюдением   | Rejected: «Стационар» (no "soon" semantics)                                                                                                                                        |
| Later              | Лист ожидания     | Comprehensible to non-viewers. Rejected: «Клиника» (opaque fan-service)                                                                                                            |
| All                | Обход             | Rounds = seeing every patient; a view name, not a place                                                                                                                            |
| Hidden task        | карантин          | Hide until date = isolate                                                                                                                                                          |
| Attachment / cover | снимок            | MRI/X-ray; uploads «проявляются»                                                                                                                                                   |
| Memo               | советы Уилсона    | Wilson is the advice-giver; rhymes with «озарения» (his remarks trigger them)                                                                                                      |
| Deleted            | морг              | Kept from the old file — its best find                                                                                                                                             |
| Purge              | кремация          | Irreversibility is in the word itself                                                                                                                                              |
| Search             | диагностика       | Symptoms in → matches out; `noResults` hosts «Это никогда не волчанка»                                                                                                             |
| Sync (background)  | сверка карт       | Routine record reconciliation                                                                                                                                                      |
| Full sync          | консилиум         | The ceremonial gathering; disconnect = «распустить консилиум»                                                                                                                      |
| Settings           | администрация     | Cuddy's domain; theme values: «Плацебо» / «Ночная смена» / «Как решит Кадди»                                                                                                       |

### D2: Verb system (consistency rule)

- Living entities (patients, diagnoses, epiphanies) go «в морг»; diagnoses are «сняты», epiphanies «забыты» — but all land in the morgue.
- Structural entities (отделения) are «закрыты», never sent to the morgue.
- restore = «реанимировать», complete = «выписать», uncomplete = «рецидив», move = «перевести», recurring = «хроническое» / «без рецидивов».

### D3: No-theming zones

Fallback to base is mandatory for:
1. Accessibility-only strings: aria-labels, alt texts, SR announcements (`alert.*`, `attachment.list.*`, drag handles, checkbox marks). Exception: when the glossary verb IS the clearest label (`deleted.restoreAriaLabel` «Реанимировать {{name}}»).
2. Data-repair and config instructions: `sync.alert.*`, `settings.server.*`, `projectPausedDialog.*`, invalid-repeat-rule strings.
3. Navigation/confirmation buttons where instant readability matters: `common.cancel/save/close/back/next`, `settings.disconnectConfirm`, `commandBar.create`.
4. Functional settings labels (language, handedness, scale, panels) and the repeat-rule configurator (all of `repeat.*` except `none`).

Rule of thumb fixed with the user: jokes live in statuses, empty states, and confirmations; instructions for fixing problems stay literal.

### D4: Register

Direct address uses capitalized «Вы»/«Ваш» (formal address to the user). Ellipses in placeholders follow base style (`...`).

### D5: Phrase inventory location

The normative key-by-key inventory lives in `specs/house-locale/spec.md` (single source of truth for implementation and tests). design.md holds only the rules that generated it, so future keys can be derived without re-deciding.

## Risks / Trade-offs

- [Humor ages or annoys daily] → Jokes concentrate in low-frequency surfaces (empty states, confirmations, sync statuses); high-frequency labels are terse glossary nouns.
- [Non-viewers miss references] → Every phrase still states its function literally («Это никогда не волчанка» still means "nothing found"); box names chosen for comprehension over fan-service (D1: Лист ожидания).
- [Glossary drift returns with future keys] → Glossary + zones are spec'd and covered by content tests; adding an off-glossary key fails review against this design.
- [Removed keys regress to base unintentionally] → BDD content test asserts no override equals its base value, and i18n-check guards orphans; visual diff of the locale is part of tasks.
