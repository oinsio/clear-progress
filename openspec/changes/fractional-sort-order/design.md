## Context

`sort_order` is currently an integer, shared across all task views. Reorder operations update ALL records in the list (`bulkUpsert` with sequential 0,1,2...). New tasks get `sort_order = existingTasks.length`, landing unpredictably on filtered pages. Driven by FR1-FR10 from proposal.

## Goals / Non-Goals

**Goals:**
- Replace integer sort_order with fractional indexing string keys
- Achieve 1-record writes for all sort operations
- Migrate existing data without visible order changes

**Non-Goals:**
- Separate sort_order per view (NG1 from proposal)
- Backend (Supabase) migration in this change — backend accepts any value the client sends; column type change is a separate follow-up

## Decisions

### D1: Use `fractional-indexing` npm package

**Decision**: Use the `fractional-indexing` package for key generation. Functions: `generateKeyBetween(lower, upper)` and `generateNKeysBetween(lower, upper, n)`.

**Alternative**: Implement custom fractional indexing. Rejected — the package is ~1KB, well-tested, used by Figma-like tools, and handles edge cases (base62 encoding, key length optimization).

**Rationale**: FR1 requires lexicographically sortable keys. The package provides exactly this with no dependencies (FR1).

### D2: Tasks sort descending, non-task entities sort ascending

**Decision**: Tasks use `sort_order DESC` (higher key = top of list). Goals, ideas, categories, contexts, and checklist items use `sort_order ASC` (lower key = top of list, higher key = end).

**Alternative**: Uniform sort direction for all entities. Rejected — tasks need "insert at top" (FR3, FR4, FR5) which maps naturally to `generateKeyBetween(max, null)` + DESC. Non-task entities need "append to end" (FR8) which maps naturally to `generateKeyBetween(max, null)` + ASC. Both use the same generation call but interpret direction differently.

**Rationale**: Each entity type gets its natural insertion behavior with minimal logic (FR2, FR8).

### D3: Extract SortOrderService as shared utility

**Decision**: Create `SortOrderService` with methods:
- `generateInsertTopKey(existingKeys: string[]): string` — key above max (for tasks)
- `generateAppendKey(existingKeys: string[]): string` — key above max (for non-task entities; same generation, different sort direction makes it "end")
- `generateKeyBetween(lower: string | null, upper: string | null): string` — key between two neighbors (for drag-drop)
- `rebalanceKeys(count: number): string[]` — generate N evenly distributed keys
- `needsRebalancing(key: string): boolean` — check if key exceeds threshold

**Alternative**: Inline fractional-indexing calls in each service. Rejected — 6 entity services would duplicate the same logic, and rebalancing threshold would be scattered.

**Rationale**: Single source of truth for sort key logic. All entity services delegate to it (FR1, FR6, FR9).

### D4: Rebalancing threshold = 10 characters

**Decision**: When a newly generated key exceeds 10 characters, trigger lazy rebalancing of the affected scope (all tasks in the same box, all items of same type, or all checklist items of same task).

**Alternative**: Higher threshold (20 chars) or no rebalancing. 20 chars would never trigger in practice, making the feature dead code. No rebalancing is acceptable but leaves unbounded growth.

**Rationale**: 10 chars allows ~500+ insertions in the same slot before triggering. Rebalancing cost equals current integer approach (update all items in scope) but happens extremely rarely (FR9).

### D5: Client-side migration via Dexie upgrade

**Decision**: Add a Dexie version bump with an `upgrade()` handler that converts existing integer `sort_order` values to fractional indexing strings. For tasks (DESC): assign keys in reverse order so the task with `sort_order=0` (currently first) gets the highest key. For non-task entities (ASC): assign keys in natural order.

**Alternative**: Wipe and re-pull from server. Rejected — offline-first app must handle migration locally. Server column type change is out of scope (NG).

**Rationale**: Dexie's `upgrade()` runs once per version bump, handles the transition transparently (FR10).

### D6: Contract schema — sort_order becomes `z.union([z.number(), z.string()])`

**Decision**: During migration period, the Wire schemas in `@clear-progress/contract` accept both number and string for `sort_order`. This allows the client to send string keys while the Supabase backend still has INTEGER columns. The backend push RPC already casts `(v_rec->>'sort_order')::INTEGER` — this will need a separate backend migration later.

**Alternative**: Change to `z.string()` immediately. Rejected — breaks existing backend without coordinated deploy. The contract package is shared.

**Rationale**: Gradual migration. Client moves to strings, backend continues accepting integers via JSON text parsing. Backend migration is a separate change (FR1, FR10).

## Risks / Trade-offs

- [Risk] Backend Supabase columns are `INTEGER NOT NULL` — client sends string, `::INTEGER` cast will fail → **Mitigation**: Backend migration must happen before or alongside deploy. Mark as blocking dependency. Alternatively, backend can be updated to use `TEXT` column type in a new migration.
- [Risk] Sync conflict: client sends string sort_order, server returns integer on pull → **Mitigation**: Client normalizes pulled values (convert number to string if needed) during sync processing.
- [Trade-off] Rebalancing updates all items in scope (same as old integer approach) → Acceptable because it happens extremely rarely (<1% of operations).
- [Trade-off] Key strings use slightly more storage than integers → Negligible for list sizes under 1000.
