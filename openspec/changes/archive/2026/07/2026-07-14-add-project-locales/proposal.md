# add-project-locales

## Why

In GTD methodology, what this app calls a «goal» is called a «project». Users coming from GTD keep stumbling over the unfamiliar term. The dialect-locale mechanism (proven by `house-locale` and `startrek-locale`) lets us offer terminology variants at zero runtime cost: two minimal dialects — `en-project` and `ru-project` — that replace goal/«цель» with project/«проект» and fall back to the base language for everything else. Additionally, the current short sync status "Project paused" / «Проект приостановлен» (about the Supabase backend) becomes ambiguous next to GTD projects, so the base locales get an unambiguous wording.

## What Changes

- **ADDED**: `packages/client/src/locales/en-project.json` — dialect locale (base `en`, emoji 🇺🇸) overriding only the keys whose base value mentions "goal".
- **ADDED**: `packages/client/src/locales/ru-project.json` — dialect locale (base `ru`, emoji 🇷🇺) overriding only the keys whose base value mentions «цель», with correct masculine gender and plural agreement.
- **MODIFIED**: `sync.projectPaused` in `en.json` and `ru.json` — "Project paused" → "Supabase paused", «Проект приостановлен» → «Supabase приостановлен» — to remove ambiguity with GTD projects (and with dialect users in general). `projectPausedDialog.*` stays unchanged (it already names Supabase explicitly).
- No changes to the i18n mechanism, locale registry, `i18n-check` tooling, or existing dialect locales — the registry discovers the new files automatically.

## Capabilities

### New Capabilities

- `project-locales`: content rules for the twin GTD-terminology dialect locales — exact override inventory (keys whose base value mentions goal/«цель»), terminology-only substitution (no theming, no voice), grammatical agreement rules for Russian, `_meta` exactness, placeholder and plural-structure parity, minimal-override principle.

### Modified Capabilities

- `project-paused-detection`: the sidebar paused-status wording changes from "Project paused" to "Supabase paused" (requirement text fixes the literal string).

## Impact

- `packages/client/src/locales/`: two new JSON files; two values changed in `en.json`/`ru.json`.
- `packages/client/src/test/features/i18n/`: new BDD content suite for the twin dialects (same pattern as house/startrek suites).
- No production TypeScript changes; no API, storage, or sync impact.

## Goals

- G1: A GTD-attuned user can select a locale where every user-facing mention of goal/«цель» reads project/«проект» (0 remaining goal-terminology strings in the dialect view).
- G2: Dialect files contain only keys whose values differ from base (0 redundant overrides, 0 orphans).
- G3: The Supabase paused status is unambiguous in every locale (0 strings where "project" could mean either GTD project or Supabase backend).

## Non-Goals

- NG1: No changes to i18n runtime, locale registry, fallback mechanics, plural-rule inheritance, or `i18n-check` rules.
- NG2: No wider GTD terminology (Someday/Maybe for ideas, Next Actions, Review, etc.) — this change swaps exactly one term. A full GTD dialect can be a future change.
- NG3: No memo theming — memos resolve by `baseLanguage`, so dialect users read base-language memos that may say «цель»/"goal" (accepted; changing memo resolution is out of scope).
- NG4: No changes to `house.json` or `startrek.json` (their `sync.projectPaused` overrides remain valid — they still differ from the new base values).
- NG5: No theming or voice — these are terminology dialects, not themed dialects; no jokes, no metaphors, no glossary beyond the one term.

## Users & Scenarios

- U1: A Russian-speaking GTD practitioner selects «Русский (проект)» and sees «Мои проекты», «Новый проект...», «Без проекта» — the app speaks their GTD vocabulary while everything else stays standard Russian.
- U2: An English-speaking GTD practitioner selects "English (project)" and sees "My Projects", "New project...", "No project".
- U3: A screen-reader user on a project dialect hears the same consistent terminology in accessible names ("Drag project", «Перетащить проект») — substitution never degrades operability because it is terminology-only.
- U4: Any user whose Supabase project is paused sees "Supabase paused" / «Supabase приостановлен» in the sidebar and immediately knows it is about the backend, not their goals/projects.

