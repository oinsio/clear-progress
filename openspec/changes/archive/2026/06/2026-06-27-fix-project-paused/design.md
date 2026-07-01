## Context

Supabase free tier pauses the project after 7 days without API requests. HTTP 540 is a custom status code. `supabase-js` wraps it in `FunctionsHttpError` with `error.context.status === 540`. Currently the app handles this as a generic error. Decisions documented in `supabase-project-paused-decisions.md`.

## Goals / Non-Goals

**Goals:**
- Detect 540, show a clear dialog, don't waste resources on ping

**Non-Goals:**
- Pause prevention, automatic restore, "Retry" button

## Decisions

### D1: `ProjectPausedError` in contract (FR1)

**Decision:** New error type in `@clear-progress/contract`. `SupabaseSyncAdapter.invoke()` checks `error.context.status === 540` and throws `ProjectPausedError`.

**Rationale:** Separates "project paused" from generic error at the contract level. SyncProvider can react specifically.

### D2: `SyncStatus: "project_paused"` (FR2, FR3)

**Decision:** New value in `SyncStatus` enum.

**Rationale:** This is neither "error" nor "offline" — it's a distinct state with a specific cause. A separate status prevents starting a pointless ping interval.

### D3: Ping interval NOT started (FR3)

**Decision:** For `"project_paused"`, do NOT start ping interval. Periodic sync (setInterval every 5 minutes) continues running.

**Rationale:** Ping cannot wake a paused project. User must restore the project manually via Dashboard. After restore, periodic sync automatically picks up and returns to `"idle"`.

### D4: UI dialog (FR5)

**Decision:** `ProjectPausedDialog` based on `ConfirmDialog`. Title: "Supabase Project Paused". Buttons: [Open Dashboard] [Close]. Link: `https://supabase.com/dashboard/projects`.

**Rationale:** The issue requires user action → dialog, not toast. `ConfirmDialog` pattern already exists.

## Risks / Trade-offs

- [540 is a custom status, could change] → Unlikely, it's stable. If changed — update one line
- [Dashboard link is generic, no project ref] → Project ref is unknown from client config. User will select the project in Dashboard
