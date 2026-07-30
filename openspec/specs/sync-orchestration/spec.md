# Sync Orchestration

Describes when and how the client triggers synchronization cycles. Does NOT cover the sync protocol itself (push/pull logic, conflict resolution, versioning) — that belongs to a separate sync-protocol spec.

## Concepts

- **Sync cycle**: a sequential execution of `push()` then `pull()`, followed by cover sync
- **Sync status**: one of `idle`, `syncing`, `offline`, `error`, `unauthorized`, `project_paused`
- **Sync version**: React state counter incremented after each successful sync cycle. Used by UI hooks (useTasks, useGoals, etc.) to reactively reload data. Not related to the server revision — that is managed by SyncService internally as part of the sync protocol.
- **Mutex**: only one sync cycle can run at a time; concurrent requests are dropped (not queued)

## Triggers

### T1: Mount sync

When SyncProvider mounts with a valid `accessToken` and connection config, an immediate sync cycle runs.

### T2: Periodic sync

A `setInterval` fires every `SYNC_INTERVAL_MS` (5 minutes). Each tick attempts a sync cycle.

### T3: Debounced push (schedulePush)

After any local data mutation, `schedulePush()` is called. It resets a debounce timer of `SYNC_DEBOUNCE_MS` (15 seconds). When the timer fires, a full sync cycle runs.

Multiple calls within the debounce window reset the timer — only one sync fires after the last call.

### T4: Online event

When `window` fires the `online` event, a `performPing()` is executed immediately (not a full sync). If ping succeeds, a sync cycle follows.

### T5: Ping recovery interval

When sync status becomes `offline` or `error`, a ping interval starts (`PING_INTERVAL_MS` = 30 seconds). Each tick calls `performPing()`. On success: sync cycle runs and interval stops. On failure: continues until `MAX_PING_ATTEMPTS`, then stops.

### T6: Manual sync (spinner click)

User clicks the sync indicator in the UI. This calls `pull()` from SyncContext, which is mapped to `sync()` — a regular sync cycle (push + pull). Not the same as full sync (T7) — does not force-push or reset revision.

## Preconditions (gates)

A sync cycle is **skipped** when:
- `accessToken` is null (not authenticated)
- `navigator.onLine` is false (sets status to `offline`)
- Mutex is held (another sync is already in progress)

## Sync cycle sequence

```
1. push() — send local dirty records to server
2. pull() — fetch server changes
3. coverSync() — sync cover images (errors caught separately, don't fail the cycle)
4. Update lastSyncedAt timestamp
5. Set syncStatus = "idle"
6. Increment syncVersion
```

## Error handling

| Error type                    | Behavior                                                                    |
|-------------------------------|-----------------------------------------------------------------------------|
| Network error                 | Set status `error`, start ping interval                                     |
| Auth error (1st..N-1 attempt) | Set status `unauthorized`, call `silentRefresh()`                           |
| Auth error (Nth attempt)      | Set status `unauthorized`, call `signOut()`, dispatch `AUTH_REQUIRED_EVENT` |
| ProjectPausedError            | Set status `project_paused`, do NOT start ping interval                     |
| Cover sync error              | Logged, does not change sync status                                         |

Where N = `MAX_SILENT_REFRESH_ATTEMPTS`. Counter resets after any successful sync.

## Full sync (T7, manual from settings)

Triggered explicitly by the user from settings. Differs from regular sync:
1. Reupload local covers
2. Upload covers
3. `push(force=true)` — sends all records, not just dirty
4. `resetAndPull()` — resets revision to 0, pulls full state
5. Download all server covers

Reports progress steps: `reupload_covers` → `upload_covers` → `push` → `pull` → `download_covers` → `done` (or `error`).

## Cleanup

On unmount, all timers (periodic interval, ping interval, debounce timer) and event listeners are cleared.

## Constants

| Name                          | Value          | Purpose                            |
|-------------------------------|----------------|------------------------------------|
| `SYNC_INTERVAL_MS`            | 300000 (5 min) | Periodic sync interval             |
| `SYNC_DEBOUNCE_MS`            | 15000 (15 sec) | Debounce after mutation            |
| `PING_INTERVAL_MS`            | 30000 (30 sec) | Recovery ping interval             |
| `MAX_PING_ATTEMPTS`           | configurable   | Stops pinging after N failures     |
| `MAX_SILENT_REFRESH_ATTEMPTS` | configurable   | Forces signOut after N auth errors |

## Requirements

### Requirement: SyncProvider traceability

