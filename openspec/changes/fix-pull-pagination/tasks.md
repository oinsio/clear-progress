## 1. Contract: PullResponse extension

- [ ] 1.1 Add `has_more: boolean` to `PullResponse` (`packages/contract/src/protocol/pull.ts`) — FR4
- [ ] 1.2 Update PullResponse Zod validation schema (if exists) — FR4

## 2. Server: Pull Edge Function with pagination

- [ ] 2.1 Replace `select("*")` with `select("*", { count: "exact" })` for all tables in `pull/index.ts` — FR1
- [ ] 2.2 Add `.order("revision", { ascending: true })` to all entity queries — FR2
- [ ] 2.3 Compute `has_more`: `true` if `count > data.length` for any table — FR1
- [ ] 2.4 Compute `current_revision`: when `has_more` — `MIN(max_revision)` across tables with data; when `!has_more` — `next_revision - 1` as before — FR3
- [ ] 2.5 Include `has_more` in response — FR4

## 3. Client: Pagination loop in SyncService._pull()

- [ ] 3.1 Write unit tests for pagination loop (TDD red phase) — FR5, FR6
- [ ] 3.2 Implement `do/while(has_more)` loop in `_pull()`, using `current_revision` as cursor — FR5
- [ ] 3.3 Move `last_known_revision` save outside the loop (only after `has_more === false`) — FR6
- [ ] 3.4 Ensure entities from each batch are applied immediately inside the loop — FR5
- [ ] 3.5 Run unit tests (TDD green phase) — FR5, FR6

## 4. In-memory adapter: pagination support

- [ ] 4.1 Write contract tests for pagination in in-memory adapter (TDD red phase) — FR7
- [ ] 4.2 Add configurable `maxRowsPerTable` to `InMemorySyncAdapter` — FR7
- [ ] 4.3 Implement truncation, ordering, and `has_more`/`current_revision` logic in `pull()` — FR7
- [ ] 4.4 Run contract tests (TDD green phase) — FR7

## 5. Integration tests with real Supabase

- [ ] 5.1 Integration test: initial pull with record count > `max_rows` — all records fetched — M1
- [ ] 5.2 Integration test: incremental pull after partial batch — M1
- [ ] 5.3 Integration test: crash-recovery (interrupted pagination cycle) — M2

## 6. Verification

- [ ] 6.1 `pnpm run build` — project builds without errors
- [ ] 6.2 Mutation testing on changed SyncService files — target >=95%
- [ ] 6.3 Existing unit tests pass without regressions
