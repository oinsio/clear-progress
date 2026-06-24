# Sync Orchestration

Describes when and how the client triggers synchronization cycles. Does NOT cover the sync protocol itself (push/pull logic, conflict resolution, versioning) — that belongs to a separate sync-protocol spec.

## Concepts

- **Sync cycle**: a sequential execution of `push()` then `pull()`, followed by cover sync
- **Sync status**: one of `idle`, `syncing`, `offline`, `error`, `unauthorized`
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
