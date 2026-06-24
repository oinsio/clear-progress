# collapse-dexie-versions — Design

## Context

After the previous cleanup (`cleanup-db-migrations`, archived 2026-05-30), two new Dexie versions were added during development:

- **v2** (`add-file-attachments`): renamed `covers`→`files`, `pending_covers`→`pending_files`, added `attachments` table. Upgrade block copies data between renamed tables.
- **v3** (`fractional-sort-order`): converts `sort_order` from integer to fractional string. Upgrade block runs `upgradeSortOrderToFractional()` on all entity tables.

Neither migration will ever run in production — no users exist yet. The final schema (`DB_SCHEMA` in `schema.ts`) is already correct and used by both v2 and v3.

Context: driven by G1, G2 from proposal.

## Goals / Non-Goals

**Goals:**
- Collapse v1→v3 into a single `version(1)` with the current `DB_SCHEMA` (FR1, FR4)
- Delete dead migration files (FR2, FR3)

**Non-Goals:**
- Changing table structure or indexes (NG1)
- Touching Supabase migrations (NG2)

## Decisions

### D1: Collapse to `version(1)` without upgrade blocks

**Decision**: Replace the three-version chain with `this.version(1).stores(DB_SCHEMA)`.

**Alternative**: Keep `version(3)` as the starting version. Rejected: same reasoning as the previous cleanup — no reason to start at v3 when there are no users on v1 or v2.

**Rationale**: Dexie only uses the final schema for fresh DB creation. All upgrade blocks are dead code for new installations.

### D2: Delete `schemaV1.ts` entirely

**Decision**: Remove `schemaV1.ts`. The only consumer is `database.ts` in the `version(1).stores(DB_SCHEMA_V1)` call, which is being removed.

**Rationale**: `DB_SCHEMA_V1` describes an obsolete schema with `covers`/`pending_covers` tables that no longer exist in the data model.

### D3: Delete `sortOrderMigration.ts` and its test

**Decision**: Remove `sortOrderMigration.ts` and `__tests__/sortOrderMigration.test.ts`. The only consumer is the `version(3)` upgrade block in `database.ts`.

**Rationale**: The migration converts integer sort_order to fractional strings. With no production users, there is no data to migrate. The current schema already defines sort_order as string-indexed.

## Risks / Trade-offs

**[Risk] Existing IndexedDB in developer browsers** → When downgrading from v3 to v1, Dexie will refuse to open the database because the stored version (3) exceeds the requested version (1). **Mitigation**: Developers clear IndexedDB once via DevTools (Application → IndexedDB → Delete database). Same mitigation as the previous cleanup.