SyncProvider.tsx SHALL reference sync-orchestration spec (triggers T1-T7, preconditions, error handling, cleanup) as its primary traceability link. The secondary reference to localstorage-refactor FR6, FR7 (usePreference for lastSyncedAt) SHALL be preserved. Implements FR7 of miss-behavior-specs.

#### Scenario: SyncProvider references sync-orchestration spec
- **WHEN** a developer reads SyncProvider.tsx
- **THEN** the file-level comment references sync-orchestration spec triggers T1-T7
- **AND** the comment also references localstorage-refactor FR6, FR7 for localStorage integration

### Requirement: Ping recovery interval does not start for project_paused
When sync status becomes `"project_paused"`, the system SHALL NOT start the ping recovery interval. The periodic sync interval (every `SYNC_INTERVAL_MS`) SHALL continue running normally.

#### Scenario: Ping interval not started when project paused
- **WHEN** `syncStatus` becomes `"project_paused"`
- **THEN** ping interval is NOT started
- **AND** periodic sync interval continues

#### Scenario: Ping interval still starts for error and offline
- **WHEN** `syncStatus` becomes `"error"` or `"offline"`
- **THEN** ping interval starts as before

### Requirement: Configurable periodic sync interval

The periodic sync trigger (T2) SHALL derive its period from the `sync_interval` setting rather than the fixed `SYNC_INTERVAL_MS` constant. `SYNC_INTERVAL_MS` SHALL remain as the default when the setting is absent. When the effective interval changes at runtime — whether via a local edit (signalled by `SYNC_TIMING_CHANGED_EVENT`) or a value arriving through pull (signalled by `sync_complete`) — the system SHALL re-read the setting, clear the existing `setInterval`, and create a new one with the updated period, without requiring an app reload. When the setting is empty/disabled, no periodic interval SHALL be running. # implements FR3 of configurable-sync-timing

#### Scenario: Interval uses the configured value
- **WHEN** SyncProvider is mounted with `sync_interval` resolving to 30 minutes
- **THEN** the periodic sync interval fires every 30 minutes

#### Scenario: Interval recreated on change
- **WHEN** the periodic interval is running with a 5-minute period
- **AND** `sync_interval` changes to 10 minutes
- **THEN** the previous interval is cleared
- **AND** a new interval is created with a 10-minute period

#### Scenario: Disabled interval runs no periodic sync
- **WHEN** `sync_interval` is empty/disabled
- **THEN** no periodic sync interval is created

#### Scenario: Pulled interval value takes effect without reload
- **WHEN** a sync pull stores a new `sync_interval` value
- **AND** the sync completes (`sync_complete` fires)
- **THEN** the periodic interval is recreated using the pulled value

#### Scenario: Default preserved when setting absent
- **WHEN** no `sync_interval` value has been stored
- **THEN** the periodic interval fires every `SYNC_INTERVAL_MS` (5 minutes)

### Requirement: Configurable debounced push delay

The debounced push trigger (T3, `schedulePush`) SHALL read the current `auto_sync_delay` setting at schedule time rather than the fixed `SYNC_DEBOUNCE_MS` constant. `SYNC_DEBOUNCE_MS` SHALL remain as the default when the setting is absent. A `0`/empty value SHALL schedule an immediate sync (0 ms timeout). The effective delay SHALL be refreshed on `SYNC_TIMING_CHANGED_EVENT` (local write) and on `sync_complete` (value arriving via pull). Multiple mutations within the debounce window SHALL continue to reset the timer so only one sync fires after the last mutation. # implements FR4 of configurable-sync-timing

#### Scenario: Debounce uses the configured delay
- **WHEN** `auto_sync_delay` resolves to 60 seconds
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled 60 seconds after the last call

#### Scenario: Zero delay schedules immediate sync
- **WHEN** `auto_sync_delay` resolves to 0 (or empty)
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled with a 0 ms timeout

#### Scenario: Latest delay value is used
- **WHEN** `auto_sync_delay` changes from 15 to 5 seconds
- **AND** `schedulePush` is called after the change
- **THEN** the sync is scheduled using the 5-second delay

#### Scenario: Pulled delay value takes effect without reload
- **WHEN** a sync pull stores a new `auto_sync_delay` value
- **AND** the sync completes (`sync_complete` fires)
- **AND** `schedulePush` is called
- **THEN** the sync is scheduled using the pulled delay

#### Scenario: Default preserved when setting absent
- **WHEN** no `auto_sync_delay` value has been stored
- **AND** `schedulePush` is called
- **THEN** a sync is scheduled `SYNC_DEBOUNCE_MS` (15 seconds) after the last call
