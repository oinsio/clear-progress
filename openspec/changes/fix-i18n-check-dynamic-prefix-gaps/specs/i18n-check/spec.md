## MODIFIED Requirements

### Requirement: Scan source files for literal keys and dynamic prefixes

The system SHALL scan TypeScript/TSX source files and extract:
1. Literal keys: dot-separated identifiers in quotes/backticks that match a top-level namespace from `en.json`
2. Dynamic prefixes: template literal content before `${...}` that contains at least one dot and matches a top-level namespace

The system SHALL classify keys by file type (production vs test) based on path patterns.

The system SHALL NOT include keys from the i18n-check tool's own test fixtures in production scan results. Test fixtures SHALL use synthetic namespaces (e.g., `fx.`) that do not exist in `en.json`.

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

#### Scenario: Test fixture with synthetic namespace is excluded
- **WHEN** a test file contains `"fx.monthAndDay"` and `"fx"` is not a top-level namespace in `en.json`
- **THEN** `"fx.monthAndDay"` is NOT included in scan results

### Requirement: Detect unused keys (FR2)

The system SHALL report an error of kind `unused` for every base key in `en.json` that is:
- Not found as a literal key in any production source file (keys found ONLY in test files do not count as "found")
- Not matched by any dynamic prefix (with conservative rest-character validation)
- Not matched by any whitelist pattern

Dynamic prefix matching for dotted prefixes (ending with `.`) SHALL require the prefix to contain >= 2 named segments (i.e., at least one dot before the trailing dot). Single-segment dotted prefixes (e.g., `repeat.`) SHALL NOT protect keys from being reported as unused — their enum values must be covered by explicit whitelist entries instead.

Non-dotted prefixes SHALL continue to match when the rest is digits-only (e.g., `repeat.month` protects `repeat.month7`).

Keys found ONLY in test files SHALL be reported as unused with detail "found ONLY in tests — likely a dead key".

#### Scenario: Key in en.json not referenced anywhere
- **WHEN** `en.json` contains key `"nav.oldFeature"` and no source file references it
- **THEN** an error `{ kind: "unused", key: "nav.oldFeature" }` is reported

#### Scenario: Key matched by multi-segment dynamic prefix is not reported unused
- **WHEN** `en.json` contains `"goal.status.in_progress"` and source has `` `goal.status.${status}` ``
- **THEN** no `unused` error is reported (prefix `"goal.status."` has 2 segments, rest `"in_progress"` has no dots)

#### Scenario: Single-segment dotted prefix does NOT protect keys
- **WHEN** `en.json` contains `"repeat.frequency"` and source has `` `repeat.${freq}` `` producing prefix `"repeat."`
- **THEN** an `unused` error IS reported for `"repeat.frequency"` (prefix has only 1 named segment)

#### Scenario: Key with shared non-dotted prefix but non-digit rest is still reported
- **WHEN** `en.json` contains `"repeat.monthAndDay"` and prefix `"repeat.month"` exists from `` `repeat.month${m}` ``
- **THEN** an `unused` error IS reported (rest `"AndDay"` is not digits-only)

#### Scenario: Whitelisted key is not reported unused regardless of prefix rules
- **WHEN** `en.json` contains `"repeat.daily"` and whitelist has a `oneOf("repeat.", ["daily", ...])` pattern
- **THEN** no `unused` error is reported

#### Scenario: Key found only in test files is reported as unused
- **WHEN** `en.json` contains `"repeat.monthAndDay"` and it appears only in test files (not in production code)
- **THEN** an error `{ kind: "unused", key: "repeat.monthAndDay", detail: "found ONLY in tests — likely a dead key" }` is reported

## ADDED Requirements

### Requirement: Test fixture isolation from production scan

Test fixtures within `src/test/i18n-check/` SHALL use a synthetic namespace prefix (e.g., `fx.`) for all string keys that would otherwise collide with real top-level namespaces in `en.json`. This prevents test code from accidentally masking dead production keys during the unused key check.

#### Scenario: No fixture key collides with real namespace
- **WHEN** scanning `src/test/i18n-check/*.test.ts` for string literals matching `en.json` top-level namespaces
- **THEN** no fixture key has a first segment matching any real namespace (e.g., no `repeat.*`, `task.*`, `goal.*` fixture strings)

#### Scenario: Fixture uses synthetic namespace
- **WHEN** a test needs a fixture key resembling `repeat.monthAndDay`
- **THEN** it uses `fx.monthAndDay` instead, with a corresponding synthetic locale map
