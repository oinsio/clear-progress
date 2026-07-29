## 1. Constants & keys (no TDD — pure config)

- [x] 1.1 Add `STORAGE_KEYS.SYNC_INTERVAL = "sync_interval"` and `STORAGE_KEYS.AUTO_SYNC_DELAY = "auto_sync_delay"` in `src/constants/index.ts` (FR1, FR2)
- [x] 1.2 Add default/bounds constants: `DEFAULT_SYNC_INTERVAL_MIN = 5`, `MIN_SYNC_INTERVAL_MIN = 1`, `MAX_SYNC_INTERVAL_MIN = 1440`, `DEFAULT_AUTO_SYNC_DELAY_SEC = 15`, `MIN_AUTO_SYNC_DELAY_SEC = 0`, `MAX_AUTO_SYNC_DELAY_SEC = 900`; redefine `SYNC_INTERVAL_MS = DEFAULT_SYNC_INTERVAL_MIN * 60_000` and `SYNC_DEBOUNCE_MS = DEFAULT_AUTO_SYNC_DELAY_SEC * 1000` as derived values to avoid drift (FR1, FR2, D5)
- [x] 1.3 Add both keys to `SYNCED_SETTING_KEYS` (FR5)
- [x] 1.4 Add `SYNC_TIMING_CHANGED_EVENT` constant (D7)
- [x] 1.5 Add i18n keys to `src/locales/ru.json` and `src/locales/en.json` (labels, units, help text, disabled/immediate hints, write-error message) (UX2, UX3, UX5)

## 2. SettingsService getters (TDD)

- [x] 2.1 RED: tests for `getSyncIntervalMinutes` — default 5 when absent, parse valid, empty → disabled sentinel, out-of-range/non-numeric → default (no clamping) + invalid localStorage cache entry removed + stored IndexedDB value NOT rewritten and no `needsSync` side effect (FR1, FR6, FR7)
- [x] 2.2 GREEN: implement `getSyncIntervalMinutes` in `src/services/SettingsService.ts` (FR1, FR7)
- [x] 2.3 RED: tests for `getAutoSyncDelaySeconds` — default 15 when absent, parse valid, 0/empty → immediate (0), out-of-range/non-numeric → default (no clamping) + invalid cache entry removed + stored value NOT rewritten (FR2, FR6, FR7)
- [x] 2.4 GREEN: implement `getAutoSyncDelaySeconds` (FR2, FR7)
- [x] 2.5 REFACTOR: extract shared parse/validate helper for integer settings (invalid → default, no clamping); keep tests green
- [x] 2.6 MUTATE: `pnpm run test:mutation` scoped to `src/services/SettingsService.ts` — ≥95% (min 90%), add tests to kill survivors

## 3. useSettings read/write + localStorage cache (TDD)

- [x] 3.1 RED: tests for `syncInterval`/`autoSyncDelay` state, `setSyncInterval`/`setAutoSyncDelay` writing via `settingsService.set`, localStorage `syncCache`, `schedulePush()` called after write with exactly ONE sync cycle scheduled per write, and `SYNC_TIMING_CHANGED_EVENT` dispatched after write (FR5, FR6, NFR-P1, D7)
- [x] 3.2 GREEN: extend `src/hooks/useSettings.ts` mirroring the `dayBoundary` pattern (read cache on init, write-through, dispatch event) (FR6, D7)
- [x] 3.3 MUTATE: mutation run scoped to `useSettings.ts` — ≥95% (min 90%)

## 4. SyncProvider — configurable debounce (T3) (TDD)

- [x] 4.1 RED: tests that `schedulePush` schedules using current `auto_sync_delay` (via `delayMsRef`), 0/empty → immediate (0 ms), latest value wins at schedule time, default preserved when absent (FR4, D3, NFR-P1)
- [x] 4.2 GREEN: replace `SYNC_DEBOUNCE_MS` literal in `schedulePush` with `delayMsRef.current`; wire ref updates from the setting (FR4)
- [x] 4.3 Verify default behavior unchanged (15000 ms) when no value stored (M1)

## 5. SyncProvider — configurable periodic interval (T2) (TDD)

- [x] 5.1 RED: tests that periodic interval uses configured value, is recreated (clear + recreate) when value changes without an app reload, is NOT created when disabled/empty, and uses `SYNC_INTERVAL_MS` default when absent (FR3, D4, NFR-P1)
- [x] 5.2 GREEN: move periodic sync into a `useEffect` keyed on effective interval value; cleanup clears old interval; disabled → no interval (FR3)
- [x] 5.3 Verify unmount cleanup still clears interval, ping, and debounce timers (regression)

## 6. SyncProvider — reacting to changed values, incl. pull (D7) (TDD)

