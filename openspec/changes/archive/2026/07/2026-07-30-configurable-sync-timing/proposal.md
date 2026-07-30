# Configurable Sync Timing

## Why

Sync timing is currently hardcoded: the post-edit debounce is fixed at 15 seconds (`SYNC_DEBOUNCE_MS`) and the periodic background sync at 5 minutes (`SYNC_INTERVAL_MS`). Different users have different needs — some want near-instant persistence across devices, others want to conserve battery/network by syncing rarely. Making both delays user-configurable and synchronized across devices lets each person tune the app to their workflow without touching code.

## What Changes

- **ADDED** two user-configurable, cross-device-synced settings:
  - `sync_interval` — periodic sync interval in **minutes** (default 5, range 1–1440, empty = periodic sync disabled).
  - `auto_sync_delay` — post-edit debounce in **seconds** (default 15, range 0–900, 0/empty = sync immediately).
- **ADDED** a sync-timing controls group in the **Account & Sync** settings section, placed **above** the existing Server connection UI, ordered `sync_interval` then `auto_sync_delay`, each with a `SyncIndicator`.
- **MODIFIED** `SyncProvider` so the debounced push (T3) reads the current `auto_sync_delay` at schedule time, and the periodic interval (T2) is torn down and recreated when `sync_interval` changes (including when a new value arrives via pull).
- **MODIFIED** the existing constants `SYNC_INTERVAL_MS` / `SYNC_DEBOUNCE_MS` to become **default values** rather than the sole source of truth.
- No backend/protocol changes — both values are stored as ordinary synced settings (string key/value), reusing the existing settings sync path.

## Capabilities

### New Capabilities
- `sync-timing-settings`: The two synced timing preferences — their storage (IndexedDB `settings` + localStorage cache), defaults, integer bounds, validation/self-healing, disable semantics, and the Account & Sync UI controls.

### Modified Capabilities
- `sync-orchestration`: Triggers T2 (periodic sync) and T3 (debounced push) SHALL read their timing from the configurable settings instead of fixed constants; the periodic interval SHALL be recreated on change; an empty/disabled `sync_interval` SHALL suppress the periodic interval; a `0`/empty `auto_sync_delay` SHALL schedule an immediate sync.
- `settings-page-sections`: The Account & Sync section SHALL contain the sync-timing controls above the Server connection UI.

## Impact

- **Code (packages/client):**
  - `src/constants/index.ts` — new keys in `STORAGE_KEYS`, new default/bounds constants, new `SYNC_TIMING_CHANGED_EVENT` constant, add both keys to `SYNCED_SETTING_KEYS`.
  - `src/services/SettingsService.ts` — typed getters with defaults/validation for the two new settings.
  - `src/hooks/useSettings.ts` — read + setters + localStorage cache (mirroring `dayBoundary`).
  - `src/app/providers/SyncProvider.tsx` — dynamic debounce (ref), interval recreation effect, re-read of both settings on `sync_complete` (pull) and on the local timing-change event.
  - `src/components/settings/AccountSyncSection.tsx` + new `SyncTimingSection.tsx` — UI controls.
  - `src/locales/ru.json`, `src/locales/en.json` — i18n keys.
- **No changes** to backend, sync protocol wire schema, or IndexedDB schema (the `settings` table already stores arbitrary key/value pairs).

## Goals

- **G1**: Both sync-timing values are configurable from the UI and take effect without an app reload.
- **G2**: Both values synchronize across devices using the existing settings sync path (LWW, local-dirty-wins).
- **G3**: Defaults preserve today's behavior exactly (5 min interval, 15 s debounce) for users who never change them.

## Non-Goals

- **NG1**: Making ping-recovery timing (`PING_INTERVAL_MS`, `MAX_PING_ATTEMPTS`) or silent-refresh limits configurable.
- **NG2**: Per-entity or per-context sync-timing overrides.
- **NG3**: Any backend, wire-schema, or IndexedDB-schema changes.
- **NG4**: A global "pause all sync" master switch (empty values already disable the respective trigger).

## Users & Scenarios

- **U1**: A multi-device user lowers `auto_sync_delay` to 0 so edits propagate to their other devices almost immediately.
- **U2**: A battery/bandwidth-conscious user raises `sync_interval` to 60 min and relies mostly on manual/debounced sync.
- **U3**: A user clears `sync_interval` to disable periodic background sync entirely, keeping only start-up, `online`, manual, and debounced-after-edit syncs.
- **U4**: A user changes the interval on their laptop; on next pull their phone adopts the new interval without a reload.

