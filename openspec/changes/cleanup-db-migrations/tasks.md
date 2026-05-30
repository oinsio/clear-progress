# cleanup-db-migrations — Tasks

## 1. Simplify DB schema (FR1, FR2, FR3)

- [x] 1.1 Simplify `packages/client/src/db/schema.ts`: remove `DB_SCHEMA` (v2), `DB_SCHEMA_V4`, rename `DB_SCHEMA_V5` → `DB_SCHEMA`
- [x] 1.2 Simplify `packages/client/src/db/database.ts`: remove `V1_SCHEMA`, replace 9 versions with `version(1).stores(DB_SCHEMA)`, remove `SYNC_META_KEYS` import

## 2. Remove legacy migration (FR4, FR5)

- [x] 2.1 Delete file `packages/client/src/services/migrateLegacyConnection.ts`
- [x] 2.2 Remove import and call of `migrateLegacyConnection()` from `packages/client/src/main.tsx`
- [x] 2.3 Remove deprecated keys `GAS_URL`, `GOOGLE_CLIENT_ID`, `BACKEND_CONNECTED` from `STORAGE_KEYS` in `packages/client/src/constants/index.ts`
- [x] 2.4 Remove unused constant `DB_VERSION` from `packages/client/src/constants/index.ts`

## 3. Update tests

- [x] 3.1 Remove tests for `DB_VERSION` and `STORAGE_KEYS.GAS_URL` from `packages/client/src/constants/index.storage-db.test.ts`

## 4. Update documentation

- [x] 4.1 Remove "localStorage Migration" section and "Removed localStorage Keys" table from `docs/architecture/connection-config.md`

## 5. Verification

- [x] 5.1 `getDiagnostics` via JetBrains MCP for changed files
- [x] 5.2 `cd packages/client && npx vitest run` — all tests pass
- [x] 5.3 `pnpm run preflight` — all checks pass
- [x] 5.4 `pnpm run build` — project builds without errors
- [x] 5.5 `pnpm run lint:fix` — linter finds no issues