- [x] 6.1 RED: tests that after `sync_complete` following a pull that changed `sync_interval`, SyncProvider re-reads the setting and recreates the periodic interval with the pulled value (FR3, G2, U4, D7)
- [x] 6.2 RED: tests that after `sync_complete` or `SYNC_TIMING_CHANGED_EVENT`, `delayMsRef` reflects the new `auto_sync_delay` at the next `schedulePush` (FR4, D7)
- [x] 6.3 GREEN: subscribe SyncProvider to `sync_complete` and `SYNC_TIMING_CHANGED_EVENT`, re-read both settings via `SettingsService` (localStorage cache at start-up); remove listeners on unmount (D7)
- [x] 6.3a Extract the sync-timing logic (`reloadSyncTimingSettings`, `delayMsRef`, `syncIntervalMinutes` state, periodic-interval effect, event-listener effect) out of `SyncProvider.tsx` into a dedicated hook to bring the file back under the 200-300 line limit (process-invariants.md file-size rule); keep all existing tests green
- [x] 6.4 MUTATE: mutation run scoped to `SyncProvider.tsx` (and the new extracted hook file) — ≥95% (min 90%)

## 7. Sync round-trip & orchestration (BDD)

- [x] 7.1 Add scenarios to `src/test/features/settings/*.feature` (or new `sync_timing_settings.feature`) covering both keys in `getNeedingSync`, push clears flag, `bulkUpsert` LWW/local-dirty-wins; tag scenarios `@configurable-sync-timing` + `@FR5` (FR5)
- [x] 7.2 Implement step definitions; run the settings BDD suite green (FR5)
- [x] 7.3 BDD unit: `sync_orchestration.feature` scenarios for configurable T2/T3 timing including pull-driven updates, tagged `@configurable-sync-timing` + `@FR3`/`@FR4`, with step defs (FR3, FR4)

## 8. UI — SyncTimingSection (TDD + BDD)

- [x] 8.1 RED: component tests for `src/components/settings/SyncTimingSection.tsx` — two integer inputs with unit suffixes, `SyncIndicator` per key, commit on blur/Enter, revert-on-invalid, empty preserved where allowed, help text for disabled/immediate, write-failure revert with visible error feedback (FR8, UX1, UX2, UX3, UX4, UX5)
- [x] 8.2 GREEN: implement `SyncTimingSection` reusing the `DayBoundarySection` input pattern; wire to `useSettings` (FR8, D6)
- [x] 8.3 Place `SyncTimingSection` in `AccountSyncSection.tsx` above `ServerSection`, interval before delay (FR8)
- [x] 8.4 BDD unit: `sync_timing_settings.feature` scenarios tagged `@configurable-sync-timing` + per-requirement `@FR-X`/`@UX-X` tags, with step defs (UX1–UX5)
- [x] 8.5 MUTATE: mutation run scoped to `SyncTimingSection.tsx` — ≥95% (min 90%)

## 9. Accessibility, responsive & UI states (automated)

- [x] 9.1 axe-core assertions for the two controls (labels, `aria-describedby`) in the settings E2E/component tests (NFR-A1)
- [x] 9.2 BDD E2E: keyboard operability — focus, type, Enter/blur commit (NFR-A1)
- [x] 9.3 BDD E2E: responsive scenarios (@NFR-R1) at 320px/768px/1440px/2560px viewports (NFR-R1) — DONE.

## 10. Verification & wrap-up

- [x] 10.1 `get_file_problems` (JetBrains MCP) on all changed files — fix errors — JetBrains MCP unavailable in this session (a different project, `gnomish-factory`, is open in the IDE, confirmed via direct tool call). Substituted `tsc -b` (part of `pnpm run build`, task 10.2) as the diagnostic across all changed files — clean, no errors.
- [x] 10.2 `pnpm run build` passes
- [x] 10.3 Run affected unit + BDD suites one at a time; all green (M1, M2, M3)
- [x] 10.4 Confirm i18n keys present in both `ru.json` and `en.json` — also fixed a real bug found here: `SyncTimingSection.tsx` was calling `t()` with bare keys (`"syncInterval"`) instead of the namespaced `"settings.syncInterval"`, so all labels/units/hints/error text would have rendered as raw i18next fallback in production (masked in unit tests by a mock that auto-prepended the namespace). Fixed the component and the two test files' i18n mocks; `pnpm run i18n:check` now passes clean, all affected suites re-verified green.
- [x] 10.5 Traceability check: every FR/NFR/UX from proposal has an implementing test/artifact (grep) — verified via grep across `packages/client/src`: every FR1-FR8, NFR-P1, NFR-A1, NFR-R1, UX1-UX5, and design decision D2-D7 has 1+ implementing file tagged with the requirement ID and `configurable-sync-timing`. G1-G3/M1-M4/D1 have no direct ID-tagged artifact, which is expected — `traceability.md`'s required-linkage table only mandates tags for Domain Spec, Gherkin scenarios, ports, contract tests, use cases, UI components, and perf/a11y/visual tests, not Goals/Non-Goals/Success-Metrics.
