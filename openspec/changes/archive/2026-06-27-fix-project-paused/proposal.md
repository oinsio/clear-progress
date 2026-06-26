# fix-project-paused

## Why

Supabase on the free tier pauses the project after 7 days without API requests. When accessing a paused project, Supabase returns HTTP 540 (custom status code, "Project Paused"). Currently the app does not distinguish 540 from a network error — the user sees "Server Error", ping interval starts pointlessly (cannot wake a paused project), and the user doesn't know what to do.

## What Changes

- **ADDED**: `ProjectPausedError` in contract
- **MODIFIED**: `SupabaseSyncAdapter.invoke()` — HTTP 540 detection, throw `ProjectPausedError`
- **ADDED**: New `SyncStatus`: `"project_paused"`
- **MODIFIED**: `SyncProvider.handleSyncError()` — new branch for `ProjectPausedError`
- **ADDED**: UI — `ProjectPausedDialog` with instructions and Dashboard link
- **MODIFIED**: Ping interval — NOT started for `"project_paused"`
- **ADDED**: i18n keys for the dialog

## Goals

- G1: User understands why sync is not working and knows how to fix it
- G2: App does not waste resources on pointless ping

## Non-Goals

- NG1: Preemptive warning ("your server will sleep soon")
- NG2: Automatic pause prevention (keep-alive cron)
- NG3: "Retry" button in dialog (auto-sync will pick up restore automatically)

## Users & Scenarios

- U1: User with free Supabase hasn't visited for 7+ days → sees dialog with instructions → restores project → sync resumes automatically

## Requirements

### Functional

- FR1: `SupabaseSyncAdapter.invoke()` catches `FunctionsHttpError` with `context.status === 540` and throws `ProjectPausedError`
- FR2: `SyncStatus` includes `"project_paused"` value
- FR3: `SyncProvider.handleSyncError()` on `ProjectPausedError` sets `syncStatus = "project_paused"` and does NOT start ping interval
- FR4: When status is `"project_paused"`, periodic auto-sync (setInterval) continues running
- FR5: `ProjectPausedDialog` is shown when `syncStatus === "project_paused"` with text, Dashboard link, and buttons [Open Dashboard] [Close]
- FR6: After project restore, periodic sync automatically picks up the restored project and returns status to `"idle"`

### Non-Functional

#### Accessibility

- NFR-A1: `ProjectPausedDialog` is accessible to screen readers (role="dialog", aria-labelledby, aria-describedby)

## UX Acceptance Criteria

- UX1: Dialog is shown once upon detecting 540; after closing, it is not shown again until the next sync cycle
- UX2: Sidebar sync block displays "Project paused" status with icon
- UX3: After project restore, no additional user action is required

## Behavior

Scenarios are covered in unit tests.

## Affected IA

No IA changes.

## Success Metrics

- M1: HTTP 540 is detected and user sees a clear dialog (unit test + manual)
- M2: Ping interval does NOT start for project_paused (unit test)
- M3: Periodic sync picks up restore automatically (unit test)

## Capabilities

### New Capabilities

- `project-paused-detection`: HTTP 540 detection, `ProjectPausedError`, `SyncStatus: "project_paused"`, UI dialog

### Modified Capabilities

- `sync-orchestration`: Ping interval does not start for `"project_paused"`, periodic sync continues running
- `supabase-adapter`: 540 detection in `invoke()`

## Impact

| Package | File | What changes |
|---------|------|-------------|
| `contract` | `src/errors/` | `ProjectPausedError` |
| `adapter-supabase` | `src/supabase-sync-adapter.ts` | 540 detection, throw `ProjectPausedError` |
| `client` | `src/types/common.ts` | `"project_paused"` in `SyncStatus` |
| `client` | `src/app/providers/SyncProvider.tsx` | New branch in `handleSyncError` |
| `client` | `src/components/tasks/SidebarSyncBlock.tsx` | Status display |
| `client` | `src/components/settings/ProjectPausedDialog.tsx` | New component |
| `client` | `src/locales/ru.json`, `en.json` | Dialog texts |

## Open Questions

No open questions — all decisions documented in `supabase-project-paused-decisions.md`.
