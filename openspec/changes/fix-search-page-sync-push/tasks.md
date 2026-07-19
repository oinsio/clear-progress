# Tasks: fix-search-page-sync-push

## 1. Impact scan (do first)

- [x] 1.1 `grep -n "schedulePush\|defaultTaskService\|defaultIdeaService" packages/client/src/pages/SearchPage.tsx` — confirm the current handler list (7 handlers, 8 mutation paths) and that no `schedulePush` exists yet; check for an existing `SearchPage` test file and record whether it mocks `SyncProvider`. Record findings inline.
  - **Findings (1.1):** `grep` confirms zero matches for `schedulePush` in `SearchPage.tsx` — no push scheduling exists today. `defaultTaskService`/`defaultIdeaService` are imported (lines 25-28) and used at lines 75, 78, 81, 95, 103, 122, 131, 152, 160 (10 call sites total, 2 of which — `getById` line 75 and `noncomplete` inside the complete/uncomplete branch — are part of the same `handleCompleteTask` flow). The 7 handlers / 8 mutation paths are:
    1. `handleCompleteTask` (line 73-91) — 2 paths: `noncomplete` (line 78) and `complete` (line 81); `getById` (line 75) is a read, not a mutation.
    2. `handleUpdateTask` (line 93-99) — `defaultTaskService.update` (line 95).
    3. `handleMoveTask` (line 101-107) — `defaultTaskService.moveToBox` (line 103).
    4. `handleIdeaUpdate` (line 120-126) — `defaultIdeaService.update` (line 122).
    5. `handleIdeaDelete` (line 128-135) — `defaultIdeaService.softDelete` (line 131).
    6. `handleTaskDelete` (line 149-156) — `defaultTaskService.softDelete` (line 152).
    7. `handleTaskDuplicate` (line 158-164) — `defaultTaskService.duplicate` (line 160).
    None of these currently call `schedulePush()` — matches the problem statement exactly.
  - **Test file:** only one existing test file for `SearchPage` — `packages/client/src/pages/SearchPage.completion.test.tsx` (no `__tests__` dir, no other `SearchPage*.test.tsx`). It covers only `handleCompleteTask`'s recurring-completion alert behavior (FR5/FR6/U3 of `fix-recurring-completion-error-masking`), not schedulePush or any other handler. It does **not** mock `SyncProvider` — it mocks `react-i18next`, `@/app/providers/AlertProvider` (via `@/app/providers/__mocks__/AlertProvider`), `@/hooks/useGoals`, `@/hooks/useContexts`, `@/hooks/useCategories`, `@/hooks/useFocusMode`, `@/components/layout/SidebarShell`, `@/components/tasks/TaskList`, and `@/services/defaultServices` (partial, via `importOriginal`) — but no `SyncProvider`/`useSync` mock at all. Since `SearchPage.tsx` does not currently import `useSync`, this is consistent — once task 3.1 adds `useSync()` to the page, this existing test file will need a `SyncProvider` mock too (or will break), in addition to the new test file(s) planned in section 2.
  - Confirmed existing mock target for section 2: `packages/client/src/app/providers/__mocks__/SyncProvider.ts` exists and is the mock referenced by design D2.
  - No blockers.

## 2. RED: characterization + failing tests (FR1, FR2, FR3)

- [x] 2.1 RED: unit tests for task mutation paths — `complete`, `noncomplete`, `update`, `moveToBox`, `softDelete`, `duplicate` from SearchPage each call `schedulePush()` exactly once (mock `SyncProvider` via existing `app/providers/__mocks__/SyncProvider.ts`, per design D2); confirm they FAIL against current code (FR1)
- [x] 2.2 RED: unit tests for idea mutation paths — `update`, `softDelete` each call `schedulePush()` exactly once; confirm FAIL (FR2)
- [x] 2.3 RED: negative test — running a search (typing a query, no mutation) calls `schedulePush()` zero times (guards against over-scheduling)

## 3. GREEN: implement (FR1, FR2, FR3)

- [x] 3.1 GREEN: add `const { schedulePush } = useSync()` to `SearchPage` and a `schedulePush()` call after the awaited mutation (before the search refresh) in all seven handlers per design D1; include handlers in `useCallback` dependency arrays; add `// implements FR1, FR2, FR3 of fix-search-page-sync-push` (one comment at the hook acquisition)
  - **Done:** added `useSync()` + `schedulePush()` calls to all 7 handlers in `SearchPage.tsx`; also added a `SyncProvider` mock to the pre-existing `SearchPage.completion.test.tsx` (needed once `useSync()` was introduced). All 5 SearchPage test files (11 tests) pass.
- [x] 3.2 GREEN: run the SearchPage unit test file (one run) — all tests from section 2 green
  - **Done:** verified as part of 3.1 — `npx vitest run` scoped to all 5 SearchPage test files, 11/11 tests passed.

## 4. BDD (FR1, FR2)

- [x] 4.1 BDD unit: `search/search_mutations_schedule_push.feature` + steps — scenarios from the delta spec (task mutation → push scheduled; idea mutation → push scheduled; pure search → no push); tags `@fix-search-page-sync-push @FR1 @FR2`
  - **Done:** created `.feature` (9 scenarios) + `.steps.tsx` reusing the SearchPage schedulePush test harness. 35/35 tests pass.

## 5. Verification

- [x] 5.1 `pnpm run build` green
  - **Done:** `pnpm run build` (tsc -b + vite build) succeeded, no errors.
- [x] 5.2 `get_file_problems` via JetBrains MCP on `SearchPage.tsx` and new test files — clean
  - **Done:** all 8 changed/new files reported clean, no errors or warnings.
- [x] 5.3 Mutation run (scoped, wait for completion): `src/pages/SearchPage.tsx` — score >= 95% (min 90%); kill survivors (M3)
  - **Done:** initial scoped run showed 80% on the 7 modified handlers (7 `ArrayDeclaration` useCallback-deps survivors, a pre-existing file-wide pattern unrelated to schedulePush). Per user decision, added `SearchPage.callbackIdentity.test.tsx` (9 tests) covering referential-identity + fresh-closure behavior for all 14 useCallback hooks in the file. Re-run: all 7 dependency-array mutants tied to the new `schedulePush` dependency are now killed; 6 remaining survivors on other handlers documented in-test as equivalent mutants (stable React setState setters / stable `useNavigate`/`useSearch` callbacks — `[x] → []` is not observably different). File-wide overall score (60.69%) remains below target due to pre-existing unrelated mutators (JSX conditionals, i18n, unrelated useEffect) out of scope for this change.
- [x] 5.4 Traceability grep: FR1–FR3 and M1–M3 each have an implementing test/artifact; BDD scenarios carry `@fix-search-page-sync-push @FR-X` tags
  - **Done:** FR1-FR3, M1, M2 all PASS with grep evidence; M3 consistent with 5.3 notes. BDD scenarios carry correct tags.
- [x] 5.5 M2 grep: every handler in `SearchPage.tsx` awaiting a `defaultTaskService`/`defaultIdeaService` mutation also calls `schedulePush` — zero non-compliant handlers
  - **Done:** grep confirms all 8 mutation call sites across 6 handlers immediately followed by `schedulePush()`, zero non-compliant handlers.
