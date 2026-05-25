## 1. OpenSpec Stable Specs

- [ ] 1.1 Create `openspec/specs/settings/spec.md` — synced settings capability (repository CRUD, idempotent writes, sync flags, conflict resolution, bulk upsert, service typed defaults, custom accent color persistence) — implements FR1, FR2, FR3, FR5, FR7
- [ ] 1.2 Create `openspec/specs/local-preferences/spec.md` — local-only preferences capability (color scheme, panel settings, focus mode, interface scale, filter bar position, section collapse, language, show hidden tasks, synced settings cache) — implements FR4, FR5, FR8

## 2. BDD Feature Files — Settings Repository

- [ ] 2.1 Create `features/settings/settings_repository_read.feature` — scenarios for getAll, getByKey, getValue with existing and non-existent keys — @settings-specs-and-bdd @FR1
- [ ] 2.2 Create `features/settings/settings_repository_write.feature` — scenarios for set (create, update, idempotent skip, validation error) — @settings-specs-and-bdd @FR1 @FR5
- [ ] 2.3 Create `features/settings/settings_repository_sync.feature` — scenarios for getNeedingSync, clearNeedsSyncByKey, getChangedSince, bulkUpsert conflict resolution — @settings-specs-and-bdd @FR2 @FR3 @FR6

## 3. BDD Step Definitions — Settings Repository

- [ ] 3.1 Create `steps/settings_repository_read.steps.ts` — step definitions using fake-indexeddb + SettingsRepository
- [ ] 3.2 Create `steps/settings_repository_write.steps.ts` — step definitions for write operations
- [ ] 3.3 Create `steps/settings_repository_sync.steps.ts` — step definitions for sync operations and conflict resolution

## 4. BDD Feature Files — Settings Service

- [ ] 4.1 Create `features/settings/settings_service.feature` — scenarios for getDefaultBox/getAccentColor defaults, set delegation — @settings-specs-and-bdd @FR7

## 5. BDD Step Definitions — Settings Service

- [ ] 5.1 Create `steps/settings_service.steps.ts` — step definitions using mocked repository for SettingsService

## 6. BDD Feature Files — Custom Accent Color

- [ ] 6.1 Create `features/settings/settings_custom_accent.feature` — scenarios for saving custom colors, loading from IndexedDB, default values, sync from server, DOM application only when accent is "custom" — @settings-specs-and-bdd @FR1 @FR5

## 7. BDD Step Definitions — Custom Accent Color

- [ ] 7.1 Create `steps/settings_custom_accent.steps.ts` — step definitions for custom accent color persistence via ThemeProvider/SettingsRepository

## 8. BDD Feature Files — Local Preferences

- [ ] 8.1 Create `features/settings/settings_focus_mode.feature` — scenarios for focus mode toggle, opacity parsing, invalid opacity fallback — @settings-specs-and-bdd @FR4 @FR8

## 9. BDD Step Definitions — Local Preferences

- [ ] 9.1 Create `steps/settings_focus_mode.steps.ts` — step definitions for useFocusMode hook

## 10. Verification

- [ ] 10.1 Run all BDD tests and verify they pass: `npx vitest run --reporter=verbose packages/client/src/test/features/settings/`
- [ ] 10.2 Verify build: `pnpm run build`
