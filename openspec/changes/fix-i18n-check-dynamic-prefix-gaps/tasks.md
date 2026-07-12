## 1. Tighten dynamic prefix matching (FR1, FR2, FR3)

- [x] 1.1 RED: Add tests in `i18n-check.checks.test.ts` — single-segment dotted prefix `repeat.` does NOT protect `repeat.frequency`; two-segment `goal.status.` still protects `goal.status.paused`; non-dotted prefix `repeat.month` + digits still works; whitelist `repeat.daily` is not reported unused
- [x] 1.2 GREEN: Update `matchesDynamicPrefix` in `checks.ts` — reject dotted prefixes where the part before trailing dot has no internal dots
- [x] 1.3 Verify tests pass with `pnpm vitest run` scoped to checks test file

## 2. Fix test-only key detection (FR4, FR5)

- [x] 2.1 RED: Add test — key existing only in test files is reported as `unused` with detail "found ONLY in tests — likely a dead key"
- [x] 2.2 GREEN: Fix condition order in `checkUnused` — `if (scan.literalKeys.has(baseKey) && !scan.literalKeysTestOnly.has(baseKey)) continue;`
- [x] 2.3 Rename fixture keys in `src/test/i18n-check/*.test.ts` from real namespaces (e.g., `repeat.monthAndDay`) to synthetic `fx.` namespace; update corresponding synthetic locale maps
- [x] 2.4 Verify all i18n-check unit tests pass

## 3. Add whitelist entries for single-segment enum namespaces (FR6)

- [x] 3.1 Grep source for dynamic patterns: `` `theme.${` ``, `` `color.${` ``, `` `goalFilter.${` `` — note exact file locations for comments
- [x] 3.2 Add `oneOf` whitelist entries in `whitelist.ts` for `theme.[light,dark,system]`, `color.[blue,coral,green,indigo,orange,purple,yellow]`, `goalFilter.[all,active,paused,finished]` with `biome-ignore` and location comments
- [x] 3.3 Run `pnpm i18n:check` — expect failures only for the 7 dead keys (confirms whitelist + prefix rule work together)

## 4. Remove dead keys from locales (FR7, FR8)

- [x] 4.1 Remove 7 keys from `en.json`: `repeat.frequency`, `repeat.interval`, `repeat.weeklyDays`, `repeat.monthAndDay`, `repeat.invalidRulePullAlertTitle`, `repeat.invalidRulePullAlertMessage`, `repeat.invalidRulePullAlertFix`
- [x] 4.2 Remove same 7 keys from `ru.json`
- [x] 4.3 Run `pnpm i18n:check` — expect `override-orphans` error for `repeat.weeklyDays` in `house.json`
- [x] 4.4 Remove `repeat.weeklyDays` from `house.json`
- [x] 4.5 Run `pnpm i18n:check` — expect 0 errors (UX1)

## 5. Enable integration test (FR9)

- [x] 5.1 Remove `.skip` and TODO comment from `i18n-check.project.test.ts`
- [x] 5.2 Run `pnpm vitest run` scoped to `i18n-check.project.test` — verify it passes (not skipped)

## 6. Verification

- [x] 6.1 Run `pnpm test` — all green
- [x] 6.2 Run `pnpm lint` and `pnpm typecheck` — all green
- [x] 6.3 Run `pnpm build` — successful
- [x] 6.4 Smoke test: add `"repeat.zzzDead": "test"` to `en.json` and `ru.json`, run `pnpm i18n:check` — expect unused error, then revert (UX2)
- [x] 6.5 Grep `src/test/i18n-check/*.test.ts` for fixture keys matching real namespaces — expect none (FR5)
- [x] 6.6 Mutation testing: run Stryker scoped to `scripts/i18n-check/checks.ts` — target >= 95% (M4)
