# Design: add-project-locales

## Context

`en-project.json` and `ru-project.json` are the third and fourth dialect locales, and the first *terminology* dialects: unlike the themed house/startrek locales they carry no voice, no metaphors, no jokes — only a single-term substitution (goal → project / «цель» → «проект») for users accustomed to GTD vocabulary. The mechanics are unchanged and already proven: base-language fallback, dialect plural-rule inheritance (`applyDialectPluralRules`), auto-discovery by the locale registry. All decisions below were made with the user during the explore session (2026-07-14). Context: driven by FR1–FR7 from proposal.

## Goals / Non-Goals

**Goals:**
- A mechanically derivable override set: exactly the base keys whose value mentions the term — nothing editorial to maintain.
- Twin files governed by one rule set and one content-test suite.
- Zero ambiguity between GTD projects and the Supabase project in all locales.

**Non-Goals:**
- No i18n runtime or tooling changes; no memo theming; no wider GTD glossary; no changes to house/startrek content.

## Decisions

### D1: One capability for both dialects

Both files implement the same substitution rule and differ only in language; they are proposed, tested, and will evolve together. One capability spec (`project-locales`) with two normative inventories beats two near-identical specs. Rejected: `en-project-locale` + `ru-project-locale` as separate capabilities (duplicated rules, double maintenance for no benefit).

### D2: Inventory derived mechanically from base values

The override set is defined by a rule, not by taste: a base key belongs to the inventory iff its value matches the term regex — `/\bgoals?\b/i` for en, `/(?<![а-яёА-ЯЁ])цел(ь|ью|и|ей|ям|ями|ях)(?![а-яё])/iu` for ru. The Russian variant uses Cyrillic-aware lookaround boundaries rather than `\b`, because JavaScript `\b` is ASCII-only and matches nothing around Cyrillic (same reason `locale_content.helpers.ts` already uses lookaround for `LOWERCASE_ADDRESS_REGEX`). The boundaries deliberately exclude `{{goalName}}` (placeholder names are code, not copy) and unrelated words («целиком», «в целом»). The content tests re-derive the expected set from the base files at run time and compare it with the normative inventory — so when a future base key mentions the term, the suite fails and forces the dialect update. This is the self-guarding property themed dialects cannot have. Current inventory: 26 en keys, 27 ru keys (plural forms differ: `_one/_other` vs `_one/_few/_many`).

### D3: Locale codes `en-project` / `ru-project`

Hyphenated codes read as language variants (BCP 47-like `lang-variant` shape), matching the UX intent: same flag emoji as the base language, `name` sorting directly after it in the switcher («English (project)» after «English»). Plural rules resolve through `baseLanguage` regardless of code shape (rework-house-locale FR10), so the non-standard subtag is harmless. Rejected: `gtd-en`/`gtd-ru` (sorts away from base languages, reads as a theme), `projecten`/`projectru` (unreadable).

### D4: Fix `sync.projectPaused` in the base locales, not in the dialects

"Project paused" / «Проект приостановлен» is about the Supabase backend and is ambiguous even without a GTD dialect. Changing the base wording to "Supabase paused" / «Supabase приостановлен» removes the ambiguity for every user, keeps the dialects free of overrides outside their term rule (D2), and leaves house/startrek untouched (their `sync.projectPaused` overrides still differ from the new base values, so the minimal-override invariant holds). `projectPausedDialog.*` and `settings.server.*` already name Supabase explicitly and stay as they are. Rejected: overriding `sync.projectPaused` only inside the project dialects (base users keep the ambiguity; dialect files gain a key outside the mechanical rule).

### D5: Accessibility strings are substituted, not fenced off

Themed dialects fence off aria strings because jokes degrade operability. A terminology substitution does not: "Drag project" / «Перетащить проект» is exactly as operable as the base string and *more* consistent for a screen-reader user who chose the dialect. So the term rule (D2) applies to all keys uniformly, including `goal.drag` and `goal.editName`. Rejected: inheriting the house/startrek no-theming zone verbatim (would leave SR users hearing «цель» in an app that everywhere else says «проект»).

### D6: Content tests follow the house/startrek suite pattern

One feature file (`project_locales.feature`) with scenarios parameterized over both locales, plus one inventory constant per locale in `steps/`, mirroring `startrek_locale.inventory.ts`. The spec table is the single source of truth; the inventory constants mirror it. Rejected: two separate feature files (the scenarios are identical modulo locale).

## Risks / Trade-offs

- [Future base keys mention the term without a dialect override] → D2's run-time derivation check fails the suite, pointing at the missing key.
- [Term regex false positives/negatives in future copy] → Word-boundary regexes are spec'd normatively; a genuinely ambiguous future string would surface as an unexpected inventory diff and be resolved by amending the spec consciously, not silently.
- [«проект» collides with remaining Supabase strings (`settings.server.*`, `projectPausedDialog.*`)] → Those surfaces name Supabase explicitly; the one ambiguous short status is fixed by D4.
- [Dialect divergence: three content-rule suites (house, startrek, project) evolve separately] → Terminology dialects share only FR1/FR4-style invariants with themed ones; if a fourth dialect appears, extract a shared `dialect-locales` content-invariant spec then (same stance as startrek design).
- [share.inviteMessage in a dialect sends "projects" to a recipient who will see "goals"] → Accepted: the invite describes the app in the sender's vocabulary; the recipient's locale is their own choice.
