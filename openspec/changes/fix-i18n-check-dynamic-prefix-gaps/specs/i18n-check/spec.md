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

Fixture strings in the i18n-check tool's own test files SHALL NOT be able to
affect real-project check results. Specifically, no string fixture in
`src/test/i18n-check/*.test.ts` may coincide (after plural/ordinal
normalization via `toBaseKey`) with a key present in `en.json`. Fixture
strings under real namespaces that do NOT correspond to existing keys are
permitted (e.g., negative-test fixtures like `"repeat.frequency"` for a
deleted key), because `checkUnused` treats test-only literals as unused
candidates and `checkUndefined` ignores test-only literals — such fixtures
cannot shield or falsely flag anything.

Exception: fixtures that verify real WHITELIST behavior (e.g., `isWhitelisted("repeat.daily")`)
are permitted to use live keys, documented in an explicit allow-list with justification.

#### Scenario: Fixture coinciding with a live key is forbidden
- **WHEN** `en.json` contains `task.cancel` and a tool test file contains the string `"task.cancel"`
- **THEN** the fixture-isolation test fails, naming the file and the offending string

#### Scenario: Fixture under a real namespace but absent from en.json is allowed
- **WHEN** `en.json` does not contain `repeat.frequency` and a tool test file contains the string `"repeat.frequency"`
- **THEN** the fixture-isolation test passes

#### Scenario: Whitelisted fixture for WHITELIST verification is allowed
- **WHEN** a test verifies `isWhitelisted("repeat.daily")` against the real WHITELIST
- **THEN** `"repeat.daily"` is permitted via the explicit allow-list with a comment justifying its presence
