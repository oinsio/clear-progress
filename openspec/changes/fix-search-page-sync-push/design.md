# Design: fix-search-page-sync-push

Context: driven by FR1–FR3 from `proposal.md`.

## Context

`SearchPage.tsx` (`packages/client/src/pages/SearchPage.tsx`) is the only page that mutates data through direct `defaultTaskService` / `defaultIdeaService` calls in local `useCallback` handlers instead of going through the shared hooks. The shared hooks (`useTasks`, `useInboxTasks`, `useTaskMutations` via `useMutationHelpers`, `useIdeas`, …) all end every mutation with `schedulePush()` from `useSync()`; SearchPage's seven handlers end with a re-run of the search query (`void search(searchQuery)`) and never schedule a push. The `sync-orchestration` spec (T3) already requires a push after any local mutation — this page silently violates it.

## Goals / Non-Goals

**Goals:**
- Make every SearchPage mutation schedule a push, identically to the rest of the app.
- Keep the diff minimal and mechanical — one hook call added, one `schedulePush()` line per handler.

**Non-Goals:**
- No migration of SearchPage onto the shared mutation hooks (NG1 — separate initiative, see Q1).
- No changes to `SyncProvider`, debounce, or the sync protocol (NG2).

## Decisions

### D1 — Add `schedulePush()` calls in place, don't rewire onto shared hooks

Obtain `const { schedulePush } = useSync()` in `SearchPage` and append `schedulePush()` after the awaited service call in each of the seven handlers (`handleCompleteTask` covers both `complete` and `noncomplete` branches — one call after the `if/else`, before the search refresh).

- **Why in place:** the bug is one missing line per handler; rewiring SearchPage onto `useTasks`/`useTaskMutations` would drag in box-scoped reload semantics those hooks assume (they reload their own lists, SearchPage re-runs a query) and belongs to the deferred unification (Q1). The in-place fix is the smallest change that restores the sync-orchestration T3 invariant.
- **Alternative — move `schedulePush` into the services (`TaskService.complete` etc.):** rejected; services are UI-agnostic and used by sync/tests where scheduling a push would be wrong (e.g. applying pulled changes must not re-trigger a push). The established pattern is "callers schedule", and every hook already follows it.
- **Placement:** after the successful `await` of the mutation, before the search-refresh call — matches the hook pattern (mutate → schedule → refresh view) and means a thrown mutation error skips the push, same as elsewhere.

### D2 — Test seam: mock `useSync` as other hook tests do

Unit tests mock the `SyncProvider` module (the repo already ships `app/providers/__mocks__/SyncProvider.ts` with `mockSchedulePush`) and assert exactly one `schedulePush()` call per mutation path, plus zero calls for a pure search. No new test infrastructure.

## Risks / Trade-offs

- [Double-push if a future refactor moves SearchPage onto shared hooks that also schedule] → `schedulePush()` is debounced and idempotent within the window; a duplicate call coalesces. The Q1 refactor would delete these lines anyway.
- [A handler's search-refresh throws after the mutation, skipping the push] → `schedulePush()` is placed before the refresh call, so the push is scheduled once the local write lands.

## Migration Plan

Client-only, additive lines; no data migration, no server change. Rollback = revert the commit.

## Open Questions

- Q1 (from proposal): unify SearchPage mutations onto the shared hooks after `fix-recurring-completion-error-masking` lands. Out of scope here.
