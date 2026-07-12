# add-i18n-check-script

## Why

Locale files (`src/locales/*.json`) and source code (`src/**/*.{ts,tsx}`) drift apart silently: keys get added to code but not to locale files (runtime crashes), keys accumulate in locale files after code removal (~90 unused keys today), and override locales (`house.json`) retain orphan keys for deleted base keys. There is no automated check — issues are discovered manually or by users. A static analysis script will catch all classes of i18n inconsistency on CI before merge.

## What Changes

- **ADDED**: Static i18n consistency check script (`packages/client/scripts/i18n-check/`) that validates locale files against source code usage
- **ADDED**: `pnpm i18n:check` command in `packages/client/package.json`
- **ADDED**: Vitest integration test that runs the check as part of the test suite

## Capabilities

### New Capabilities

- `i18n-check`: Static analysis script that detects undefined keys, unused keys, locale parity violations, override orphans, and duplicate values across locale files

### Modified Capabilities

- `i18n`: Adds automated consistency enforcement to the existing i18n infrastructure

## Goals

- G1: Zero undefined/unused/parity/orphan errors pass CI undetected
- G2: Script runs in < 2s on the current codebase
- G3: False positive rate is zero for the current codebase (no suppressions needed for legitimate patterns)

## Non-Goals

- NG1: Type-safe `t()` calls via generated TypeScript declarations (future change)
- NG2: Auto-fixing detected issues (separate `i18n-cleanup` change)
- NG3: Runtime i18n validation or browser-side checks
- NG4: Checking interpolation parameter consistency between locales

## Users & Scenarios

- U1: Developer adds a new UI string — script catches missing locale key before merge
- U2: Developer removes a feature — script reports unused keys for cleanup
- U3: Developer adds keys to `en.json` but forgets `ru.json` — parity check fails
- U4: Developer edits `house.json` override with a key that no longer exists in `ru.json` — orphan check fails

## Requirements

### Functional

- FR1: Detect keys used in production code (`src/**/*.{ts,tsx}`) that are absent from `en.json` (undefined check)
- FR2: Detect keys present in `en.json` that are not referenced by any source file, dynamic prefix, or whitelist pattern (unused check)
- FR3: Detect base-key set differences between `en.json` and `ru.json` after normalizing plural/ordinal suffixes (parity check)
- FR4: Detect keys in override locales (identified by `_meta.baseLanguage`) that do not exist in their base locale (override-orphans check)
- FR5: Report groups of keys with identical values in both `en` and `ru` as candidates for deduplication (always printed, non-blocking)
- FR6: Recognize i18next plural suffixes (`_one|_two|_few|_many|_other|_zero`) and ordinal suffixes (`_ordinal_*`) — compare base keys only, since en/ru have different plural forms
- FR7: Recognize dynamic key patterns from template literals (`` `prefix.${var}` ``) and exclude matched keys from unused report
- FR8: Support an explicit whitelist for keys that cannot be detected statically (numeric suffixes, `messageKey` indirection) — each whitelist entry must match at least one existing key (stale entries are errors)
- FR9: Exclude `_meta.*` keys from all checks (service metadata read by `localeRegistry.ts`)
- FR10: Keys found only in test files do not trigger `undefined` errors but are flagged in `unused` report

### Non-Functional

#### Performance

- NFR-P1: Full check completes in under 2 seconds on the current codebase (~150 source files, 4 locale files)

#### Maintainability

- NFR-M1: Each script module file stays under 200 lines
- NFR-M2: Script is importable by Vitest without `process.exit` side effects (separation of logic and CLI)

## UX Acceptance Criteria

- UX1: On failure, output lists each error as `[kind] key — detail` with a summary count
- UX2: On success, output is a single line: `i18n-check: OK`
- UX3: Exit code is 1 on errors, 0 on success

## Success Metrics

- M1: Script detects all currently known issues (≥90 unused keys, ≥16 override orphans) when run against the unmodified codebase
- M2: After `i18n-cleanup` change removes dead keys, script reports 0 errors on CI
- M3: Mutation testing score ≥ 95% on flatten/scan/checks modules

## Open Questions

None — all resolved.
