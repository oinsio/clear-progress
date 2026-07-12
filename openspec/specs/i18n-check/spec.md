# Capability: i18n-check

## Purpose

Automated locale consistency checking: flatten locale JSON, scan source files for key usage, detect undefined keys, unused keys, parity violations, override orphans, duplicate values, and whitelist self-validation. Provides CLI interface for standalone and CI usage.

## Requirements

### Requirement: Flatten locale JSON and normalize plural keys

The system SHALL flatten nested locale JSON objects into dot-separated key-value maps. The system SHALL normalize i18next plural suffixes (`_one`, `_two`, `_few`, `_many`, `_other`, `_zero`) and ordinal suffixes (`_ordinal_one`, etc.) to produce base keys for comparison.

#### Scenario: Nested JSON is flattened correctly
- **WHEN** a locale JSON contains `{ "task": { "cancel": "Cancel" } }`
- **THEN** the flat map contains key `"task.cancel"` with value `"Cancel"`

#### Scenario: Plural suffix is stripped to produce base key
- **WHEN** a flat key is `"repeat.everyNDays_few"`
- **THEN** the base key is `"repeat.everyNDays"`

#### Scenario: Ordinal suffix is stripped to produce base key
- **WHEN** a flat key is `"repeat.yearlyDate_ordinal_two"`
- **THEN** the base key is `"repeat.yearlyDate"`

#### Scenario: Underscore in key name is preserved
- **WHEN** a flat key is `"filter.focused_goals"`
- **THEN** the base key is `"filter.focused_goals"` (unchanged, since `_goals` is not a CLDR plural form)

### Requirement: Scan source files for literal keys and dynamic prefixes

The system SHALL scan TypeScript/TSX source files and extract:
1. Literal keys: dot-separated identifiers in quotes/backticks that match a top-level namespace from `en.json`
2. Dynamic prefixes: template literal content before `${...}` that contains at least one dot and matches a top-level namespace

The system SHALL classify keys by file type (production vs test) based on path patterns.

#### Scenario: Literal key in production file is detected
- **WHEN** a production file contains `t("task.cancel")`
- **THEN** `"task.cancel"` appears in `literalKeys` and NOT in `literalKeysTestOnly`

#### Scenario: Literal key only in test file is flagged as test-only
- **WHEN** a test file contains `"task.cancel"` and no production file references it
- **THEN** `"task.cancel"` appears in `literalKeysTestOnly`

#### Scenario: Dynamic prefix is extracted from template literal
- **WHEN** a source file contains `` t(`goal.status.${status}`) ``
- **THEN** `"goal.status."` appears in `dynamicPrefixes`

#### Scenario: Non-i18n dotted string is filtered out by namespace check
- **WHEN** a source file contains `"package.json"` and `"package"` is not a top-level namespace in `en.json`
- **THEN** `"package.json"` is NOT included in scan results

### Requirement: Detect undefined keys (FR1)

The system SHALL report an error of kind `undefined` for every literal key found in production source code that does not exist as a base key in `en.json` and is not covered by a whitelist pattern.

#### Scenario: Key used in code but missing from en.json
- **WHEN** production code references `"sync.alert.repeat_rule_reset"` and this base key is absent from `en.json`
- **THEN** an error `{ kind: "undefined", key: "sync.alert.repeat_rule_reset" }` is reported

#### Scenario: Key only in test file does not trigger undefined error
- **WHEN** `"fake.test.key"` appears only in a test file and is absent from `en.json`
- **THEN** no `undefined` error is reported for this key

### Requirement: Detect unused keys (FR2)

The system SHALL report an error of kind `unused` for every base key in `en.json` that is:
- Not found as a literal key in any source file
- Not matched by any dynamic prefix (with conservative rest-character validation)
- Not matched by any whitelist pattern

#### Scenario: Key in en.json not referenced anywhere
- **WHEN** `en.json` contains key `"nav.oldFeature"` and no source file references it
- **THEN** an error `{ kind: "unused", key: "nav.oldFeature" }` is reported

