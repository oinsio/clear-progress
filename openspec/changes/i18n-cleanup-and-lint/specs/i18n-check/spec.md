## MODIFIED Requirements

### Requirement: Detect undefined keys (FR1)

The system SHALL report an error of kind `undefined` for every literal key found in production source code that does not exist as a base key in `en.json` and is not covered by a whitelist pattern.

#### Scenario: Key used in code but missing from en.json
- **WHEN** production code references `"sync.alert.repeat_rule_reset"` and this base key is absent from `en.json`
- **THEN** an error `{ kind: "undefined", key: "sync.alert.repeat_rule_reset" }` is reported

#### Scenario: Key only in test file does not trigger undefined error
- **WHEN** `"fake.test.key"` appears only in a test file and is absent from `en.json`
- **THEN** no `undefined` error is reported for this key

#### Scenario: Key referenced via messageKey variable is covered by whitelist
- **WHEN** `healingRules.ts` assigns `messageKey: "sync.alert.repeat_rule_reset"` and the whitelist contains a pattern matching `sync.alert.*`
- **THEN** no `undefined` error is reported for this key (assuming the key exists in `en.json`)

### Requirement: Whitelist self-validation (FR8)

The system SHALL verify that every whitelist pattern matches at least one existing key in `en.json`. A pattern that matches zero keys SHALL be reported as an error.

#### Scenario: Stale whitelist pattern triggers error
- **WHEN** a whitelist pattern `/^legacy\./` matches zero keys in `en.json`
- **THEN** an error is reported indicating the whitelist entry is stale

#### Scenario: sync.alert whitelist pattern is valid
- **WHEN** the whitelist contains pattern `^sync\.alert\.` and `en.json` contains `sync.alert.repeat_rule_reset`
- **THEN** no stale whitelist error is reported

## ADDED Requirements

### Requirement: CI enforcement of locale consistency

The CI pipeline SHALL run `i18n:check` before building. Any `undefined`, `unused`, `parity`, or `override-orphans` error SHALL cause the CI job to fail, preventing deployment of code with locale drift.

#### Scenario: CI blocks deploy when undefined key exists
- **WHEN** a PR introduces code referencing a key not present in `en.json`
- **AND** CI runs `i18n:check`
- **THEN** the CI job exits with code 1 and the PR cannot be merged

#### Scenario: CI passes when all locale checks are clean
- **WHEN** all locale keys are consistent
- **AND** CI runs `i18n:check`
- **THEN** the CI job exits with code 0
