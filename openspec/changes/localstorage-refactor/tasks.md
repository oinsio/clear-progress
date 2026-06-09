## 1. LocalPreferencesService — core service (TDD)

- [x] 1.1 Create `localPreferencesService.ts` with `getPreference()`, `setPreference()`, `removePreference()` — enum, boolean, number, json types with self-healing (FR1-FR5, FR7). TDD: write failing tests first, then implement.
- [x] 1.2 Add `readCached()` and `syncCache()` helpers for synced settings cache (FR18, FR19)
- [x] 1.3 Mutation testing on `localPreferencesService.ts` — target >=95% (M4)

## 2. usePreference React hook (TDD)

- [x] 2.1 Create `usePreference.ts` hook — `[value, setter]` pattern using `getPreference`/`setPreference` internally (FR6, FR7). TDD.
- [x] 2.2 Mutation testing on `usePreference.ts` — target >=95%

## 3. Contract tests for STORAGE_KEYS

- [x] 3.1 Extend `index.storage-db.test.ts` with contract tests for ALL `STORAGE_KEYS` string values — especially `accent_color`, `custom_accent_light`, `custom_accent_dark`, `color_scheme`, `language` (FR16)

## 4. Eliminate SETTING_KEYS

- [x] 4.1 Replace all `SETTING_KEYS.*` references with `STORAGE_KEYS.*` in `SettingsService.ts`, `useSettings.ts`, `ThemeProvider.tsx`, and their tests (FR13)
- [x] 4.2 Remove `SETTING_KEYS` export from `constants/index.ts`
- [x] 4.3 Verify build passes — `pnpm run build`

## 5. Refactor connection config to single JSON key (TDD)

- [x] 5.1 Create `ConnectionStoreSchema` Zod schema in `packages/contract` — `{ activeType, configs }` (FR8)
- [x] 5.2 Refactor `connectionService.ts` — `connect()`, `disconnect()`, `getConnectionConfig()`, `getSavedConnectionConfig()`, `getSavedConfigForType()`, `getBackendType()` to use new schema (FR9-FR12). TDD: update existing BDD step definitions and unit tests.
- [x] 5.3 Remove `SAVED_SUPABASE_CONFIG` and `SAVED_GAS_CONFIG` from `STORAGE_KEYS`
- [x] 5.4 Update `supabaseClientManager.ts` boot-path to work with new `getConnectionConfig()` return type (no `isActive` field)
- [x] 5.5 Update `ServerGasForm.tsx`, `ServerSupabaseForm.tsx` to use `getSavedConfigForType()` with new schema
- [x] 5.6 Mutation testing on `connectionService.ts` — target >=95% (M4)

## 6. Migrate existing hooks/providers to usePreference

- [x] 6.1 Replace `usePanelSide.ts` with `usePreference` call (enum type)
- [x] 6.2 Replace `usePanelOpen.ts` with `usePreference` call (boolean type)
- [x] 6.3 Replace `usePanelSplit.ts` with `usePreference` call (number type) — keep clamp logic
- [x] 6.4 Replace `useFocusMode.ts` with `usePreference` calls (boolean + number)
- [x] 6.5 Replace `useFilterBarPosition.ts` with `usePreference` call (enum type)
- [x] 6.6 Replace `useHandedness.ts` with `usePreference` call (enum type)
- [x] 6.7 Replace `useSectionCollapse.ts` with `usePreference` call (json type) — keep per-section logic
- [x] 6.8 Replace `ShowHiddenProvider.tsx` with `usePreference` call (boolean type)
- [x] 6.9 Replace `PanelSettingsProvider.tsx` with `usePreference` call (boolean type)
- [x] 6.10 Replace `InterfaceScaleProvider.tsx` — use `usePreference` for localStorage, keep `data-scale` DOM logic
- [x] 6.11 Refactor `LanguageProvider.tsx` — use `getPreference`/`setPreference` for localStorage access, keep i18next integration
- [x] 6.12 Refactor `ThemeProvider.tsx` — use `getPreference` for initial reads, `syncCache` for post-IndexedDB cache writes; remove duplicate accent color caching from `useSettings` (FR20)
- [x] 6.13 Refactor `menuOrderStore.ts` — use `getPreference`/`setPreference` for localStorage access, keep useSyncExternalStore pattern (D7)
- [x] 6.14 Refactor `SyncProvider.tsx` — use `getPreference`/`setPreference` for `LAST_SYNC`
- [x] 6.15 Refactor `SyncService.ts` — use `getPreference`/`setPreference` for `SETTINGS_UPDATED_AT`
- [x] 6.16 Refactor `OnboardingService.ts` and `useOnboarding.ts` — use `getPreference`/`setPreference` for `ONBOARDING_SHOWN`
- [x] 6.17 Verify build passes — `pnpm run build`

## 7. Self-healing for tokenPersistence

- [x] 7.1 Add self-healing to `tokenPersistence.localStoragePersistence.load()` — corrupted/invalid token data SHALL be cleaned up and `null` returned (FR17). TDD.
- [x] 7.2 Mutation testing on `tokenPersistence.ts` — target >=95% (94% — 3 equivalent mutants)

## 8. Fix flash of wrong theme

- [x] 8.1 Add `color_scheme` reading to `index.html` inline script — handle `"dark"`, `"light"`, `"system"` / missing (FR14, FR15)

## 9. Update existing tests

- [x] 9.1 Update BDD step definitions for connection management features to use new schema
- [x] 9.2 Update `useSettings.test.ts` — remove assertions about `SETTING_KEYS`, add assertions using `STORAGE_KEYS`
- [x] 9.3 Update tests that used `SETTING_KEYS` imports — switch to `STORAGE_KEYS`
- [x] 9.4 Update `AuthProvider.test.tsx`, `SupabaseAuthSync.test.tsx`, `GoogleAuthSync.test.tsx` — ensure compatibility with new `connectionService` return types
- [x] 9.5 Run full unit test suite — verify zero regressions

## 10. Cleanup

- [x] 10.1 Delete replaced hook files (`usePanelSide.ts`, `usePanelOpen.ts`, `useFilterBarPosition.ts`, `useHandedness.ts`) if fully replaced by `usePreference`; keep as thin wrappers if they have domain-specific logic (e.g., `usePanelSplit` clamp)
- [x] 10.2 Verify build passes — `pnpm run build`
- [x] 10.3 Verify no unused imports/exports remain
