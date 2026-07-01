## Context

`push_records` RPC is a single PostgreSQL transaction without per-record exception handling. Any error (FK, CHECK, cast) rolls back all records. FK `DEFERRABLE INITIALLY DEFERRED` is checked at COMMIT, not inside the loop. Main scenario: stale FK after purge on another device. Decisions documented in `push-poison-pill-decisions.md`.

## Goals / Non-Goals

**Goals:**
- Four-layer protection: client Zod validation → per-record RPC → purge bump → client self-healing
- Refactoring `needsSync → syncStatus` to support `rejected` state

**Non-Goals:**
- Preventing creation of invalid records (prevention vs cure)
- Server-side rejected log table

## Decisions

### D1: Client-side Zod validation of outgoing payload (FR1, FR2)

**Decision:** Validate each record via `WireTaskSchema.safeParse()` before sending. Invalid records are processed locally.

**Rationale:** Zod schemas already exist in contract but are only used for response validation. Applying them to outgoing payload covers classes 1 (cast), 2 (CHECK), 3 (NOT NULL) without RPC changes.

**Wire schema strengthening:** `goal_id: z.string()` → `z.union([UUIDSchema, z.literal("")])` for all FK fields.

### D2: RPC per-record exception handling (FR3)

**Decision:** `SET CONSTRAINTS ALL IMMEDIATE` + `BEGIN...EXCEPTION WHEN OTHERS` per record.

**Rationale:** `SET CONSTRAINTS ALL IMMEDIATE` switches deferred FK to immediate checking inside the loop. Dependency order (contexts → categories → goals → tasks → checklist_items) is already maintained in the RPC. Rejected records are returned with `status: "rejected"` and structured `reason` (e.g., `fk_violation:goal_id`).

**Alternatives rejected:** SAVEPOINT per record (heavier, not needed for this pattern).

### D3: Purge bumps revision of dependent records (FR4)

**Decision:** Before deleting in purge — update FK = NULL, `revision = next_rev`, `updated_at = NOW()` on dependent records.

**Rationale:** `ON DELETE SET NULL` nullifies FK but does not bump revision — other devices don't learn about the nullification. Bumping revision ensures delivery via pull.

### D4: Self-healing + retry (FR5)

**Decision:** Healable cases (stale FK, invalid formats) — auto-correct + `syncStatus: "pending"` + retry (max 2). Unhealable (invalid enum, corrupted ID) — `syncStatus: "rejected"`.

**Rationale:** Unblocks sync, provides user feedback. Retry limit prevents infinite loops.

### D5: `needsSync: boolean` → `syncStatus: enum` (FR6)

**Decision:** `syncStatus: "synced" | "pending" | "rejected"`.

**Rationale:** Two boolean fields would create an invalid combination. Enum — three clear states, one field. Wire types are unaffected (needsSync is a client-only field). Dexie migration v2.

### D6: UI for rejected (FR7, FR8)

**Decision:** Red border `border-l-red-500` for rejected records. `SyncAlertDialog` for healable corrections with data loss. `SyncAlertQueue` for showing multiple dialogs sequentially.

### D7: Server-side logging (FR9)

**Decision:** `console.warn` in Edge Function. Format: `[push] User abc123: N records rejected` + details.

## Risks / Trade-offs

- [523 occurrences of needsSync in 139 files] → Mechanical find-and-replace, but requires careful verification
- [Per-record exception overhead] → Minimal for happy path (BEGIN...EXCEPTION without error)
- [Self-healing may mask problems] → Server-side logging + dialogs for cases with data loss
- [`SET CONSTRAINTS ALL IMMEDIATE` affects entire transaction] → Acceptable since dependency order is maintained
