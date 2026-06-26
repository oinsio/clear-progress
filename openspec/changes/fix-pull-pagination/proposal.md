# fix-pull-pagination

## Why

Supabase PostgREST limits responses to `PGRST_DB_MAX_ROWS` (default 1000) rows per request. The Edge Function `pull/index.ts` calls `select("*")` without `.limit()` / `.range()` — PostgREST silently truncates the result. The client (`SyncService._pull`) unconditionally saves `last_known_revision = pullResponse.current_revision` — records not included in the truncated response are **permanently lost**.

With >1000 rows in any table (realistic for `tasks` during first pull on a new device), the bug causes silent data loss.

## What Changes

- **ADDED**: Cursor-based pagination in pull flow using `count: "exact"` to determine `has_more`
- **MODIFIED**: `PullResponse` — new field `has_more: boolean`
- **MODIFIED**: Server pull — `select("*", { count: "exact" })`, `.order("revision")`, computation of `has_more` and `current_revision` via `MIN(max_revision)` on truncation
- **MODIFIED**: Client `SyncService._pull()` — `do/while` loop, revision saved only after `has_more === false`
- **MODIFIED**: In-memory adapter — pagination support for contract tests

## Goals

- G1: Eliminate silent data loss during pull when record count exceeds `PGRST_DB_MAX_ROWS`
- G2: Correct synchronization of all records regardless of `max_rows` value (50, 1000, 100000)

## Non-Goals

- NG1: Changes to push flow (separate change)
- NG2: Pull performance optimization (sufficient for now)
- NG3: Explicit server PAGE_SIZE — batch size is determined by PostgREST `max_rows`

## Users & Scenarios

- U1: User with >1000 tasks during first pull on a new device — all records must arrive
- U2: User with large dataset during incremental pull after extended offline — no records lost
- U3: Sync interruption mid-pagination cycle (crash/disconnect) — no data loss on next sync

## Requirements

### Functional

- FR1: Server uses `select("*", { count: "exact" })` for all tables in pull and determines `has_more = count > data.length` for at least one table
- FR2: Server returns data ordered by `ORDER BY revision ASC`
- FR3: When `has_more = true`, server returns `current_revision = MIN(max_revision)` across tables containing data; when `has_more = false` — `next_revision - 1`
- FR4: `PullResponse` contains field `has_more: boolean`
- FR5: Client executes a `do/while(has_more)` loop, using `current_revision` from the previous batch as `since_revision` for the next request
- FR6: Client saves `last_known_revision` **only** after `has_more === false`
- FR7: In-memory adapter supports pagination for contract tests

### Non-Functional

#### Performance

- NFR-P1: `count: "exact"` does not degrade performance — COUNT executes on indexed WHERE (`user_id, revision`)

## UX Acceptance Criteria

- UX1: User sees no difference in UI behavior — pagination is transparent

## Behavior

Pull pagination scenarios are covered in contract tests and integration tests.

## Affected IA

No IA changes.

## Success Metrics

- M1: Pull correctly fetches all records when count >1000 in a single table (integration test)
- M2: Interrupted pagination cycle does not cause data loss (integration test)
- M3: Backward compatible — clients without `has_more` support behave no worse than current

## Capabilities

### New Capabilities

- `pull-pagination`: Cursor-based pagination for pull flow with `has_more` and `count: "exact"` support

### Modified Capabilities

- `sync-protocol`: Pull response extended with `has_more` field, client implements pagination loop
- `adapter-inmemory`: In-memory adapter supports pagination
- `supabase-edge-functions`: Pull Edge Function uses `count: "exact"` and `ORDER BY revision`

## Impact

| Package | File | What changes |
|---------|------|-------------|
| `contract` | `src/protocol/pull.ts` | `has_more: boolean` in `PullResponse` |
| `adapter-supabase` | `supabase/functions/pull/index.ts` | `select("*", { count: "exact" })`, `.order("revision")`, `has_more` and `current_revision` computation |
| `client` | `src/services/SyncService.ts` | `_pull()`: `do/while` loop, revision saved only after `has_more === false` |
| `adapter-inmemory` | `src/in-memory-sync-adapter.ts` | Pagination for contract tests |
| `contract` | `tests/contracts/` | Tests for >max_rows records |
| `integration` | `src/tests/` | Integration tests with real Supabase |

## Open Questions

No open questions — all decisions documented in `pull-pagination-decisions.md`.
