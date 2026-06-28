# Design: dedup-recurring-after-pull

## Context

Driven by FR1, FR2, FR4 from proposal. Two offline devices completing the same recurring task create copies with different UUIDs. Server accepts both (LWW by `updated_at` — different IDs = no conflict). Need a convergent deduplication strategy that works without server coordination.

## Decision

**Client-side deduplication after pull, deterministic winner selection.**

### Algorithm

After `_applyPullBatch()` completes, before dispatching `sync_complete`:

1. Query all non-completed, non-deleted tasks with `original_task_id != ""`
2. Group by `original_task_id`
3. For groups with more than one task: pick winner by `min(next_date)`, tiebreak by `min(id)` (lexicographic UUID comparison)
4. Soft-delete losers with cascade to checklist items
5. Mark soft-deleted records as `syncStatus: "pending"` for next push

### Why deterministic tiebreaker matters

Both devices must pick the same winner independently. `next_date` alone is insufficient — copies from the same `repeat_rule` produce identical `next_date`. UUID string comparison (`min(id)`) is stable and unique.

### Integration point

```
SyncService._pull()
  ├── loop: _applyPullBatch()
  ├── save revision
  ├── deduplicateRecurringTasks()   ← NEW, before event
  └── dispatch("sync_complete")     ← revealHiddenTasks listens here
```

This ordering ensures `revealHiddenTasks` never sees duplicates.

### Convergence proof

```
t0: A creates Copy-A, B creates Copy-B (offline)
t1: Both push → server has both
t2: A pulls → sees both → dedup → soft-deletes loser (e.g. Copy-B)
    A pushes soft-delete
t3: B pulls → receives soft-deleted Copy-B → only Copy-A remains

Even if both dedup before either pushes:
  Both select same winner (deterministic) → both soft-delete same loser
  → second push is idempotent (already deleted)
```

## Consequences

Positive:
- No server changes required
- Works with chunked push and offline
- Deterministic — no coordination needed
- Runs only when recurring tasks are in the pull batch (FR5)

Negative:
- Brief window where duplicates exist locally (between pull and dedup) — mitigated by running before `sync_complete`
- Soft-deleted duplicates consume space until purge — acceptable for low-frequency event

## Alternatives Considered

**Deterministic UUID (UUID v5 from original_task_id + next_date)**: Both devices generate the same ID, server upserts. Rejected: invasive change to ID generation strategy across the codebase; breaks assumption that IDs are random UUIDv4; `next_date` can change after creation.

**Server-side unique constraint on original_task_id**: Rejected: complex with chunked push (constraint checked per-chunk, not across chunks); doesn't work offline; requires server migration.

**Merge strategy in revealHiddenTasks**: Reveal only one, hide-delete rest. Rejected: doesn't clean up server state; duplicates remain on server indefinitely; reveals logic shouldn't have writing side effects.
