## Context

The pull flow (`SyncService._pull()` → `pull/index.ts`) fetches all records with `revision > since_revision` in a single query per table. PostgREST silently truncates the result when `PGRST_DB_MAX_ROWS` is exceeded. The client saves `last_known_revision` after a single response — lost records will never be re-fetched.

Decisions are documented in `pull-pagination-decisions.md` (D1–D8). This document captures architectural decisions in design.md format.

## Goals / Non-Goals

**Goals:**
- Cursor-based pagination in pull flow, resilient to any `PGRST_DB_MAX_ROWS` value
- Crash-safe: interrupted pagination cycle does not lose data

**Non-Goals:**
- Server-side PAGE_SIZE (batch size determined by PostgREST)
- Pull performance optimization

## Decisions

### D1: `has_more` via `count: "exact"` (FR1, FR4)

**Decision:** Server uses `select("*", { count: "exact" })` and determines `has_more = count > data.length`.

**Rationale:** `PGRST_DB_MAX_ROWS` is a PostgREST process variable, inaccessible to Edge Functions. Hardcoded PAGE_SIZE is dangerous: if `max_rows` is lower, PostgREST truncates and `data.length === PAGE_SIZE` yields false `has_more = false`. `count: "exact"` is the only reliable way to detect truncation.

**Alternatives rejected:** hardcoded PAGE_SIZE, `PGRST_DB_MAX_ROWS` as secret, Management API.

### D2: Cursor by `revision`, not offset (FR2)

**Decision:** `ORDER BY revision ASC`, cursor = `current_revision` from previous batch.

**Rationale:** `revision` already monotonically increases and is indexed. Cursor is O(1) by depth, offset degrades. Resilient to inserts — no duplicates or gaps.

### D3: Client does not know PAGE_SIZE (FR5)

**Decision:** Client only checks `has_more` and loops. Batch size is determined by PostgREST `max_rows`.

**Rationale:** No coupling to infrastructure. Protocol works with any `max_rows` without client changes.

### D4: `last_known_revision` saved only after `has_more === false` (FR6)

**Decision:**
```
do {
  response = pull(since_revision)
  apply(response.entities)
  since_revision = response.current_revision
} while (response.has_more)

save(LAST_KNOWN_REVISION, response.current_revision)
```

**Rationale:** On crash mid-cycle — client retries from last saved revision. No data loss.

### D5: Single cursor across all tables, `MIN` when `has_more` (FR3)

**Decision:**
```
has_more = ANY table has count > data.length
current_revision = has_more
  ? MIN(max_revision across tables with data)
  : next_revision - 1
```

**Rationale:** Cursor must be unified, otherwise tables diverge. `MIN`, not `MAX` — to avoid skipping records from a table with a lower max_revision in the batch.

### D6: Parallel queries (FR1)

**Decision:** Queries to all tables execute in parallel (as currently).

**Rationale:** Pull only reads — FK constraints are not checked during SELECT. Client (Dexie) has no FK. Intermediate state is acceptable for offline-first (eventual consistency by design).

### D7: In-memory adapter pagination (FR7)

**Decision:** In-memory adapter simulates pagination with configurable `maxRowsPerTable`. When `count > maxRows` — returns `has_more = true` and truncated data.

**Rationale:** Contract tests must cover the pagination loop.

## Risks / Trade-offs

- [`count: "exact"` overhead] → Minimal: COUNT on indexed WHERE (`user_id, revision`), parallel with main SELECT
- [Many round-trips with large datasets] → Acceptable: only during initial sync or after extended offline. Network round-trip ~100ms, data transfer dominates
- [Backward compatibility] → Old clients without `has_more` behave as before — no worse than current
