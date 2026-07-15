## 1. Lock baseline behavior with a test

- [x] 1.1 Add `src/db/database.test.ts` (using `fake-indexeddb`) asserting: DB opens at `db.verno === 1`; a record written with `syncStatus` is retrievable via the `syncStatus` index; all 11 stores exist. Verifies FR1/FR4 of collapse-db-versions. Run `npx vitest run src/db/database.test.ts` — RED where it references the single `DB_SCHEMA` export not yet renamed (or GREEN on verno if written against current state; then confirm it stays GREEN after step 2/3).

## 2. Collapse the schema module

- [x] 2.1 In `src/db/schema.ts`: rename `DB_SCHEMA_V2` → `DB_SCHEMA` (the sole export). Remove `DB_SCHEMA_V1`, the deprecated `DB_SCHEMA = DB_SCHEMA_V1` alias, and any `needsSync` index. Implements FR3.
- [x] 2.2 Confirm no remaining references to `DB_SCHEMA_V1` / `DB_SCHEMA_V2` / `needsSync` in `src/` (`grep -rn "DB_SCHEMA_V1\|DB_SCHEMA_V2\|needsSync" src`).

## 3. Collapse the database definition

- [x] 3.1 In `src/db/database.ts`: change the import to the single `DB_SCHEMA`. Replace the two version blocks with one `this.version(1).stores(DB_SCHEMA);`. Delete the `version(2)` declaration and its `.upgrade()` migration callback. Implements FR1, FR2, FR4.
- [x] 3.2 Remove the now-unused `RECORD_SYNC_STATUS` import from `database.ts` if it was only used by the migration.

## 4. Verify

- [x] 4.1 `get_file_problems` (JetBrains MCP) on `schema.ts`, `database.ts`, `database.test.ts` — fix any errors.
- [x] 4.2 `pnpm run build` (typecheck must pass; catches any stray typed reader of `needsSync`/`DB_SCHEMA_V*`).
- [x] 4.3 `npx vitest run src/db/database.test.ts` — GREEN.
- [x] 4.4 Run the repository test suite touching the DB (`npx vitest run src/db/repositories`) — all GREEN, confirming zero behavioral change. Run STRICTLY one command at a time.
- [x] 4.5 Mutation-test the changed files: `cd packages/client && npx stryker run --mutate 'src/db/schema.ts,src/db/database.ts'`; read `reports/mutation/mutation-report.json`; add tests to kill survivors (target ≥95%, min ≥90%).

## 5. Document the developer wipe

- [x] 5.1 Note in the change (and PR description at apply time) that developers with an existing local `clear-progress` IndexedDB must run `indexedDB.deleteDatabase("clear-progress")` once, since Dexie throws `VersionError` when the on-disk version (2) exceeds the declared version (1).
