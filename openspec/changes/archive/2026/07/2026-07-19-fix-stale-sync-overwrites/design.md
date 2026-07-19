# Design: fix-stale-sync-overwrites

## Context

Driven by FR1-FR6 from proposal. A confirmed multi-device bug: completing + editing a recurring task on device A, then opening a stale device B, resurrects the completed occurrence with the old description everywhere. The causal chain (verified in code):

1. `HiddenTaskService.revealHiddenTasks()` refreshes `updated_at` + sets `pending` on device B's stale copy — a system mutation masquerading as a user edit.
2. Binary pull protection (`TaskRepository.applyServerRecords`: skip any `pending` local) preserves the stale copy against the newer server state.
3. Push LWW (`>=` client wins) lets the freshened stale copy overwrite the completed, newer record on the server.
4. `RecurringTaskDeduplicator` keeps the earliest-`next_date` copy verbatim and soft-deletes the copy carrying the user's newest edits; the deletion propagates.

`TaskService.rebalanceBox()` is a second instance of the same class: it freshens `updated_at` + `pending` for every task in a box (hidden recurring clones included — `getByBox` filters only `is_deleted`).

Constraint: manual hide/unhide (`TaskQuickActions`, `TaskDetailsTab` → `TaskService.update`) are genuine user edits and must keep syncing exactly as today. Recurrence math (`calculateNextDate`) reads only `repeat_rule`, `completed_at`, previous `next_date`, and the clock — it never reads `updated_at`, so timestamp changes cannot affect either recurring model.

## Goals / Non-Goals

**Goals**
- One enforced invariant: *system-initiated mutations never refresh `updated_at`; only user actions do.* They may still set `syncStatus: "pending"` to propagate.
- Make pull protection LWW-consistent with push, so a future violation of the invariant degrades gracefully instead of corrupting data.
- Dedup merges instead of discarding the newest content.

**Non-Goals** (see proposal NG1-NG5): no server changes, no CRDT/field-level merge, no clock-skew handling, no UI changes.

## Decisions

### D1. Auto-reveal: `pending` without `updated_at` refresh (FR1)

`revealHiddenTasks` writes `is_hidden: false, syncStatus: "pending"` and preserves the record's existing `updated_at`.

Convergence: on push, if the server has no newer state, timestamps tie and the client wins (`>=`) — the reveal reaches the server. If the server is newer (real edit elsewhere), the server wins, returns `conflict`, and the client adopts the newest state. Either way LWW stays honest.

*Alternatives rejected:*
- **Derive `is_hidden` at read time, never sync it** — cannot express manual unhide before `appear_date` (a synced user intent) nor indefinite hides (`appear_date = ""`), both of which exist today.
- **Don't sync reveal at all (local flip, stay `synced`)** — server keeps `is_hidden=true` forever; every pull of that record re-hides it, causing flicker and repeated writes.

### D2. Rebalance: same invariant (FR4)

`rebalanceBox` assigns keys + `pending` with timestamps untouched; `reorderTasks` keeps refreshing `updated_at` for the dragged task only.

Consequence accepted: when a rebalanced record loses push LWW to a newer server edit, the box ends up with keys from two generations. Order stays deterministic; the next drag re-triggers rebalancing. This is cosmetic and rare (keys > 10 chars).

*Alternatives rejected:*
- **Local-only rebalance (no sync)** — the next real edit of any task would push its local key into a foreign key-grid on other devices → wandering order with no upside.
- **Lazy per-task rebalance on next real edit** — rebalancing stops doing its job (shortening keys now); complexity without benefit.

### D3. Dedup merge (FR3)

Winner selection is unchanged (earliest `next_date`, tiebreak by `id`). The winner record is then merged:

