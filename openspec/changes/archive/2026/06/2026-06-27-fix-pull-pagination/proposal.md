# fix-pull-pagination

## Why

Supabase PostgREST limits responses to `PGRST_DB_MAX_ROWS` rows per request. The Edge Function `pull/index.ts` uses `gt("revision", sinceRevision)` as cursor — but `push_records` assigns a single revision to all records in one push batch. When a batch contains more records than `PGRST_DB_MAX_ROWS`, the `gt`-cursor cannot advance past the shared revision value, and remaining records are permanently lost.

With >MAX_ROWS records sharing the same revision (realistic during bulk push or initial sync), the bug causes silent data loss.

## What Changes

- **ADDED**: Per-table composite cursor `(revision, id)` for deterministic keyset pagination
- **ADDED**: Composite index `(user_id, revision, id)` on all entity tables
- **MODIFIED**: `PullRequest` — new optional field `cursors` with per-table composite cursor
- **MODIFIED**: `PullResponse` — new fields `has_more: boolean` and `cursors` for truncated tables
- **MODIFIED**: Server pull — `select("*", { count: "exact" })`, `ORDER BY revision, id`, composite `.or()` filter for tables with cursor
- **MODIFIED**: Client `SyncService._pull()` — `do/while` loop with cursors passthrough, revision saved only after `has_more === false`
- **MODIFIED**: In-memory adapter — composite cursor pagination support for contract tests

## Goals

- G1: Eliminate silent data loss during pull when records with the same revision exceed `PGRST_DB_MAX_ROWS`
- G2: Correct synchronization of all records regardless of `max_rows` value and revision distribution

## Non-Goals

- NG1: Changes to push flow (revision assignment stays as-is)
- NG2: Pull performance optimization (sufficient for now)
- NG3: Explicit server PAGE_SIZE — batch size is determined by PostgREST `max_rows`
- NG4: Eliminating duplicate records across pagination pages for non-truncated tables — harmless, handled by client upsert

## Users & Scenarios

- U1: User with >MAX_ROWS tasks sharing the same revision during pull — all records must arrive
- U2: User with large dataset during incremental pull after extended offline — no records lost
- U3: Sync interruption mid-pagination cycle (crash/disconnect) — no data loss on next sync

## Requirements

### Functional

- FR1: Server uses `select("*", { count: "exact" })` for all entity tables in pull and determines `has_more = true` when `count > data.length` for ANY table
- FR2: Server returns data ordered by `ORDER BY revision ASC, id ASC` (composite sort for deterministic keyset pagination)
- FR3: When `has_more = true`, server returns `current_revision = MIN(max_revision)` across tables with data AND `cursors` object containing `{ revision, last_id }` for each truncated table. When `has_more = false` — `current_revision = next_revision - 1`, no cursors
- FR4: `PullResponse` contains fields `has_more: boolean` and optional `cursors: Record<string, { revision: number; last_id: string }>`
- FR5: Client executes a `do/while(has_more)` loop, passing `cursors` from previous response to next request and using `current_revision` as `since_revision`
- FR6: Client saves `last_known_revision` **only** after `has_more === false`
- FR7: In-memory adapter supports composite cursor pagination for contract tests
- FR8: `PullRequest` extends with optional `cursors: Record<string, { revision: number; last_id: string }>` field
- FR9: Server uses composite `.or()` filter for tables that have a cursor in the request: `revision.gt.R,and(revision.eq.R,id.gt.ID)`. Tables without a cursor use standard `gt("revision", since_revision)`
- FR10: Migration adds composite index `(user_id, revision, id)` on all entity tables for keyset pagination performance

### Non-Functional

#### Performance

- NFR-P1: `count: "exact"` does not degrade performance — COUNT executes on indexed WHERE (`user_id, revision`)
- NFR-P2: Composite index `(user_id, revision, id)` enables O(1) seek for keyset pagination at any depth

## UX Acceptance Criteria

- UX1: User sees no difference in UI behavior — pagination is transparent

## Behavior

Pull pagination scenarios are covered in contract tests and integration tests.

## Affected IA

No IA changes.

## Success Metrics

- M1: Pull correctly fetches all records when >MAX_ROWS records share the same revision (integration test with single-batch push)
- M2: Interrupted pagination cycle does not cause data loss (integration test)
- M3: Backward compatible — clients without `cursors` support behave no worse than current

## Capabilities

### New Capabilities

- `pull-pagination`: Per-table composite cursor keyset pagination for pull flow with `has_more`, `cursors`, and `count: "exact"` support

### Modified Capabilities

- `sync-protocol`: Pull request/response extended with `cursors` field, client implements pagination loop with cursor passthrough
- `adapter-inmemory`: In-memory adapter supports composite cursor pagination
- `supabase-edge-functions`: Pull Edge Function uses `count: "exact"`, `ORDER BY revision, id`, and composite `.or()` filter

## Impact

| Package            | File                               | What changes                                                                                                         |
|--------------------|------------------------------------|----------------------------------------------------------------------------------------------------------------------|
| `contract`         | `src/protocol/pull.ts`             | `has_more`, `cursors` in `PullResponse`; `cursors` in `PullRequest`                                                  |
| `adapter-supabase` | `supabase/functions/pull/index.ts` | `select("*", { count: "exact" })`, `.order("revision").order("id")`, composite `.or()` filter, `cursors` in response |
| `adapter-supabase` | `supabase/migrations/`             | Composite index `(user_id, revision, id)` on all entity tables                                                       |
| `client`           | `src/services/SyncService.ts`      | `_pull()`: `do/while` loop with cursors passthrough, revision saved only after `has_more === false`                  |
| `adapter-inmemory` | `src/in-memory-sync-adapter.ts`    | Composite cursor pagination for contract tests                                                                       |
| `contract`         | `tests/contracts/`                 | Tests for >max_rows records with same revision                                                                       |
| `integration`      | `src/tests/`                       | Integration tests with single-batch push (no workaround)                                                             |

## Open Questions

No open questions — all decisions documented in `design.md` (D1-D9).
