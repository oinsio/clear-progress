## Context

localStorage access is spread across ~14 hooks/providers in `packages/client/src`, each implementing the same pattern: `getCachedX()` with try/catch + validation + default, `useState(getCachedX)`, `useCallback` setter with `localStorage.setItem`. No self-healing — invalid data silently falls back to defaults without cleanup.

Connection config uses 3 keys (`connection_config`, `saved_supabase_config`, `saved_gas_config`) where the active config is fully duplicated in the saved key. `SETTING_KEYS` duplicates 5 string values from `STORAGE_KEYS`.

The `index.html` inline script reads `accent_color` for early paint but does not read `color_scheme`, causing flash of wrong theme.

Key constraints:
- `accent_color`, `custom_accent_light`, `custom_accent_dark` string values are hardcoded in `index.html` inline script
- `language` string value is used by `i18next-browser-languagedetector` config
- `connection_config` is read at module-level in `supabaseClientManager.ts` (before React)
- `menu_order` uses `useSyncExternalStore` pattern (module-level singleton)
- `sb-*-auth-token` keys are managed by Supabase SDK — do not touch

## Goals / Non-Goals

**Goals:**
- Single abstraction layer for all localStorage access (FR1-FR7)
- Self-healing for corrupted data across all keys (FR4, FR17)
- Unified connection config storage (FR8-FR12)
- Flash of wrong theme fix (FR14-FR15)
- Eliminate `SETTING_KEYS` duplication (FR13)

**Non-Goals:**
- Migration from old connection config format (NG1 — not in prod)
- Changing how synced settings reach IndexedDB (sync protocol unchanged)
- Modifying Supabase SDK's own localStorage usage

## Decisions

### D1: LocalPreferencesService as a stateless module (not a class)

**Decision**: Implement as exported functions (`getPreference`, `setPreference`, `removePreference`) rather than a class instance.

**Why over class**: Every consumer needs the same global localStorage — no instance state, no DI needed. Functions are simpler to import and tree-shake. The existing `connectionService.ts` follows this pattern successfully.

**Why over singleton class**: No lifecycle to manage, no constructor, no teardown. Pure functions with localStorage as implicit global state.

### D2: usePreference hook with discriminated config object

**Decision**: `usePreference(config)` where config is a discriminated union on `type`:

```ts
type PreferenceConfig<T> =
  | { type: "enum"; key: string; values: readonly T[]; defaultValue: T }
  | { type: "boolean"; key: string; defaultValue: boolean }
  | { type: "number"; key: string; defaultValue: number }
  | { type: "json"; key: string; schema: ZodType<T>; defaultValue: T }
```

**Why over generic with serializer/deserializer pair**: Discriminated union gives exhaustive validation per type. Each branch has clear self-healing behavior. Type inference works naturally — `usePreference({ type: "enum", values: PANEL_SIDES, ... })` infers `PanelSide`.

**Why over separate hooks (useBooleanPreference, useEnumPreference)**: One import, one pattern. The discriminant handles dispatch internally.

### D3: Connection config — single JSON key with nested configs

**Decision**: Replace 3 keys with 1 key `connection_config`:

```ts
interface ConnectionStore {
  activeType: "supabase" | "gas" | null;
  configs: {
    supabase?: { url: string; anonKey: string };
    gas?: { url: string; clientId?: string };
  };
}
```

Zod schema `ConnectionStoreSchema` validates the whole structure.

**Why over keeping `isActive` per config**: Single `activeType` field is clearer — one source of truth for which backend is active. No inconsistency possible (e.g., two configs both `isActive: true`). Extensible — adding a new backend type is just a new key in `configs`.

**Why no migration**: App is not in production. Old keys will simply be ignored; `getConnectionConfig()` reads only the new format.

### D4: Self-healing strategy — delete + warn + default

**Decision**: On any validation failure during `get()`:
1. `localStorage.removeItem(key)` — clean up corrupted entry
2. `console.warn(`[LocalPreferences] Corrupted "${key}": ${reason}, reset to default`)`
3. Return default value

**Why warn not error**: Corrupted localStorage is recoverable (defaults work). `console.error` implies something needs developer action. `console.warn` is informational.

**Why delete not overwrite with default**: Overwriting would trigger unnecessary writes. For synced settings, the next IndexedDB load will re-populate the cache. For local preferences, the next user action will write the correct value.

### D5: index.html color_scheme — inline script extension

**Decision**: Extend the existing inline script in `index.html` to read `color_scheme` and apply `dark` class before first paint. Must handle `"system"` by checking `prefers-color-scheme: dark` media query.

```js
const colorScheme = localStorage.getItem("color_scheme");
if (colorScheme === "dark" ||
    (colorScheme !== "light" &&
     window.matchMedia("(prefers-color-scheme: dark)").matches)) {
  document.documentElement.classList.add("dark");
}
```

**Why in index.html not in a module**: Must execute before first paint. Module scripts are deferred. The existing accent_color script already uses this pattern.

### D6: Synced settings cache — readCached/syncCache via service

**Decision**: Synced settings (cached copies of IndexedDB values) use the same `getPreference()` for reading and a dedicated `syncCache()` for writing after IndexedDB load. Only `ThemeProvider` writes accent color cache (removing duplicate from `useSettings`).

**Why separate syncCache**: Makes it explicit that this is a cache update, not a user action. Prevents confusion about data flow direction (IndexedDB → localStorage, not the reverse).

### D7: menuOrderStore uses service for get/set, keeps own subscription

**Decision**: `menuOrderStore.ts` uses `getPreference()` and `setPreference()` for localStorage access but retains its own `useSyncExternalStore` pattern (listeners, getSnapshot, subscribe).

**Why not usePreference hook**: The store is a module-level singleton, not a React component. It needs imperative `get`/`set` at module load time, plus its own subscription model for `useSyncExternalStore`. The hook pattern doesn't fit.

### D8: File placement

- `packages/client/src/services/localPreferencesService.ts` — core service (get/set/remove with self-healing)
- `packages/client/src/hooks/usePreference.ts` — React hook
- Existing hooks (`usePanelSide.ts`, `usePanelOpen.ts`, etc.) — replaced by `usePreference` calls at usage sites or thin wrappers
- `packages/client/src/constants/index.ts` — `SETTING_KEYS` removed, `STORAGE_KEYS` kept (with `SAVED_SUPABASE_CONFIG` and `SAVED_GAS_CONFIG` removed)

## Risks / Trade-offs

- **[Risk] index.html inline script string literals diverge from STORAGE_KEYS** → Contract tests (FR16) verify all string values match. CI catches drift.
- **[Risk] i18next detector writes to `language` key independently** → Service and i18next both write the same value. Double-write is harmless. Key name is locked by contract test.
- **[Risk] supabaseClientManager reads connection_config at module level before any service init** → `getConnectionConfig()` uses `getPreference()` internally which is stateless and works at module level. No init required.
- **[Trade-off] usePreference centralizes logic but adds indirection** → Worth it for ~14 deduplicated hooks. Each usage site is one line instead of a whole file.
- **[Trade-off] No migration for connection config format change** → Acceptable since not in production. Users on dev builds will need to reconfigure backend connection once.
