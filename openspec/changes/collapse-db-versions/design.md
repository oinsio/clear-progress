## Context

The Dexie database (`packages/client/src/db/database.ts`) currently declares two schema versions:

- `version(1).stores(DB_SCHEMA_V1)` — the original schema, indexing a `needsSync` boolean.
- `version(2).stores(DB_SCHEMA_V2).upgrade(...)` — the current schema, indexing `syncStatus`, plus an `.upgrade()` callback (added by `fix-push-poison-pill`, FR6) that walks every entity table and rewrites `record.needsSync → record.syncStatus`.

`schema.ts` exports `DB_SCHEMA_V1`, `DB_SCHEMA_V2`, and a deprecated `DB_SCHEMA = DB_SCHEMA_V1` alias. The `needsSync` field has no remaining readers in `src/` — it survives only inside the schema/migration code. The app is pre-production: no real user has a persisted database, so the only databases at `version(2)` belong to developers.

This is driven by the proposal's goal of removing dead migration code before launch, while it is cheap to do so.

## Goals / Non-Goals

**Goals:**
- Reduce the database definition to a single `version(1)` baseline using the `syncStatus` schema (proposal FR1, FR4).
- Delete the `version(2)` upgrade migration (FR2).
- Collapse schema exports to a single `DB_SCHEMA` and drop the `needsSync` index (FR3).
- Keep all existing repository/sync behavior and tests green — zero behavioral change.

**Non-Goals:**
- No data migration for existing local databases — developers wipe and recreate (pre-production trade-off).
- No changes to entity fields, `RECORD_SYNC_STATUS` values, sync push/pull, ports, adapters, or UI.
- No renaming of stores or indexes beyond removing `needsSync`.

## Decisions

**D1 — Reuse the V2 schema shape as the single baseline, renamed to `DB_SCHEMA`.**
The current on-disk-correct schema is `DB_SCHEMA_V2`. Rather than invent a new object, rename it to `DB_SCHEMA` (replacing the deprecated alias) and delete `DB_SCHEMA_V1`/`DB_SCHEMA_V2`. `database.ts` then calls `this.version(1).stores(DB_SCHEMA)` with no `.upgrade()`.
- *Alternative considered*: keep `version(2)` as the only declaration (drop `version(1)`). Rejected — a fresh baseline should start at 1; a lone `version(2)` is confusing and still implies a missing predecessor.

**D2 — Accept the Dexie `VersionError` on down-declaration; document the manual wipe.**
Dexie refuses to open a database whose on-disk version (2) exceeds the max declared version (1), throwing `VersionError`. We will not add code to detect-and-delete the old DB, because it only affects a handful of developer machines and adding self-deleting logic is exactly the kind of throwaway migration code this change removes.
- *Alternative considered*: a one-time `Dexie.delete(DB_NAME)` guard when a `VersionError` is caught. Rejected as unnecessary complexity for a pre-production, developer-only scenario; documented in tasks instead.

**D3 — Verify via the existing test suite plus a focused schema test.**
Repository tests already run against `fake-indexeddb` with a fresh DB, so they implicitly assert the baseline schema works. Add/keep a small test asserting the DB opens at `verno === 1` and that a `syncStatus` query works, to lock the requirement. No new mutation surface is introduced beyond the schema constant.

## Risks / Trade-offs

- **Developer database at version 2 fails to open (`VersionError`)** → Documented one-time fix: delete the `clear-progress` IndexedDB (DevTools → Application → IndexedDB, or `indexedDB.deleteDatabase("clear-progress")`). Only affects local dev machines.
- **A future reader of git history loses the `needsSync → syncStatus` migration context** → The migration remains in the archived `fix-push-poison-pill` change and git history; only the live code path is removed.
- **Hidden reader of `needsSync` re-emerges** → Mitigated: grep confirms zero readers outside `schema.ts`/`database.ts`; the build (`tsc`) will fail if any typed reference remains.

## Migration Plan

1. Edit `schema.ts`: rename `DB_SCHEMA_V2 → DB_SCHEMA`, remove `DB_SCHEMA_V1` and the deprecated alias.
2. Edit `database.ts`: single `this.version(1).stores(DB_SCHEMA)`, delete the `version(2)` block and `.upgrade()` callback, update the import.
3. Run typecheck + affected repository tests + the schema test.
4. Rollback: `git revert` — no persisted-data implications since pre-production.

## Open Questions

<!-- None. -->