| Fields                                                                               | Source copy                                      |
|--------------------------------------------------------------------------------------|--------------------------------------------------|
| `next_date`, `appear_date`, `is_hidden` (always as a triple)                         | earliest `next_date`                             |
| `name`, `description`, `goal_id`, `context_id`, `category_id`                        | freshest `updated_at`                            |
| `box`, `sort_order` (as a pair — sort keys are per-box grids)                        | freshest `updated_at`                            |
| `id`, `created_at`, `revision` (identity/bookkeeping)                                | winner's own                                     |
| `updated_at`                                                                         | freshest copy's value — **not** refreshed to now |
| `repeat_rule` differs between the schedule winner and the freshest-`updated_at` copy | freshest copy wins **wholesale**, dates included |

`is_hidden` travels with the schedule triple because it is derived from that copy's `appear_date` (hidden iff not yet due); pairing it with another copy's dates would break reveal timing. `sort_order` travels with `box` because sort keys only order within a box. Completion fields need no rule: every copy in a duplicate group is non-completed by the group filter.

Rationale for the wholesale clause: a rule change recomputes `next_date`/`appear_date` under the new rule (`useRepeatRuleChangeDialog`); pairing old-rule dates with a new rule is incoherent, especially across a `fixed` ↔ `after_completion` switch.

If the merge changed the stored winner, it is written with `syncStatus: "pending"` (its `updated_at` is the freshest copy's — honest under LWW). Loser soft-deletion behaves as today. Checklist items: keep today's behavior (winner keeps its own items; losers' items are cascade-soft-deleted).

### D4. Pull protection becomes LWW (FR5)

In every repository's `applyServerRecords`: a local `pending` record is overwritten iff `server.updated_at > local.updated_at` (strict), then marked `synced`. Equal-or-newer local wins locally and pushes later — the mirror of the server's `>=` client-wins rule, so both sides agree on every ordering. Overwrites of pending records are logged (`console.warn` with entity type, id, both timestamps) per the existing "log conflicts for debugging" sync rule.

No new data loss: a pending record older than the server copy already loses at push (`conflict` → server record applied); this only resolves the same outcome earlier and keeps UI from showing stale data between pull and push.

Timestamp comparison uses `Temporal.Instant.compare`, not string comparison.

### D5. Test architecture

- **Unit BDD (vitest-cucumber)** per feature file listed in the proposal; steps drive real services over `fake-indexeddb` with `fakeClock`.
- **Integration (`packages/integration`)**: two-device simulation = two isolated browser contexts (separate IndexedDB origins/storage states) against one real backend (Testcontainers). Scenarios: U1 (the reported bug end-to-end, both recurring models), U2 (manual unhide propagation), U3 (rebalance on stale device), plus NFR-REL1 convergence assertion (dump both devices' stores + server tables, compare).
- **Mutation testing** scoped to changed files (max 5 per run, sequential).

## Risks / Trade-offs

- [Reveal push with old timestamp hits `>=` tie → client wins with an *unchanged* timestamp; server revision bumps but `updated_at` doesn't] → acceptable: content is identical except `is_hidden`; other devices reveal locally anyway.
- [Pending record protected by equal timestamp could ping-pong between devices] → both devices produce identical records for tie cases (reveal/rebalance of the same base revision); pushes converge because content is equal.
- [Two-generation sort keys after partial rebalance loss] → cosmetic, self-heals on next rebalance (D2).
- [Clock skew between devices affects strict `>` pull comparison] → same exposure as existing push LWW; explicitly out of scope (NG3).
- [Dedup merge writes a record whose field combination existed on no device] → limited to content-vs-schedule split with the pair rule and wholesale rule (D3); integration tests assert coherence.
- [`applyServerRecords` changes touch every entity repository] → shared helper + contract-style test suite run against each repository to avoid divergence.

## Migration Plan

Client-only, no schema or server changes. Ships as one release; no data migration. Rollback = revert. Records already corrupted by the old behavior are not retroactively repaired (out of scope); the fix prevents new corruption.

## Open Questions

(none)