## Requirements

### Functional

- **FR1**: The system SHALL store `sync_interval` (minutes) as a synced setting; default 5; accepted integer range 1–1440; empty value means "periodic sync disabled".
- **FR2**: The system SHALL store `auto_sync_delay` (seconds) as a synced setting; default 15; accepted integer range 0–900; `0` or empty means "sync immediately".
- **FR3**: The periodic sync trigger (T2) SHALL use the current `sync_interval`; when the value changes at runtime the interval SHALL be recreated with the new period; when the value is empty/disabled no periodic interval SHALL run.
- **FR4**: The debounced push trigger (T3) SHALL use the current `auto_sync_delay` at schedule time; a `0`/empty value SHALL schedule an immediate sync.
- **FR5**: Both settings SHALL be added to `SYNCED_SETTING_KEYS` and follow the existing settings sync path (push when dirty, LWW/local-dirty-wins on pull), with no backend changes.
- **FR6**: Both settings SHALL be cached in localStorage on write and read from cache on start-up for correct timing before IndexedDB finishes loading, defaulting to G3 defaults when absent.
- **FR7**: Invalid or corrupted stored values (non-numeric, non-integer, or out-of-range) SHALL self-heal to the default for both settings, never crashing the sync engine. Self-healing SHALL be read-only with respect to the settings store: the getter returns the default and removes the invalid localStorage cache entry, but SHALL NOT rewrite the stored value or trigger a sync. (Reverting UI input to the last valid value is covered by UX1.)
- **FR8**: The Account & Sync section SHALL render the two controls above the Server connection UI, ordered `sync_interval` then `auto_sync_delay`, each with a `SyncIndicator` for its key.

### Non-Functional

#### Performance
- **NFR-P1**: Changing either setting SHALL apply within one debounce/interval cycle and SHALL NOT trigger more than one sync cycle as a direct result of the write.

#### Accessibility
- **NFR-A1**: Each control SHALL have an associated `<label>`, `aria-describedby` help text, and be fully keyboard-operable (focus, type, Enter/blur to commit).

#### Responsive
- **NFR-R1**: The controls SHALL render correctly from 320px to 2560px viewport widths within the accordion section.

## UX Acceptance Criteria

- **UX1**: Inputs accept only integers within range; out-of-range or non-numeric entries revert to the last valid value on blur/Enter (empty is preserved where allowed).
- **UX2**: Units are shown next to each input ("min" / "sec") and never displayed in milliseconds.
- **UX3**: When `sync_interval` is empty, help text indicates periodic background sync is off; when `auto_sync_delay` is `0`/empty, help text indicates edits sync immediately.
- **UX4**: A `SyncIndicator` next to each control shows it is a cross-device synced setting.
- **UX5**: If persisting a changed value fails, the input reverts to the last stored value and the failure is visibly indicated; sync keeps running on the previous timing.

## UI States Matrix

| Network   | Data                            | UI                                                         |
|-----------|---------------------------------|------------------------------------------------------------|
| Online    | Settings loaded from IndexedDB  | Inputs show stored values, `SyncIndicator` = synced        |
| Online    | Local edit not yet pushed       | `SyncIndicator` = pending until next sync clears the flag  |
| Offline   | Settings cached in localStorage | Inputs editable, changes queued, `SyncIndicator` = pending |
| Loading   | IndexedDB not yet read          | Inputs show localStorage-cached values (or defaults)       |
| Sync pull | Newer server value arrives      | Input updates to server value (unless local pending wins)  |
| Any       | Setting write fails             | Input reverts to last stored value, error feedback (UX5)   |

## Behavior

See `features/sync_timing_settings.feature` and `features/sync_orchestration.feature` (tagged `@configurable-sync-timing`).

## Affected IA

No changes — new controls live inside the existing Settings > Account & Sync section.

## Success Metrics

- **M1**: With no user change, sync timing is byte-for-byte the current behavior (interval 300000 ms, debounce 15000 ms) — verified by unit tests.
- **M2**: Changing `sync_interval` at runtime recreates the periodic interval with the new period (asserted in tests); no app reload required.
- **M3**: Both settings round-trip through push/pull with LWW/local-dirty-wins — verified by settings sync tests.
- **M4**: Mutation score ≥95% (min 90%) on new domain/service code.

## Open Questions

- None outstanding — bounds and disable semantics confirmed (interval 1–1440 min, empty disables; delay 0–900 s, 0/empty = immediate).
