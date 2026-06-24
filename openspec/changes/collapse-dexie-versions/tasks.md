## 1. Delete dead migration files (FR2, FR3)

- [ ] 1.1 Delete `packages/client/src/db/schemaV1.ts` (FR2)
- [ ] 1.2 Delete `packages/client/src/db/sortOrderMigration.ts` (FR3)
- [ ] 1.3 Delete `packages/client/src/db/__tests__/sortOrderMigration.test.ts` (FR3)

## 2. Collapse database versions (FR1, FR4)

- [ ] 2.1 Simplify `database.ts` constructor: single `this.version(1).stores(DB_SCHEMA)`, remove `DB_SCHEMA_V1` import and `upgradeSortOrderToFractional` import (FR1, FR4)

## 3. Verification

- [ ] 3.1 Run `pnpm run build` — verify no broken imports or type errors (M3)
- [ ] 3.2 Run client unit tests `cd packages/client && npx vitest run` — all pass (M3)
- [ ] 3.3 Verify `database.ts` contains exactly one `this.version()` call (M1)
- [ ] 3.4 Verify no files named `schemaV1` or `sortOrderMigration` exist in the codebase (M2)
