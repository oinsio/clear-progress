# fix-i18n-check-dynamic-prefix-gaps

## Why

The i18n-check tool has three gaps discovered during code review of the `i18n-cleanup` branch: (1) single-segment dynamic prefixes like `repeat.` act as umbrellas that hide dead keys, (2) the `isTestOnly` branch in `checkUnused` is unreachable dead code allowing test fixtures to mask dead keys, and (3) the integration test is disabled despite the cleanup being complete. These gaps mean 7 dead locale keys remain undetected.

## What Changes

- **MODIFIED**: Dynamic prefix matching rule — dotted prefixes with only one named segment (e.g., `repeat.`) no longer protect keys from being reported as unused. Only prefixes with >= 2 named segments (e.g., `goal.status.`) participate in auto-matching. Single-segment namespaces must use explicit whitelist entries.
- **MODIFIED**: `checkUnused` logic — keys found ONLY in test files are now correctly reported as unused (with appropriate detail message), fixing unreachable `isTestOnly` branch.
- **ADDED**: Whitelist entries for `theme.*`, `color.*`, `goalFilter.*` enum values that were previously hidden by umbrella prefixes.
- **REMOVED**: 7 dead keys from `en.json`/`ru.json` (`repeat.frequency`, `repeat.interval`, `repeat.weeklyDays`, `repeat.monthAndDay`, `repeat.invalidRulePullAlertTitle`, `repeat.invalidRulePullAlertMessage`, `repeat.invalidRulePullAlertFix`) and 1 override from `house.json` (`repeat.weeklyDays`).
- **MODIFIED**: Test fixtures in `src/test/i18n-check/` — rename fixture keys that collide with real namespaces to use a synthetic `fx.` prefix.
- **ENABLED**: Integration test `i18n-check.project.test.ts` (remove `.skip`).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `i18n-check`: Dynamic prefix matching now requires >= 2 named segments for dotted prefixes; test-only key detection is functional; whitelist covers single-segment enum namespaces.

## Goals

- G1: Eliminate false negatives in unused key detection caused by umbrella dynamic prefixes
- G2: Make test-only key detection functional so test fixtures cannot mask dead keys
- G3: Enable the integration test as a Vitest gate

## Non-Goals

- NG1: Redesigning the whitelist format or dynamic prefix discovery mechanism
- NG2: Adding new check types to i18n-check
- NG3: Changing the CLI output format

## Requirements

### Functional

- FR1: `matchesDynamicPrefix` SHALL reject dotted prefixes with only one named segment (no dot before trailing dot). Example: `repeat.` does NOT protect `repeat.frequency`.
- FR2: `matchesDynamicPrefix` SHALL accept dotted prefixes with >= 2 named segments. Example: `goal.status.` protects `goal.status.paused`.
- FR3: `matchesDynamicPrefix` SHALL continue to accept non-dotted prefixes with digit-only rest. Example: `repeat.month` protects `repeat.month7`.
- FR4: `checkUnused` SHALL report keys found ONLY in test files as `unused` with detail "found ONLY in tests — likely a dead key".
- FR5: Test fixture keys in `src/test/i18n-check/` SHALL NOT collide with real top-level namespaces from `en.json`.
- FR6: Whitelist SHALL contain explicit `oneOf` entries for `theme.`, `color.`, and `goalFilter.` enum values.
- FR7: Dead keys (`repeat.frequency`, `repeat.interval`, `repeat.weeklyDays`, `repeat.monthAndDay`, `repeat.invalidRulePullAlertTitle`, `repeat.invalidRulePullAlertMessage`, `repeat.invalidRulePullAlertFix`) SHALL be removed from `en.json` and `ru.json`.
- FR8: Override orphan `repeat.weeklyDays` SHALL be removed from `house.json`.
- FR9: Integration test `i18n-check.project.test.ts` SHALL run without `.skip`.

### Non-Functional

#### Performance

- NFR-P1: No measurable performance regression in `pnpm i18n:check` execution time.

## UX Acceptance Criteria

- UX1: `pnpm i18n:check` exits with code 0 after all fixes are applied.
- UX2: Adding a synthetic dead key (e.g., `repeat.zzzDead`) to `en.json` causes `pnpm i18n:check` to report it as unused.

## Success Metrics

- M1: 0 errors from `pnpm i18n:check` on clean codebase
- M2: 7 dead keys removed from locale files
- M3: Integration test passes without `.skip`
- M4: Mutation score >= 95% on `checks.ts` changes (minimum >= 90%)

## Impact

- `packages/client/scripts/i18n-check/checks.ts` — core logic changes
- `packages/client/scripts/i18n-check/whitelist.ts` — new entries
- `packages/client/src/test/i18n-check/*.test.ts` — fixture renames
- `packages/client/src/test/i18n-check/i18n-check.project.test.ts` — enable test
- `packages/client/public/locales/en.json` — remove 7 keys
- `packages/client/public/locales/ru.json` — remove 7 keys
- `packages/client/public/locales/house.json` — remove 1 key
- `openspec/specs/i18n-check/spec.md` — delta spec updates
