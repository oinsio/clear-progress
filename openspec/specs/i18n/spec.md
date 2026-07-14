# Capability: i18n

## Purpose

Internationalization support: language detection, switching, persistence, locale auto-discovery with validation, fallback chains, pluralization, and ordinals. Currently, supports Russian (default) and English, with ability to add dialect locales (e.g., "Dr. House" based on "ru").

## Requirements

### Requirement: System detects browser language on first visit

System SHALL detect the user's browser language (`navigator.languages`) and select the first matching supported base language code. If no match is found, system MUST fall back to DEFAULT_LANGUAGE. Detection runs only when no language is stored in localStorage.

#### Scenario: Browser language matches supported locale
- **GIVEN** no language is stored in localStorage
- **AND** browser language is "en"
- **WHEN** system initializes
- **THEN** selected language is "en"

#### Scenario: Browser language not supported
- **GIVEN** no language is stored in localStorage
- **AND** browser language is "fr"
- **WHEN** system initializes
- **THEN** selected language is DEFAULT_LANGUAGE

#### Scenario: Browser sends multiple languages with first unsupported
- **GIVEN** no language is stored in localStorage
- **AND** browser languages are ["fr", "en", "de"]
- **WHEN** system initializes
- **THEN** selected language is "en" (first supported match)

#### Scenario: Browser language with region code
- **GIVEN** no language is stored in localStorage
- **AND** browser language is "en-US"
- **WHEN** system initializes
- **THEN** selected language is "en" (base code extracted)

### Requirement: User can switch language

User SHALL be able to switch language via `setLanguage()`. System MUST update React state, call `i18n.changeLanguage()`, and persist the choice to localStorage.

#### Scenario: Switch language updates i18next
- **GIVEN** current language is "ru"
- **WHEN** user switches to "en"
- **THEN** `i18n.changeLanguage("en")` is called

#### Scenario: Switch language persists to localStorage
- **GIVEN** current language is "ru"
- **WHEN** user switches to "en"
- **THEN** localStorage contains "en" under STORAGE_KEYS.LANGUAGE

### Requirement: Language persists across sessions

On app load, system SHALL read language from localStorage. If the stored value is a valid locale code, it is used. If invalid or missing, system falls back to browser detection, then DEFAULT_LANGUAGE.

#### Scenario: Valid language restored from localStorage
- **GIVEN** localStorage contains "en" under STORAGE_KEYS.LANGUAGE
- **WHEN** system initializes
- **THEN** selected language is "en"

#### Scenario: Invalid language in localStorage triggers fallback
- **GIVEN** localStorage contains "xx-invalid" under STORAGE_KEYS.LANGUAGE
- **AND** browser language is "en"
- **WHEN** system initializes
- **THEN** selected language is "en" (browser detection)

#### Scenario: localStorage unavailable
- **GIVEN** localStorage throws on access
- **AND** browser language is "en"
- **WHEN** system initializes
- **THEN** selected language is "en" (browser detection fallback)

### Requirement: Locale registry auto-discovers locale files

System SHALL auto-discover all JSON files in `src/locales/` via `import.meta.glob`. Each file MUST contain a `_meta` object with fields: `code`, `name`, `nativeName`, `baseLanguage`, `emoji`. The `_meta.code` MUST match the filename (without extension).

#### Scenario: Valid locale file is registered
- **GIVEN** file `en.json` exists with valid `_meta` (code: "en")
- **WHEN** locale registry initializes
- **THEN** "en" appears in locales list with correct metadata

#### Scenario: Locale file missing _meta is rejected
- **GIVEN** a locale file exists without `_meta` field
- **WHEN** locale registry initializes
- **THEN** file is skipped and console error is logged

#### Scenario: Locale file with incomplete _meta is rejected
- **GIVEN** a locale file has `_meta` missing `emoji` field
- **WHEN** locale registry initializes
- **THEN** file is skipped and console error is logged

#### Scenario: Code-filename mismatch is rejected
- **GIVEN** file `en.json` has `_meta.code: "ru"`
- **WHEN** locale registry initializes
- **THEN** file is skipped and console error is logged

#### Scenario: Locales sorted by English name
- **GIVEN** locales "Russian", "English", "Dr. House" exist
- **WHEN** locale registry initializes
- **THEN** locales are sorted as: Dr. House, English, Russian

### Requirement: Fallback chain resolves dialect to base language

When a locale has `baseLanguage` different from its `code`, i18next fallback SHALL resolve to `[baseLanguage, DEFAULT_LANGUAGE]`. When locale has no base language override, fallback SHALL resolve to `[DEFAULT_LANGUAGE]`.

#### Scenario: Dialect falls back to base language
- **GIVEN** locale "house" has baseLanguage "ru"
- **WHEN** translation key is missing in "house"
- **THEN** system looks up key in "ru", then DEFAULT_LANGUAGE

#### Scenario: Base language falls back to default
- **GIVEN** locale "en" has baseLanguage "en" (same as code)
- **WHEN** translation key is missing in "en"
- **THEN** system looks up key in DEFAULT_LANGUAGE only

### Requirement: Translation files are complete

Every translation key present in any locale file MUST exist in all other locale files (excluding `_meta`). Nested keys are compared structurally. Additionally, every key referenced by production code via `t()` or `messageKey` MUST exist in all locale files.

#### Scenario: All keys present in both locales
- **GIVEN** ru.json has keys "nav.inbox", "nav.goals"
- **AND** en.json has keys "nav.inbox", "nav.goals"
- **THEN** translation completeness check passes

#### Scenario: Key missing in one locale
- **GIVEN** ru.json has key "nav.inbox"
- **AND** en.json does not have key "nav.inbox"
- **THEN** translation completeness check fails listing "nav.inbox" as missing in en

