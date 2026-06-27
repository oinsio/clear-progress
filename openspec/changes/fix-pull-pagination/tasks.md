## 1. Contract: PullRequest/PullResponse extension

- [x] 1.1 Add `has_more: boolean` to `PullResponse` (`packages/contract/src/protocol/pull.ts`) — FR4
- [x] 1.2 Update PullResponse Zod validation schema (if exists) — FR4
- [ ] 1.3 Add `cursors?: Record<string, { revision: number; last_id: string }>` to `PullResponse` — FR4
- [ ] 1.4 Add `cursors?: Record<string, { revision: number; last_id: string }>` to `PullRequest` — FR8

## 2. Migration: Composite index for keyset pagination

- [ ] 2.1 Create migration adding composite index `(user_id, revision, id)` on all 7 entity tables — FR10, NFR-P2

## 3. Server: Pull Edge Function with composite cursor

- [x] 3.1 Use `select("*", { count: "exact" })` for all entity tables in `pull/index.ts` — FR1
- [ ] 3.2 Add `.order("id", { ascending: true })` as secondary sort after `.order("revision")` — FR2
- [ ] 3.3 Parse `cursors` from request body — FR8
- [ ] 3.4 Use composite `.or('revision.gt.R,and(revision.eq.R,id.gt.ID)')` filter for tables with cursor; standard `gt` for others — FR9
- [x] 3.5 Compute `has_more`: `true` if `count > data.length` for any table — FR1
- [ ] 3.6 Build `cursors` object with `{ revision, last_id }` for each truncated table — FR3
- [ ] 3.7 Compute `current_revision`: when `has_more` — `MIN(max_revision)`; otherwise `next_revision - 1` — FR3
- [ ] 3.8 Include `cursors` in response when `has_more` — FR3

## 4. Client: Pagination loop with cursor passthrough

- [ ] 4.1 Update unit tests for pagination loop with cursors (TDD red phase) — FR5, FR8
- [ ] 4.2 Implement cursor passthrough in `_pull()` do/while loop — FR5
- [x] 4.3 Move `last_known_revision` save outside the loop (only after `has_more === false`) — FR6
- [ ] 4.4 Run unit tests (TDD green phase) — FR5

## 5. In-memory adapter: composite cursor pagination

- [ ] 5.1 Update contract tests for composite cursor pagination (TDD red phase) — FR7
- [ ] 5.2 Add composite cursor support: `ORDER BY revision, id`, `.or()` filter, cursors in response — FR7
- [ ] 5.3 Add test case: >maxRows records with same revision are all fetched — FR7
- [ ] 5.4 Run contract tests (TDD green phase) — FR7

## 6. Integration tests with real Supabase

- [ ] 6.1 Integration test: single-batch push of >max_rows records with same revision — all fetched via composite cursor — M1
- [ ] 6.2 Integration test: incremental pull after batch with same-revision records — M1
- [ ] 6.3 Integration test: crash-recovery with composite cursor pagination — M2
- [ ] 6.4 Remove `pushTasksInBatches` workaround — use single push for all test records

## 7. Verification

- [ ] 7.1 `pnpm run build` — project builds without errors
- [ ] 7.2 Mutation testing on changed files — target >=95%
- [ ] 7.3 Existing unit tests pass without regressions