## Requirements

### Functional

- FR1: `en-project.json` and `ru-project.json` SHALL contain only keys whose values differ from the corresponding base (`en.json` / `ru.json`) values; every non-`_meta` key SHALL exist in the base file (no orphans).
- FR2: The override set of each dialect SHALL be exactly the keys whose base value contains the word goal / «цель» (in any grammatical form), per the normative inventory in `specs/project-locales/spec.md` — no more, no fewer.
- FR3: Every override SHALL differ from its base value only by replacing goal→project / «цель»→«проект», including required grammatical adjustments: in Russian, gender agreement (masculine: «Проект не найден», «Новый проект», «ознакомительного проекта») and plural forms («проект / проекта / проектов»); no other wording, punctuation, or tone changes.
- FR4: Every overridden key SHALL preserve the interpolation placeholders (`{{count}}`, `{{goalName}}`, …) and the plural-suffix structure (`_one/_other` for en, `_one/_few/_many` for ru) of its base key.
- FR5: `_meta` SHALL be exactly `{ code: "en-project", name: "English (project)", nativeName: "English (project)", baseLanguage: "en", emoji: "🇺🇸" }` and `{ code: "ru-project", name: "Russian (project)", nativeName: "Русский (проект)", baseLanguage: "ru", emoji: "🇷🇺" }`.
- FR6: `sync.projectPaused` SHALL be "Supabase paused" in `en.json` and «Supabase приостановлен» in `ru.json`; all other `sync.*`, `projectPausedDialog.*`, and `settings.server.*` keys SHALL remain unchanged.
- FR7: Accessibility strings that mention the term (e.g. `goal.drag`, `goal.editName`) SHALL be overridden with the same terminology substitution — unlike themed dialects, terminology dialects keep accessible names fully functional, so no no-theming zone applies to the term itself.

### Non-Functional

#### Accessibility

- NFR-A1: With a project dialect active, every interactive element SHALL expose a meaningful accessible name — either a terminology-substituted override or base fallback; axe-core checks pass unchanged.

## UX Acceptance Criteria

- UX1: In the locale switcher, the dialects appear directly after their base languages ("English (project)" after "English", "Russian (project)" after "Russian" — guaranteed by sorting on English `name`) with the same flag emoji, reading as language variants rather than themes.
- UX2: No screen in a project dialect mixes the terms: goal/«цель» never appears alongside project/«проект» (everything reachable through fallback contains no goal terminology by construction of FR2).
- UX3: The paused-backend status is instantly attributable to Supabase in all locales.

## UI States Matrix

Not applicable — content-only change; no components or states are added or modified.

## Behavior

- `packages/client/src/test/features/i18n/project_locales.feature` — BDD unit scenarios (tagged `@add-project-locales`) validating FR1–FR7 against the JSON content: no redundant overrides, no orphan keys, inventory exactness for both files, placeholder and plural-suffix parity, `_meta` exactness, base wording of `sync.projectPaused`, absence of goal-terminology in override values.

## Visual Reference

Not applicable — no visual changes. The locales appear in the existing switcher with 🇺🇸/🇷🇺 emoji.

## Affected IA

No changes.

## Success Metrics

- M1: `i18n-check` exits 0 — no `override-orphans`, no `undefined` keys.
- M2: 0 keys in either dialect file with a value identical to its base value.
- M3: Each dialect file matches its normative inventory exactly — no missing and no extra keys (verified by automated test).
- M4: 100% of overridden keys preserve base placeholders and plural-suffix structure (verified by automated test).
- M5: 0 override values containing the replaced term (regex goal/«цель» in any form) and 0 base keys mentioning the term without an override (verified by automated test).
- M6: `sync.projectPaused` equals the new wording in both base locales; `projectPausedDialog.*` byte-identical to before (verified by automated test).

## Open Questions

None — locale codes, names, emoji, and the base-locale wording were settled during the explore session (2026-07-14).
