# cleanup-db-migrations

## Why

During development, 9 Dexie schema versions accumulated with 6 upgrade blocks, 4 intermediate schema definitions, a localStorage key migration file, and deprecated constants. The project is not in production and there are no real users with intermediate DB versions. This dead code increases cognitive load and slows codebase navigation.

## What Changes

- **REMOVED**: 8 of 9 Dexie schema versions and all `.upgrade()` blocks in `database.ts`
- **REMOVED**: Intermediate schemas `V1_SCHEMA`, `DB_SCHEMA` (v2), `DB_SCHEMA_V4` in `schema.ts`
- **REMOVED**: `migrateLegacyConnection.ts` file and its call in `main.tsx`
- **REMOVED**: Deprecated localStorage keys `GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED` from `STORAGE_KEYS`
- **REMOVED**: Unused constant `DB_VERSION`
- **MODIFIED**: `DB_SCHEMA_V5` renamed to `DB_SCHEMA` as the only active schema
- **MODIFIED**: `connection-config.md` documentation — removed localStorage migration section

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

No changes to existing capability requirements. All changes are internal restructuring with no behavior changes.

## Goals

- G1: Reduce migration code line count to zero
- G2: Keep a single DB version and a single schema

## Non-Goals

- NG1: Changing IndexedDB table structure or indexes
- NG2: Refactoring `menuOrderStore.ts` (resilient loading pattern, not migration)
- NG3: Changing the `isActive` field in connection config (part of current business logic)

## Requirements

### Functional

- FR1: DB is created with a single `version(1)` and the final `DB_SCHEMA`
- FR2: All 10 tables (tasks, goals, contexts, categories, checklist_items, ideas, settings, covers, pending_covers, sync_meta) are created with correct indexes
- FR3: All intermediate schema definitions and upgrade blocks are removed
- FR4: `migrateLegacyConnection.ts` file and its call at app startup are removed
- FR5: Deprecated localStorage keys are removed from `STORAGE_KEYS`

### Non-Functional

#### Performance

- NFR-P1: DB initialization is no slower than current (absence of 6 upgrade passes on empty tables)

## UX Acceptance Criteria

No UX changes — pure internal refactoring.

## Success Metrics

- M1: `database.ts` reduced from 132 to ~35 lines
- M2: `schema.ts` reduced from 41 to ~15 lines
- M3: ~260 lines of dead code removed (migrations + legacy connection + deprecated constants)
- M4: All existing tests pass without changes (except tests for removed artifacts)

## Impact

- `packages/client/src/db/database.ts` — full constructor rewrite
- `packages/client/src/db/schema.ts` — 3 of 4 exports removed
- `packages/client/src/services/migrateLegacyConnection.ts` — file deleted
- `packages/client/src/main.tsx` — migration import and call removed
- `packages/client/src/constants/index.ts` — deprecated keys and `DB_VERSION` removed
- `packages/client/src/constants/index.storage-db.test.ts` — tests for removed artifacts removed
- `docs/architecture/connection-config.md` — documentation updated

## Open Questions

No open questions.
