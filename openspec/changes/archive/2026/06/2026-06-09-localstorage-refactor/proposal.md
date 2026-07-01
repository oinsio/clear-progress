# localstorage-refactor

## Why

localStorage usage is scattered across ~14 hooks and providers, each repeating the same read/write/validate/fallback pattern (~300-400 lines of boilerplate). There is no self-healing for corrupted data — invalid values silently fall back to defaults without cleaning up the corrupted entry. Connection config uses 3 separate keys with full data duplication. `SETTING_KEYS` duplicates 5 values from `STORAGE_KEYS`. The `color_scheme` key is not read in the `index.html` inline script, causing a flash of wrong theme on dark-mode devices.

## What Changes

- **ADDED** `LocalPreferencesService` — unified read/write/remove layer over localStorage with self-healing (corrupted data → delete key, return default, `console.warn`)
- **ADDED** `usePreference<T>` React hook — generic hook replacing individual hooks/providers for local preferences
- **MODIFIED** Connection config storage — 3 keys (`connection_config`, `saved_supabase_config`, `saved_gas_config`) consolidated into 1 structured JSON key with `{ activeType, configs }` schema. **BREAKING** (not in prod)
- **MODIFIED** `index.html` inline script — added early `color_scheme` reading to prevent flash of wrong theme
- **REMOVED** `SETTING_KEYS` constant — replaced by references to `STORAGE_KEYS`
- **MODIFIED** `tokenPersistence` — added self-healing for corrupted token data
- **ADDED** Contract tests for all `STORAGE_KEYS` string values (protecting `index.html` inline script and i18next detector)

## Capabilities

### New Capabilities

- `local-storage-service`: Core `LocalPreferencesService` with typed get/set/remove, self-healing, and `usePreference` hook

### Modified Capabilities

- `local-preferences`: Requirements change — all preferences now go through `LocalPreferencesService` instead of individual hooks; self-healing behavior added for all keys
- `connection-management`: Requirements change — storage schema changes from 3 keys with `isActive` to 1 key with `activeType`/`configs`; `getSavedConfigForType` reads from nested `configs` object
- `theme-appearance`: Requirements change — `color_scheme` is read in `index.html` inline script (preventing flash of wrong theme); accent color localStorage caching deduplicated (only `ThemeProvider` writes, not both `ThemeProvider` and `useSettings`)
- `settings`: Requirements change — `SETTING_KEYS` removed, replaced by `STORAGE_KEYS` references

## Goals

- G1: Eliminate localStorage boilerplate — one pattern instead of ~14 copies
- G2: Add self-healing for all localStorage keys — corrupted data auto-recovers
- G3: Remove data duplication in connection config storage
- G4: Fix flash of wrong theme on dark-mode devices

## Non-Goals

- NG1: Migrating old connection config format (not in production)
- NG2: Moving localStorage data to IndexedDB
- NG3: Changing sync protocol or backend API
- NG4: Adding new user-facing features

## Users & Scenarios

- U1: Developer maintaining localStorage-related code — fewer files to modify, one pattern to learn
- U2: User on dark mode — no more white flash on app load
- U3: User with corrupted localStorage — automatic recovery instead of stuck state

## Requirements

### Functional

- FR1: `LocalPreferencesService.get(key, schema, default)` SHALL read from localStorage, validate, and return typed value
- FR2: `LocalPreferencesService.set(key, value, serialize?)` SHALL write to localStorage with optional serializer
- FR3: `LocalPreferencesService.remove(key)` SHALL remove key from localStorage
- FR4: Self-healing — when `get()` finds invalid data (bad JSON, failed Zod, NaN, out-of-range enum), it SHALL remove the corrupted key, log `console.warn` with key name and reason, and return the default value
- FR5: When localStorage is unavailable, `get()` SHALL return default and `set()`/`remove()` SHALL silently no-op
- FR6: `usePreference<T>(key, schema, default)` SHALL return `[value, setter]` with `useState` + `useCallback` pattern, reading initial value via `LocalPreferencesService.get()` and writing via `LocalPreferencesService.set()`
- FR7: `usePreference` SHALL support value types: string enum (validated against allowed list), boolean (`"true"`/`"false"` serialization), number (`parseFloat` + NaN check), JSON (Zod schema validation)
- FR8: Connection config SHALL use single key `connection_config` with schema `{ activeType: "supabase" | "gas" | null, configs: { supabase?: SupabaseConfig, gas?: GasConfig } }`
- FR9: `connect(config)` SHALL set `activeType` to config type and upsert the type-specific config in `configs`
- FR10: `disconnect()` SHALL set `activeType` to `null`, preserving all `configs` entries for form pre-fill
- FR11: `getSavedConfigForType(type)` SHALL read from `configs[type]` within the single JSON key
- FR12: `getConnectionConfig()` SHALL return config from `configs[activeType]` when `activeType` is not null, else return `null`
- FR13: `SETTING_KEYS` SHALL be removed; all code using `SETTING_KEYS.*` SHALL use `STORAGE_KEYS.*` instead
- FR14: `index.html` inline script SHALL read `color_scheme` from localStorage and apply `dark` class to `<html>` before React loads (preventing flash of wrong theme)
- FR15: `index.html` inline script SHALL handle `color_scheme: "system"` by checking `prefers-color-scheme: dark` media query
- FR16: Contract tests SHALL verify string values of all `STORAGE_KEYS` entries match their expected literals
- FR17: Self-healing SHALL be added to `tokenPersistence.load()` — invalid/corrupted token data SHALL be cleaned up and `null` returned
- FR18: `readCached(key, schema, default)` SHALL provide read-only access to synced settings cached in localStorage (used by `useSettings`, `ThemeProvider`)
- FR19: `syncCache(key, value)` SHALL update the localStorage cache for synced settings after IndexedDB load, using `LocalPreferencesService.set()` internally
- FR20: Accent color caching in localStorage SHALL happen only in `ThemeProvider` (remove duplicate caching from `useSettings`)

### Non-Functional

#### Performance

- NFR-P1: `LocalPreferencesService.get()` SHALL be synchronous — no async overhead for localStorage reads
- NFR-P2: `index.html` color scheme script SHALL execute before first paint (inline, no module loading)

#### Accessibility

- NFR-A1: No accessibility changes — all existing a11y behavior preserved

## UX Acceptance Criteria

- UX1: On dark-mode devices, the app SHALL load with dark background from the first paint — no white flash
- UX2: All existing user preferences SHALL be preserved after the refactoring (no data loss for current users — but connection config format change is acceptable since not in prod)
- UX3: When localStorage contains corrupted data, the app SHALL recover to defaults without user intervention

## Behavior

Behavior specs covered by existing features in `features/` directory with `@localstorage-refactor` tags added to modified scenarios.

## Visual Reference

No visual changes except UX1 (flash of wrong theme fix).

## Affected IA

No changes to information architecture.

## Success Metrics

- M1: Zero individual `getCachedX()` functions — all replaced by `LocalPreferencesService.get()`
- M2: `STORAGE_KEYS` count reduced from 28 to 24 (removed `SAVED_SUPABASE_CONFIG`, `SAVED_GAS_CONFIG`; `SETTING_KEYS` eliminated entirely)
- M3: Self-healing coverage: all 24 localStorage keys have validation and auto-recovery
- M4: Mutation score >= 95% on `LocalPreferencesService` and updated `connectionService`
- M5: No flash of wrong theme confirmed via E2E test on dark mode

## Open Questions

None.