#### Scenario: Key matched by dynamic prefix is not reported unused
- **WHEN** `en.json` contains `"goal.status.in_progress"` and source has `` `goal.status.${status}` ``
- **THEN** no `unused` error is reported (prefix `"goal.status."` matches, rest `"in_progress"` has no dots)

#### Scenario: Key with shared prefix but non-matching rest is still reported
- **WHEN** `en.json` contains `"repeat.monthAndDay"` and prefix `"repeat.month"` exists from `` `repeat.month${m}` ``
- **THEN** an `unused` error IS reported (rest `"AndDay"` is not digits-only)

#### Scenario: Whitelisted key is not reported unused
- **WHEN** `en.json` contains `"repeat.weekday3"` and whitelist has a pattern matching `repeat.weekday1..7`
- **THEN** no `unused` error is reported

### Requirement: Detect locale parity violations (FR3)

The system SHALL report an error of kind `parity` for every base key that exists in `en.json` but not in `ru.json`, or vice versa.

#### Scenario: Key in en missing from ru
- **WHEN** base key `"feature.new"` exists in `en.json` but not in `ru.json`
- **THEN** an error `{ kind: "parity", key: "feature.new", detail: "present in en, missing in ru" }` is reported

#### Scenario: Key in ru missing from en
- **WHEN** base key `"legacy.removed"` exists in `ru.json` but not in `en.json`
- **THEN** an error `{ kind: "parity", key: "legacy.removed", detail: "present in ru, missing in en" }` is reported

### Requirement: Detect override orphan keys (FR4)

The system SHALL report an error of kind `override-orphans` for every base key in an override locale (where `_meta.baseLanguage` differs from locale code) that does not exist in its base locale, excluding `_meta.*` keys.

#### Scenario: Override key absent from base locale
- **WHEN** `house.json` has `_meta.baseLanguage: "ru"` and contains key `"repeat.day1"` which is absent from `ru.json`
- **THEN** an error `{ kind: "override-orphans", key: "repeat.day1" }` is reported

#### Scenario: _meta keys are excluded from orphan check
- **WHEN** `house.json` contains `"_meta.baseLanguage"` and `"_meta.name"`
- **THEN** no `override-orphans` error is reported for these keys

### Requirement: Report duplicate values (FR5)

The system SHALL always report groups of keys that have identical values in both `en.json` and `ru.json` as candidates for deduplication. This report is printed on every run (informational, does not cause a non-zero exit code).

#### Scenario: Keys with same value in both locales are grouped
- **WHEN** `en.json` has `"task.cancel": "Cancel"` and `"goal.cancel": "Cancel"`, and `ru.json` has both as `"Отмена"`
- **THEN** a duplicate group `["task.cancel", "goal.cancel"]` is reported

#### Scenario: Keys with same en value but different ru values are not grouped
- **WHEN** `en.json` has `"repeat.month4": "April"` and `"repeat.monthGenitive4": "April"`, but `ru.json` has `"апрель"` and `"апреля"`
- **THEN** no duplicate group is reported for these keys

### Requirement: Whitelist self-validation (FR8)

The system SHALL verify that every whitelist pattern matches at least one existing key in `en.json`. A pattern that matches zero keys SHALL be reported as an error.

#### Scenario: Stale whitelist pattern triggers error
- **WHEN** a whitelist pattern `/^legacy\./` matches zero keys in `en.json`
- **THEN** an error is reported indicating the whitelist entry is stale

### Requirement: CLI interface (UX1-UX3)

The system SHALL provide a CLI entrypoint that:
- Exits with code 1 when any check error is found
- Exits with code 0 when no errors are found
- Prints each error as `[kind] key — detail`
- Prints summary count on failure
- Prints `i18n-check: OK` on success
- Always prints the duplicates report (informational section after errors)

#### Scenario: Errors found — exit code 1
- **WHEN** the check finds 3 errors
- **THEN** CLI prints 3 error lines, a summary `i18n-check: 3 errors`, and exits with code 1

#### Scenario: No errors — exit code 0
- **WHEN** the check finds 0 errors
- **THEN** CLI prints `i18n-check: OK` and exits with code 0