#### Scenario: Self-healing alert keys exist in all locales
- **WHEN** `healingRules.ts` references `sync.alert.repeat_rule_reset`, `sync.alert.name_set_untitled`, `sync.alert.checklist_item_deleted`
- **THEN** all three keys SHALL exist in `en.json` and `ru.json`
- **AND** each key SHALL contain a human-readable message describing what the self-healing action did

#### Scenario: No unused keys remain in locale files
- **WHEN** running `i18n:check`
- **THEN** zero `unused` errors SHALL be reported
- **AND** zero `override-orphans` errors SHALL be reported for `house.json`

### Requirement: Common namespace for shared UI labels

Locale files SHALL contain a `common` top-level namespace with shared UI labels that are used identically across multiple domain namespaces. Components SHALL reference `common.*` keys instead of duplicating the same label under each domain namespace.

The `common` namespace SHALL include at minimum: `cancel`, `back`, `delete`, `close`, `next`, `save`, `loading`, `name`, `taskCount`, `details`, `attachments`.

#### Scenario: Component uses common.cancel instead of domain-specific key
- **WHEN** a component needs a "Cancel" button label
- **THEN** it SHALL use `t("common.cancel")` instead of a domain-specific key like `t("goal.cancel")`

#### Scenario: Common keys exist in all locale files
- **WHEN** `en.json` contains `common.cancel`
- **THEN** `ru.json` SHALL also contain `common.cancel` with the corresponding translation

#### Scenario: Domain-specific keys replaced by common keys are removed
- **WHEN** `common.cancel` is defined
- **THEN** keys `task.cancel`, `goal.cancel`, `focusGoalReplacementDialog.cancel`, `idea.deleteConfirmCancel`, `settings.fullSyncCancel`, `settings.disconnectCancel`, `settings.server.cancel`, `taskEdit.deleteConfirmCancel`, `deleted.purgeCancel`, `confirmDialog.cancel` SHALL NOT exist in locale files

#### Scenario: saveName keys replaced by common.saveName
- **WHEN** `common.saveName` is defined
- **THEN** keys `context.saveName` and `category.saveName` SHALL NOT exist in locale files
- **AND** `EntityDetailLayout` consumers (`ContextDetailPage`, `CategoryDetailPage`) SHALL pass `"common.saveName"` via `i18nKeys.saveName`

### Requirement: Dialect locales inherit base language plural rules

Dialect locales (where `_meta.baseLanguage` differs from the locale code) SHALL select CLDR plural forms using the plural rules of their base language. Dialect codes are not valid BCP 47 languages, so `Intl.PluralRules` would otherwise degrade them to root rules where every count maps to `other`, making plural overrides in dialect files unreachable. The rule applies both to keys overridden in the dialect file and to keys resolved via fallback. # implements FR10 of rework-house-locale

#### Scenario: Dialect plural override uses base language forms
- **WHEN** translating a key overridden in "house" (baseLanguage "ru") with count 21
- **THEN** the `_one` form of the house override is used (e.g. «21 пациент»)

#### Scenario: Dialect fallback keys keep base language plural forms
- **WHEN** translating a key absent from "house" (e.g. `repeat.intervalDays`) with count 3 in locale "house"
- **THEN** the Russian `_few` form is used («Интервал: 3 дня»)

#### Scenario: Base locales are unaffected
- **WHEN** translating a plural key in locale "ru" or "en"
- **THEN** plural forms are selected by that locale's own rules

### Requirement: Pluralization follows CLDR rules

System SHALL support pluralization via `count` parameter. Russian uses `_one`, `_few`, `_many` suffixes. English uses `_one`, `_other` suffixes. i18next selects the correct suffix based on CLDR plural rules.

#### Scenario: Russian pluralization one/few/many
- **GIVEN** locale is "ru"
- **WHEN** translating key with count 1
- **THEN** `_one` suffix is used
- **WHEN** translating key with count 3
- **THEN** `_few` suffix is used
- **WHEN** translating key with count 5
- **THEN** `_many` suffix is used

#### Scenario: English pluralization one/other
- **GIVEN** locale is "en"
- **WHEN** translating key with count 1
- **THEN** `_one` suffix is used
- **WHEN** translating key with count 5
- **THEN** `_other` suffix is used

### Requirement: Utility functions provide locale lookups

System SHALL provide utility functions: `getLocaleByCode(code)` returns locale metadata or undefined, `isValidLocaleCode(code)` returns boolean, `getBaseLanguageCodes()` returns unique base language codes.

#### Scenario: getLocaleByCode with valid code
- **WHEN** calling getLocaleByCode("en")
- **THEN** returns locale with name "English"

#### Scenario: getLocaleByCode with invalid code
- **WHEN** calling getLocaleByCode("xx")
- **THEN** returns undefined

#### Scenario: isValidLocaleCode
- **THEN** isValidLocaleCode("en") is true
- **AND** isValidLocaleCode("xx") is false

#### Scenario: getBaseLanguageCodes returns unique codes
- **GIVEN** locales with baseLanguage "en", "ru", "ru"
- **WHEN** calling getBaseLanguageCodes
- **THEN** returns ["en", "ru"] (deduplicated)

### Requirement: Locale consistency is enforced automatically

The i18n system SHALL include an automated consistency check that runs as part of the test suite (`pnpm test`) and detects undefined keys, unused keys, parity violations, and override orphans. The check SHALL be available as a standalone command (`pnpm i18n:check`).

#### Scenario: CI catches locale drift
- **WHEN** a developer pushes code that references a key not present in `en.json`
- **THEN** the test suite fails with a descriptive error identifying the missing key

#### Scenario: Standalone check command
- **WHEN** a developer runs `pnpm i18n:check` in the client package
- **THEN** the script validates locale consistency and reports results
