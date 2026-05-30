# cleanup-db-migrations — Design

## Context

Dexie.js (IndexedDB ORM) supports schema versioning: each `version(N).stores(schema).upgrade(fn)` describes a schema and data migration for upgrading from the previous version. 9 versions accumulated during development. Since the project is not in production, there are no users who need the v1→v9 migration path. For a fresh install, Dexie creates the DB with the final schema anyway, but still runs all upgrade blocks on empty tables.

Additionally, `migrateLegacyConnection.ts` exists — a one-time migration of localStorage keys (`GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED`) into a single `CONNECTION_CONFIG`. These keys are not read anywhere else.

Context: driven by G1, G2 from proposal.

## Goals / Non-Goals

**Goals:**
- Remove all migration code (FR1-FR5)
- Minimize diff: remove dead code without refactoring surrounding code

**Non-Goals:**
- Optimizing IndexedDB table structure (NG1)
- Refactoring menuOrderStore (NG2)

## Decisions

### D1: Collapse all versions into `version(1)` without upgrade

**Decision**: A single `version(1).stores(DB_SCHEMA)` instead of the v1→v9 chain.

**Alternative**: Keep `version(9)` with the final schema (without intermediates). Rejected: no reason to start at v9 when there are no users on v1-v8. A clean start at v1 is simpler.

**Rationale**: Dexie ignores intermediate versions when creating a new DB — only the final schema matters. Upgrade blocks on empty tables are a no-op.

### D2: Rename `DB_SCHEMA_V5` → `DB_SCHEMA`

**Decision**: The single schema is exported as `DB_SCHEMA`.

**Rationale**: The version suffix is meaningless with a single schema. The name `DB_SCHEMA` was previously used (for v2), but the old export is deleted in this same change — no conflict.

### D3: Full removal of migrateLegacyConnection.ts

**Decision**: Delete the file, its call in `main.tsx`, and deprecated keys from `STORAGE_KEYS`.

**Rationale**: Confirmed via grep that `GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED` are only used in `migrateLegacyConnection.ts`. Active code (`connectionService.ts`, `AuthProvider`) works through `CONNECTION_CONFIG`.

### D4: Remove the `DB_VERSION` constant

**Decision**: Remove `DB_VERSION = 6` from constants — it is not used at runtime.

**Rationale**: The DB version is set in `database.ts` via `this.version(1)`. The `DB_VERSION` constant is not imported anywhere (except tests for the constant itself).

## Risks / Trade-offs

**[Risk] Existing DB in developer's browser** → When downgrading from v9 to v1, Dexie will see that the current version (9) is higher than the requested one (1) and refuse to open the DB. **Mitigation**: Developers must clear IndexedDB manually (DevTools → Application → IndexedDB → Delete database) or use incognito mode. This is a one-time action affecting only developers.

**[Risk] Archived changes reference deleted schemas** → The archive (`openspec/changes/archive/`) is immutable. References to `DB_SCHEMA_V4`/`DB_SCHEMA_V5` will remain in archived documents. **Mitigation**: This is expected — the archive reflects historical state.
