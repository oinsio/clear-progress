## Context

The pull flow (`SyncService._pull()` -> `pull/index.ts`) fetches all records with `revision > since_revision` in a single query per table. PostgREST silently truncates the result when `PGRST_DB_MAX_ROWS` is exceeded. Additionally, `push_records` assigns the same revision to all records in a single push batch — when the batch exceeds MAX_ROWS, the `gt`-based cursor cannot advance past the shared revision value, causing permanent data loss.

## Goals / Non-Goals

**Goals:**
- Per-table composite cursor keyset pagination in pull flow, resilient to any `PGRST_DB_MAX_ROWS` value and any revision distribution
- Crash-safe: interrupted pagination cycle does not lose data

**Non-Goals:**
- Server-side PAGE_SIZE (batch size determined by PostgREST)
- Pull performance optimization
- Eliminating minor duplicates for non-truncated tables during pagination (harmless, handled by upsert)

## Decisions

### D1: `has_more` via `count: "exact"` (FR1, FR4)

**Decision:** Server uses `select("*", { count: "exact" })` and determines `has_more = count > data.length`.

**Rationale:** `PGRST_DB_MAX_ROWS` is a PostgREST process variable, inaccessible to Edge Functions. Hardcoded PAGE_SIZE is dangerous: if `max_rows` is lower, PostgREST truncates and `data.length === PAGE_SIZE` yields false `has_more = false`. `count: "exact"` is the only reliable way to detect truncation.

**Alternatives rejected:** hardcoded PAGE_SIZE, `PGRST_DB_MAX_ROWS` as secret, Management API.

### D2: Composite cursor by `(revision, id)`, not single `revision` (FR2, FR9)

**Decision:** `ORDER BY revision ASC, id ASC`. Cursor = composite `{ revision, last_id }` per truncated table.

**Rationale:** `revision` is non-unique — `push_records` assigns the same revision to all records in a batch. A single `gt("revision", cursor)` cursor fails when more records share the same revision than MAX_ROWS. Adding `id` (UUID, unique) as tiebreaker creates a composite key `(revision, id)` that is unique per row, enabling correct keyset pagination regardless of revision distribution. This is the industry-standard best practice for cursor-based pagination with non-unique sort columns.

**Alternatives rejected:**
- Single `gt("revision", cursor)` — fails when >MAX_ROWS records share one revision (the bug we're fixing)
- Per-record revision in push — breaks other functionality that depends on batch-level revision semantics
- `gte` + client-side dedup — wastes bandwidth re-sending all records at cursor revision, complex dedup logic

### D3: Client does not know PAGE_SIZE (FR5)

**Decision:** Client only checks `has_more` and loops. Batch size is determined by PostgREST `max_rows`.

**Rationale:** No coupling to infrastructure. Protocol works with any `max_rows` without client changes.

### D4: `last_known_revision` saved only after `has_more === false` (FR6)

**Decision:**
```
let cursors = undefined;
do {
  response = pull({ since_revision, cursors })
  apply(response.entities)
  if (response.has_more) {
    since_revision = response.current_revision
    cursors = response.cursors
  }
} while (response.has_more)

save(LAST_KNOWN_REVISION, response.current_revision)
```

**Rationale:** On crash mid-cycle — client retries from last saved revision without cursors. All records are re-fetched from scratch. No data loss.

### D5: Per-table composite cursor for truncated tables (FR3, FR8, FR9)

**Decision:**
```
has_more = ANY table has count > data.length

// Response cursors: only for truncated tables
cursors = {}
for each table where count > data.length:
  cursors[table] = { revision: lastRow.revision, last_id: lastRow.id }

current_revision = has_more
  ? MIN(max_revision across tables with data)
  : next_revision - 1
```

Server-side query logic:
```
for each table:
  if request has cursor for this table:
    query.or('revision.gt.R,and(revision.eq.R,id.gt.ID)')
  else:
    query.gt('revision', since_revision)
  query.order('revision', asc).order('id', asc)
```

**Rationale:** Composite cursor `(revision, id)` creates a unique key per row, enabling deterministic keyset pagination. Only truncated tables need a cursor — non-truncated tables already returned all their data. Non-truncated tables may receive minor duplicates on subsequent pages (records between MIN(max_revision) and their actual max revision), but this is harmless — client applies via upsert by ID.

### D6: Parallel queries (FR1)

**Decision:** Queries to all tables execute in parallel (as currently).

**Rationale:** Pull only reads — FK constraints are not checked during SELECT. Client (Dexie) has no FK. Intermediate state is acceptable for offline-first (eventual consistency by design).

### D7: In-memory adapter composite cursor pagination (FR7)

**Decision:** In-memory adapter simulates pagination with configurable `maxRowsPerTable`. Supports composite cursor `(revision, id)` with `.or()` filter semantics. When `count > maxRows` — returns `has_more = true`, truncated data, and cursor for each truncated table.

**Rationale:** Contract tests must cover the composite cursor pagination loop, including the case where >MAX_ROWS records share the same revision.

### D8: Composite index for keyset pagination performance (FR10, NFR-P2)

**Decision:** Add composite index `(user_id, revision, id)` on all 7 entity tables via migration.

**Rationale:** PostgreSQL uses the composite index to seek directly to the cursor position in O(1), with no sorting or scanning needed. Without the index, the `.or()` filter would require a sequential scan. The index columns match both the WHERE clause and ORDER BY direction.

### D9: Settings excluded from cursor pagination

**Decision:** Settings table continues to use `updated_at`-based filtering, not revision-based pagination.

**Rationale:** Settings have no UUID `id` column (keyed by `user_id, key`) and don't use revision. They are already queried separately and excluded from `has_more` computation.

## Risks / Trade-offs

- [`count: "exact"` overhead] -> Minimal: COUNT on indexed WHERE (`user_id, revision`), parallel with main SELECT
- [Many round-trips with large datasets] -> Acceptable: only during initial sync or after extended offline. Network round-trip ~100ms, data transfer dominates
- [Minor duplicates for non-truncated tables] -> Harmless: client applies via upsert by ID, no data loss or corruption
- [Backward compatibility] -> Old clients without `cursors` behave as before — server falls back to `gt("revision", since_revision)` when no cursors in request
- [`.or()` filter complexity] -> PostgREST `.or()` with nested `and()` is well-documented and tested; composite index ensures performance
