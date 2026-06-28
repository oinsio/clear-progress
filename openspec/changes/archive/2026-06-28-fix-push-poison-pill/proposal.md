# fix-push-poison-pill

## Why

A single invalid record in a push batch crashes the entire RPC (`push_records`) — all records remain `needsSync=true`, synchronization is blocked forever. Main scenario: device A purges a goal, device B (offline) creates a task with `goal_id` of that goal — on push, FK violation rolls back the ENTIRE transaction. The task with stale `goal_id` permanently blocks sync.

`push_records` RPC is a single transaction without per-record exception handling. FK `DEFERRABLE INITIALLY DEFERRED` is checked at COMMIT, not inside the loop. 19 cast points, 3 CHECK constraints, 5 NOT NULL, 6 FK, 1 PK — any can become a poison pill.

## What Changes

- **MODIFIED**: `needsSync: boolean` → `syncStatus: "synced" | "pending" | "rejected"` (client refactoring)
- **MODIFIED**: Wire schemas in contract — FK fields strengthened (`z.string()` → `z.union([UUIDSchema, z.literal("")])`)
- **ADDED**: Client-side Zod validation of outgoing payload before sending (layer 1)
- **MODIFIED**: RPC `push_records` — `SET CONSTRAINTS ALL IMMEDIATE` + per-record `BEGIN...EXCEPTION` (layer 2)
- **ADDED**: Purge — bump revision of dependent records when deleting parent (layer 3)
- **ADDED**: Client — handling `rejected` + self-healing + retry max 2 (layer 4)
- **ADDED**: UI — red border for rejected records + `SyncAlertDialog` for healable cases with data loss
- **ADDED**: Server-side logging of rejected records

## Goals

- G1: No single invalid record blocks synchronization of other records
- G2: Healable errors (stale FK, invalid formats) are corrected automatically
- G3: Unhealable errors (invalid enum, corrupted ID) are visible to user with recommendation

## Non-Goals

- NG1: Preventing creation of invalid records on client (separate change)
- NG2: Server-side `sync_rejected_log` table (overengineering at current scale)
- NG3: Changes to pull flow (separate change fix-pull-pagination)

## Users & Scenarios

- U1: Device A purges goal → device B (was offline) pushes task with stale goal_id → rejected → self-heal (goal_id="") → retry succeeds
- U2: Corrupted record in IndexedDB (invalid timestamp) → Zod catches → self-heal → push succeeds
- U3: Invalid box/status (old client version) → Zod catches → rejected → red border → user edits

## Requirements

### Functional

- FR1: Client validates each record via Zod Wire schema before sending; invalid records are processed locally (self-healing or rejected)
- FR2: Wire schema FK fields strengthened: `goal_id`, `context_id`, `category_id`, `original_task_id` — `z.union([UUIDSchema, z.literal("")])`
- FR3: RPC `push_records` uses `SET CONSTRAINTS ALL IMMEDIATE` and per-record `BEGIN...EXCEPTION WHEN OTHERS`; rejected records are returned with `status: "rejected"` and structured `reason`
- FR4: Purge bumps `revision` and `updated_at` of dependent records before deleting parent (goal → tasks.goal_id, context → tasks.context_id, etc.)
- FR5: Client handles `status: "rejected"` from server: healable — self-heal + retry (max 2); unhealable — `syncStatus: "rejected"`
- FR6: `needsSync: boolean` is replaced by `syncStatus: "synced" | "pending" | "rejected"` with Dexie migration
- FR7: UI shows red left border (`border-l-red-500`) for records with `syncStatus: "rejected"`
- FR8: UI shows `SyncAlertDialog` for healable corrections with data loss (stale FK in batch, lost name, etc.)
- FR9: Edge Function logs rejected records via `console.warn` with detailed information

### Non-Functional

#### Performance

- NFR-P1: Per-record exception handling in RPC does not degrade push performance for happy path (BEGIN...EXCEPTION without error — minimal overhead)

#### Accessibility

- NFR-A1: Red border and `SyncAlertDialog` are accessible to screen readers (aria-live, role="alert")

## UX Acceptance Criteria

- UX1: Rejected records are visible to user with red left border
- UX2: Editing a rejected record resets `syncStatus` to `"pending"` (amber border)
- UX3: Healable corrections with data loss show an informational dialog with description and recommendation
- UX4: Multiple dialogs are shown one at a time (`SyncAlertQueue`)

## UI States Matrix

| syncStatus | Border | Indicator | User action |
|------------|--------|-----------|-------------|
| `"synced"` | None | None | — |
| `"pending"` | `border-l-amber-400` | Amber | Wait for sync |
| `"rejected"` | `border-l-red-500` | Red | Edit or delete |

## Behavior

Scenarios are covered in integration tests and unit tests.

## Affected IA

No IA changes.

## Success Metrics

- M1: FK violation (stale goal_id) does not block sync — self-heal and retry succeed (integration test)
- M2: Corrupted fields are caught by client-side Zod validation before sending (unit test)
- M3: Unhealable records receive `syncStatus: "rejected"` and are visible in UI (integration test)
- M4: Purging a goal bumps revision of dependent tasks — other devices receive the update (integration test)

## Capabilities

### New Capabilities

- `push-poison-pill-protection`: Four-layer protection against poison pill in push (Zod validation, per-record RPC, purge bump, client self-healing)
- `sync-status-enum`: Refactoring `needsSync: boolean` → `syncStatus: "synced" | "pending" | "rejected"`
- `sync-alert-dialog`: UI components for displaying rejected records and informational dialogs

### Modified Capabilities

- `sync-protocol`: Push results handle `rejected` status with self-healing and retry
- `supabase-edge-functions`: Push Edge Function logs rejected records
- `supabase-schema`: RPC `push_records` with per-record exception handling + purge bump revision

## Impact

| Package | File | What changes |
|---------|------|-------------|
| `contract` | `src/wire/*.ts` | FK fields strengthened with Zod schema |
| `contract` | `src/protocol/push.ts` | `reason` in `PushItemResult` |
| `client` | All entity files (139 files) | `needsSync` → `syncStatus` |
| `client` | `src/services/SyncService.ts` | Zod validation outgoing + self-healing + retry |
| `client` | `src/components/` | Red border + SyncAlertDialog |
| `client` | `src/db/` | Dexie migration v2 |
| `adapter-supabase` | `supabase/functions/push/index.ts` | Zod validation + logging |
| `adapter-supabase` | `supabase/migrations/` | RPC per-record + purge bump |
| `adapter-inmemory` | `src/in-memory-sync-adapter.ts` | Rejected support for tests |
| `integration` | `src/tests/` | 6 integration test files |

## Open Questions

No open questions — all decisions documented in `push-poison-pill-decisions.md`.
