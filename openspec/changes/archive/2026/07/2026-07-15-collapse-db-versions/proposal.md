# Collapse IndexedDB Versions

## Why

The app is not in production, so there is no real user data to preserve on disk. Yet the Dexie schema still carries the full incremental history: a legacy `version(1)` with the old `needsSync` index, plus a `version(2)` and a runtime `upgrade()` migration that rewrites `needsSync → syncStatus`. This migration only exists to protect data that does not exist, and the dual schema (`DB_SCHEMA_V1` + `DB_SCHEMA_V2` + a deprecated `DB_SCHEMA` alias) adds dead code that degrades clarity and AI context quality. Collapsing to a single clean baseline now — before we ship — is free; doing it after launch would require a real migration.

## What Changes

- **REMOVED** the `version(2)` declaration and its `.upgrade()` migration callback that rewrote `needsSync → syncStatus`.
- **REMOVED** `DB_SCHEMA_V1` and the deprecated `DB_SCHEMA` alias, plus the obsolete `needsSync` index that only V1 used.
- **MODIFIED** the database definition to a single `version(1).stores(DB_SCHEMA)` using the current (`syncStatus`-based) schema as the sole baseline.
- **BREAKING** (developers only): a local IndexedDB already at version 2 cannot be down-declared to version 1 — Dexie throws `VersionError`. Existing local databases must be deleted. Acceptable because the app is pre-production and only developer/local databases exist.

## Capabilities

### New Capabilities
- `local-db-schema`: Defines how the IndexedDB (Dexie) database schema is declared — a single baseline version with no incremental migration history while the app is pre-production.

### Modified Capabilities
<!-- None. push-poison-pill-protection requires `syncStatus` semantics, not the V1→V2 migration mechanics; removing the migration changes no spec-level requirement. -->

## Impact

- **Code**: `packages/client/src/db/database.ts` (version declarations + upgrade callback), `packages/client/src/db/schema.ts` (schema exports).
- **Tests**: existing repository tests use `fake-indexeddb` with a fresh DB per run, so they exercise the baseline schema directly and must stay green. No test references `version(2)`, the migration, or `needsSync`.
- **Runtime**: `needsSync` has no remaining readers in `src/` — it lives only in `schema.ts` and `database.ts`. `syncStatus` (`RECORD_SYNC_STATUS`) remains the sole sync-state field.
- **Developers**: must clear their local IndexedDB (`clear-progress`) once, or the app will fail to open the DB after this change. No production users are affected.
- **No changes** to entity fields, sync push/pull semantics, ports/adapters, or UI.
