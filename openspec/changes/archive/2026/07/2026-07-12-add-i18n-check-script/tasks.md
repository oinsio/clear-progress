## 1. Module scaffold and types

- [x] 1.1 Create directory `packages/client/scripts/i18n-check/` with `index.ts` and `types.ts` (FR1–FR10)
- [x] 1.2 Define types: `FlatMap`, `LocaleData`, `ScanResult`, `CheckKind`, `CheckError` (FR1–FR10)

## 2. Flatten module (TDD)

- [x] 2.1 Write failing unit tests for `flatten()`: nested objects, empty values, single-level (FR6)
- [x] 2.2 Write failing unit tests for `toBaseKey()`: plural suffixes, ordinal suffixes, underscore preservation (FR6)
- [x] 2.3 Implement `flatten.ts` — make all tests pass (FR6)

## 3. Scan module (TDD)

- [x] 3.1 Write failing unit tests for `scanSources()`: literal key detection, namespace filtering, dynamic prefix extraction, test-file classification (FR1, FR2, FR7, FR10)
- [x] 3.2 Implement `scan.ts` — make all tests pass (FR1, FR2, FR7, FR10)

## 4. Whitelist module

- [x] 4.1 Implement `whitelist.ts` with patterns for: `repeat.{daily,weekly,monthly,yearly}`, `repeat.weekday1..7`, `repeat.month1..12`, `repeat.monthGenitive1..12` (FR8, FR9)
- [x] 4.2 Write unit test: `isWhitelisted()` matches expected keys and rejects non-matching keys (FR8)

## 5. Checks module (TDD)

- [x] 5.1 Write failing unit tests for `checkUndefined()`: missing key triggers error, whitelisted key passes, test-only key passes (FR1, FR10)
- [x] 5.2 Write failing unit tests for `checkUnused()`: unreferenced key errors, dynamic-prefix match passes, whitelist match passes, `repeat.monthAndDay` NOT covered by `repeat.month` prefix (FR2, FR7, FR8)
- [x] 5.3 Write failing unit tests for `checkParity()`: missing in ru, missing in en (FR3)
- [x] 5.4 Write failing unit tests for `checkOverrideOrphans()`: orphan key errors, `_meta` excluded (FR4, FR9)
- [x] 5.5 Implement `checks.ts` — make all tests pass (FR1–FR4, FR7–FR10)

## 6. Duplicates module (TDD)

- [x] 6.1 Write failing unit tests for `findDuplicateGroups()`: same-value grouping, month/monthGenitive not grouped (FR5)
- [x] 6.2 Implement `duplicates.ts` — make all tests pass (FR5)

## 7. Orchestrator and CLI

- [x] 7.1 Implement `run.ts`: `loadLocale()`, `collectSourceFiles()`, `runAllChecks()` with whitelist self-validation (FR8, NFR-M2)
- [x] 7.2 Implement `cli.ts`: error formatting, exit codes, always print duplicates report (UX1–UX3, FR5)
- [x] 7.3 Add `"i18n:check": "npx tsx scripts/i18n-check/cli.ts"` to `packages/client/package.json`

## 8. Integration test

- [x] 8.1 Write Vitest integration test `src/test/i18n-check/i18n-check.project.test.ts` that runs `runAllChecks()` against real project files (FR1–FR4)
- [x] 8.2 Test skipped with TODO referencing `i18n-cleanup` change — codebase has 122 known issues (pre-cleanup)

## 9. Verification

- [x] 9.1 Run `pnpm run build` to verify no type/build errors (NFR-M2)
- [x] 9.2 Run scoped mutation testing on `flatten.ts`, `scan.ts`, `checks.ts` — target ≥95% score (M3)
- [x] 9.3 Run `pnpm i18n:check` standalone and verify output format matches UX1–UX3
