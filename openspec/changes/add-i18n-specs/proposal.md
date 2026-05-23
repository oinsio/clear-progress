# Add i18n Specs

## Why

Internationalization (i18n) is fully implemented: i18next setup, locale registry with auto-discovery, language provider with browser detection, localStorage persistence, fallback chains, pluralization, and ordinals. However, there are no formal OpenSpec specifications and no BDD tests. Business rules (language detection priority, fallback logic, locale validation, translation completeness) are not captured as executable specifications.

## What Changes

- **ADDED**: OpenSpec specification for i18n capability (`openspec/specs/i18n/spec.md`)
- **ADDED**: BDD unit tests (vitest-cucumber) covering language detection, switching, persistence, locale registry, fallback, and translation completeness

## Goals

- G1: Every i18n business rule has an executable Gherkin specification
- G2: Capability spec documents all requirements with scenarios
- G3: Translation completeness is verified automatically (no missing keys between locales)

## Non-Goals

- NG1: Changing any application code -- this is documentation and tests only
- NG2: Adding new languages or locales
- NG3: E2E tests for language switcher UI -- can be a separate change
- NG4: Migrating existing LanguageProvider unit tests to BDD

## Users & Scenarios

- U1: Developer modifies LanguageProvider or localeRegistry -> BDD tests catch regressions
- U2: Developer adds a new locale file -> completeness test catches missing keys
- U3: New developer reads spec.md -> understands all i18n capabilities without reading code

## Requirements

### Functional

- FR1: System detects browser language and selects a matching supported locale on first visit
- FR2: System falls back to DEFAULT_LANGUAGE when browser language is not supported
- FR3: User can switch language; UI updates immediately and i18next language changes
- FR4: Selected language persists in localStorage under STORAGE_KEYS.LANGUAGE
- FR5: On reload, system restores language from localStorage if it is a valid locale code
- FR6: Invalid locale code in localStorage causes fallback to browser detection or DEFAULT_LANGUAGE
- FR7: Locale registry auto-discovers all JSON files in `src/locales/` and validates `_meta`
- FR8: Locale file with missing or incomplete `_meta` is rejected with console error
- FR9: Locale file where `_meta.code` does not match filename is rejected with console error
- FR10: Fallback chain: dialect locale falls back to its `baseLanguage`, then to DEFAULT_LANGUAGE
- FR11: Every translation key in the default locale file exists in all other locale files (completeness)
- FR12: Pluralization works correctly for Russian (one/few/many) and English (one/other)

## UX Acceptance Criteria

_No new UX criteria -- existing UI is not changing._

## Behavior

See `packages/client/src/test/features/i18n/*.feature` (tags `@add-i18n-specs`)

## Affected IA

No changes. Settings page with language switcher already exists.

## Success Metrics

- M1: All BDD unit scenarios pass (100% green)
- M2: Build passes without errors
- M3: Every FR has at least one BDD scenario with traceability tag
- M4: Translation completeness test catches a deliberately missing key

## Open Questions

_No open questions._

## Capabilities

### New Capabilities

- `i18n`: Internationalization -- language detection, switching, persistence, locale registry, fallback chains, pluralization

### Modified Capabilities

_No changes to existing specs._

## Impact

- `openspec/specs/i18n/` -- new spec
- `packages/client/src/test/features/i18n/` -- new BDD tests
- No application code changes
