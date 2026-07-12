## MODIFIED Requirements

### Requirement: Locale consistency is enforced automatically

The i18n system SHALL include an automated consistency check that runs as part of the test suite (`pnpm test`) and detects undefined keys, unused keys, parity violations, and override orphans. The check SHALL be available as a standalone command (`pnpm i18n:check`).

#### Scenario: CI catches locale drift
- **WHEN** a developer pushes code that references a key not present in `en.json`
- **THEN** the test suite fails with a descriptive error identifying the missing key

#### Scenario: Standalone check command
- **WHEN** a developer runs `pnpm i18n:check` in the client package
- **THEN** the script validates locale consistency and reports results
