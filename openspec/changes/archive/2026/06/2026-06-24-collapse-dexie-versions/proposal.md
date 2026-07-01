# collapse-dexie-versions

## Why

After the previous cleanup (`cleanup-db-migrations`), two new Dexie migrations accumulated during development: v2 (covers → files rename + attachments) and v3 (integer → fractional sort_order). Since the project has no production users yet, carrying a v1→v2→v3 migration chain adds dead code and complexity. Collapsing to a single `version(1)` before the first release eliminates upgrade blocks that will never run in production.

## What Changes

- **REMOVED**: `schemaV1.ts` — intermediate schema with `covers`/`pending_covers` tables
- **REMOVED**: `sortOrderMigration.ts` + its test — integer→string sort_order conversion
- **REMOVED**: `version(2)` and `version(3)` upgrade blocks in `database.ts`
- **MODIFIED**: `database.ts` — single `version(1).stores(DB_SCHEMA)` without upgrade callbacks

## Goals

- **G1**: Zero intermediate migration code in the client DB layer
- **G2**: Single `version(1)` as the clean starting point for production

## Non-Goals

- **NG1**: Changing the IndexedDB table structure or indexes
- **NG2**: Touching server-side Supabase migrations (already clean)
- **NG3**: Refactoring surrounding code beyond migration removal

## Requirements

### Functional

- **FR1**: The client SHALL create IndexedDB via a single `version(1).stores(DB_SCHEMA)` with no upgrade callbacks
- **FR2**: The file `schemaV1.ts` SHALL be deleted
- **FR3**: The file `sortOrderMigration.ts` and its test `sortOrderMigration.test.ts` SHALL be deleted
- **FR4**: The `database.ts` constructor SHALL contain only `super(DB_NAME)` and `this.version(1).stores(DB_SCHEMA)`

## UX Acceptance Criteria

- **UX1**: Application starts normally on a fresh browser (no existing IndexedDB)
- **UX2**: All existing functionality works unchanged after the cleanup

## Success Metrics

- **M1**: `database.ts` contains exactly one `this.version()` call
- **M2**: No files named `schemaV1`, `sortOrderMigration` exist in the codebase
- **M3**: All unit and integration tests pass

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `cleanup-db-migrations`: Updating the spec to reflect the current final schema (11 tables with `files`, `pending_files`, `attachments` instead of `covers`, `pending_covers`)

## Impact

- `packages/client/src/db/database.ts` — simplified constructor
- `packages/client/src/db/schemaV1.ts` — deleted
- `packages/client/src/db/sortOrderMigration.ts` — deleted
- `packages/client/src/db/__tests__/sortOrderMigration.test.ts` — deleted
- Developers with existing IndexedDB must clear it manually (one-time)

## Open Questions

None.
