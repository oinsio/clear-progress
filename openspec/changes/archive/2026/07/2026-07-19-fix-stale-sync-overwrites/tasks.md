# Tasks: fix-stale-sync-overwrites

## 1. Auto-reveal preserves updated_at (FR1, FR2)

- [x] 1.1 RED: unit tests for `HiddenTaskService.revealHiddenTasks` — revealed task keeps its `updated_at`, gets `syncStatus: "pending"` (FR1)
- [x] 1.2 RED: unit test — reveal of an already-`pending` record keeps `pending` and does not degrade its state (FR1)
- [x] 1.3 GREEN: change `HiddenTaskService` to stop refreshing `updated_at` on reveal; update JSDoc traceability to `Implements FR1 of fix-stale-sync-overwrites` (FR1)
- [x] 1.4 Characterization tests: manual hide via `TaskService.update` refreshes `updated_at`, sets `appear_date`, sets `pending` (FR2 regression guard)
- [x] 1.5 Characterization tests: manual unhide via `TaskService.update` refreshes `updated_at`, clears `appear_date`, sets `pending` (FR2 regression guard)
- [x] 1.6 BDD unit: `stale_reveal_sync.feature` + steps — reveal-without-bump scenarios, tags `@fix-stale-sync-overwrites @FR1`
- [x] 1.7 BDD unit: manual hide/unhide sync scenarios (non-recurring tasks) in the same feature, tags `@fix-stale-sync-overwrites @FR2`

## 2. Rebalance preserves updated_at (FR4)

- [x] 2.1 RED: unit tests for `TaskService.rebalanceBox` — rebalanced tasks keep `updated_at`, get `pending` (FR4)
- [x] 2.2 RED: unit test — dragged task in `reorderTasks` still gets a fresh `updated_at` (FR4 regression guard)
- [x] 2.3 GREEN: change `rebalanceBox` to stop refreshing `updated_at`; add traceability comment `Implements FR4 of fix-stale-sync-overwrites` (FR4)
- [x] 2.4 BDD unit: `rebalance_sync.feature` + steps, tags `@fix-stale-sync-overwrites @FR4`

## 3. Dedup merge (FR3, FR6)

- [x] 3.1 RED: merge tests — content fields (`name`, `description`, `goal_id`, `context_id`, `category_id`) come from the freshest-`updated_at` copy (FR3)
- [x] 3.2 RED: merge tests — `next_date` + `appear_date` + `is_hidden` come as a schedule triple from the earliest-`next_date` copy, never mixed across copies (FR3)
- [x] 3.3 RED: merge tests — `box` + `sort_order` come as a pair from the freshest copy; `id`, `created_at`, `revision` stay the winner's own (FR3)
- [x] 3.4 RED: merge tests — winner `updated_at` equals the freshest copy's value (not refreshed to now); on `repeat_rule` mismatch the freshest copy wins wholesale, dates included (FR3)
- [x] 3.5 RED: merge tests — winner is written with `pending` only when the merge changed it; an already-optimal winner is not rewritten and keeps `synced` (FR3)
- [x] 3.6 Characterization tests: existing behavior unchanged — winner selection (earliest `next_date`, id tiebreak), completed/deleted copies excluded, loser soft-delete + checklist cascade (FR3)
- [x] 3.7 GREEN: implement merge in `RecurringTaskDeduplicator` — extract merge logic into a separate module to keep files under 200 lines; update traceability comments to reference FR3 of fix-stale-sync-overwrites (FR3)
- [x] 3.8 Regression tests: recurrence math untouched for both models — `fixed` early-completion + skip logic, `after_completion` derives from new `completed_at` only (FR6, reuse existing suites as characterization)
- [x] 3.9 BDD unit: `dedup_merge.feature` + steps — two-device double completion for `fixed` and `after_completion`, tags `@fix-stale-sync-overwrites @FR3` / `@FR6`

## 4. LWW pull protection (FR5)

- [x] 4.1 RED: contract-style shared test suite for `applyServerRecords` (cases: `synced` overwritten; `rejected` overwritten; `pending` vs strictly newer server → overwritten, logged, marked `synced`; `pending` vs equal → preserved; `pending` vs older → preserved; new record inserted) (FR5)
- [x] 4.2 GREEN: shared helper (e.g. `applyServerRecordLww`) using `Temporal.Instant.compare` + `console.warn` conflict log with entity type, id, and both timestamps (FR5)
- [x] 4.3 GREEN: wire the helper into `TaskRepository`, `GoalRepository`, `ContextRepository`, `CategoryRepository`; run the contract suite against each (FR5)
- [x] 4.4 GREEN: wire the helper into `IdeaRepository`, `ChecklistRepository`, `AttachmentRepository`; run the contract suite against each (`SettingsRepository` excluded — settings sync uses timestamp filtering and has no `applyServerRecords`) (FR5)
- [x] 4.5 BDD unit: `pull_lww_protection.feature` + steps, tags `@fix-stale-sync-overwrites @FR5`

## 5. Integration tests (packages/integration) (NFR-REL1, M1)

- [x] 5.1 Two-device harness: two isolated browser contexts with separate storage states for the same user against one backend — reuse existing `page-lifecycle.ts` / `server-api.ts` infrastructure (NFR-REL1)
- [x] 5.2 Convergence helper: dump both devices' IndexedDB stores + server tables and diff them for equality assertions (NFR-REL1)
- [x] 5.3 Integration: reported bug end-to-end for the `fixed` model — complete/edit on A, stale B reopens and auto-reveals, both devices converge to the newest description and completed occurrence stays completed; convergence assertion (U1, M1, FR1+FR3+FR5, NFR-REL1)
- [x] 5.4 Integration: same scenario for the `after_completion` model; convergence assertion (U1, FR6, NFR-REL1)
- [x] 5.5 Integration: manual unhide before `appear_date` on device A propagates to device B; convergence assertion (U2, FR2, NFR-REL1)
- [x] 5.6 Integration: rebalance on stale device B does not clobber newer content of untouched tasks (U3, FR4, NFR-REL1)

## 6. Verification

- [x] 6.1 Mutation run 1 (scoped, max 5 files, wait for completion): `HiddenTaskService.ts`, `TaskService.ts`, `RecurringTaskDeduplicator.ts`, extracted merge module, LWW helper — score >= 95% (min 90%), kill survivors with added tests (M3)
- [x] 6.2 Mutation run 2 (only after run 1 finishes): `TaskRepository.ts`, `GoalRepository.ts`, `ContextRepository.ts`, `CategoryRepository.ts` — same threshold (M3)
- [x] 6.3 Mutation run 3 (only after run 2 finishes): `IdeaRepository.ts`, `ChecklistRepository.ts`, `AttachmentRepository.ts` — same threshold (M3)
- [x] 6.4 `get_file_problems` via JetBrains MCP on all changed files + `pnpm run build`
- [x] 6.5 Traceability check: grep confirms every FR1-FR6, NFR-REL1, UX1-UX3 has at least one implementing test/artifact reference; BDD scenarios carry `@fix-stale-sync-overwrites @FR-X` tags

## 7. Review fixes: Temporal comparison in dedup merge + traceability marks (FR3, NFR-REL1, M2)

Impact analysis for 7.1-7.4: `findFreshestUpdatedAtCopy` is reachable only via `mergeWinner` → `RecurringTaskDeduplicator.deduplicate` → `SyncService` pull path (`SyncService.ts:178`) — no other feature consumes it. For in-format timestamps (`toISOTimestamp` always emits fixed-precision `...000Z`) lexicographic and instant order coincide, so the swap is behavior-preserving and all existing FR3 tests must stay green unchanged. Divergence exists only for out-of-format data: same instant in different representations (localeCompare gives an arbitrary winner, `Temporal.Instant.compare` gives a correct tie → first copy in group order wins) and malformed `updated_at` (`Temporal.Instant.from` throws instead of silently misordering — same exposure the FR5 LWW helper already has in the same pull path). `sortByWinnerPriority` keeps `localeCompare` intentionally: `next_date` is date-only and `id` is not a timestamp — out of scope per the Temporal rule.

- [x] 7.1 Characterization test (pre-refactor guard): two copies with an equal `updated_at` — the first copy in group order stays the freshest-content source (tie semantics of the `reduce` documented before touching it) (FR3)
- [x] 7.2 REFACTOR: `findFreshestUpdatedAtCopy` compares via `Temporal.Instant.compare` (import from `@/lib/temporal`) instead of `String.prototype.localeCompare`, preserving tie semantics (keep `freshest` when compare <= 0) (FR3, aligns with design D4 convention)
- [x] 7.3 Scoped test run (one command, foreground): `RecurringTaskDeduplicator.merge.test.ts`, `RecurringTaskDeduplicator.test.ts`, `dedup_merge.steps.ts` — all green with no test edits beyond 7.1 (FR3)
- [x] 7.4 Scoped mutation run on `src/services/RecurringTaskDeduplicator.merge.ts` (wait for completion; no concurrent runs): diff-scoped kill rate stays 100%, whole-file score >= 95% (M3)
- [x] 7.5 Traceability: add `NFR-REL1` (and `M1` where the scenario implements it) to the `// implements ... of fix-stale-sync-overwrites` header comment of all four integration specs (`multi-device-stale-recurring-fixed`, `multi-device-stale-recurring-after-completion`, `multi-device-manual-unhide`, `multi-device-stale-rebalance`) (NFR-REL1, M1)
- [x] 7.6 Traceability: add `// Verifies M2 of fix-stale-sync-overwrites` comments to the unit tests asserting `updated_at` is untouched by system mutations: reveal (`HiddenTaskService.test.ts`), rebalance (`TaskService.reorder.test.ts`), dedup merge (`RecurringTaskDeduplicator.merge.test.ts`) (M2)
- [x] 7.7 Verification: traceability grep confirms NFR-REL1/M1/M2 references resolve; `get_file_problems` on touched files + `pnpm run build`
- [x] 7.8 Spec wording: align the wholesale clause with the implemented (and correct) behavior — replace "when `repeat_rule` differs between copies" with "when `repeat_rule` differs between the schedule winner and the freshest-`updated_at` copy" in `proposal.md` (What Changes bullet, Modified Capabilities bullet, FR3), `design.md` (D3 table row), and the delta spec `specs/repeating-tasks/spec.md` (wholesale bullet). Rationale stays: only those two copies' fields ever mix, so only their rule mismatch makes a merge incoherent; a differing rule on a stale loser contributes no fields and must NOT trigger wholesale (FR3)
- [x] 7.9 Pinning test for the 3-copy edge: schedule winner and freshest copy share `repeat_rule`, a stale loser carries a different one — normal merge applies (schedule triple from the winner + content from the freshest), NOT wholesale; loser is soft-deleted as usual (FR3)

## 8. Review fixes: file-size invariant for test files (process-invariants: 100-200 target, 300 hard cap)

Behavior-preserving reorganization — no test logic changes, no TDD cycle (refactoring exemption). Split boundaries follow the existing `describe` blocks; use the `split-large-tests` skill for 8.1-8.3. Shared builders/seed helpers go into a `RecurringTaskDeduplicator.test-setup.ts` module (established repo pattern: `*.test-setup.ts` next to repository tests). New files keep the `.test.ts` suffix so the vitest glob picks them up. BDD `.steps.ts` files are all within limits (max 282) — not in scope.

- [x] 8.1 Split `RecurringTaskDeduplicator.merge.test.ts` (598) into ~3 files by merge aspect, each <= 200: content fields from the freshest copy (name/description/goal/context/category + equal-`updated_at` tie), schedule triple + box/sort_order pair coupling, identity fields + winner `updated_at` + wholesale `repeat_rule` + pending-only-when-changed; extract shared task builders into the test-setup module (FR3 coverage unchanged)
- [x] 8.2 Split `RecurringTaskDeduplicator.test.ts` (692) into ~3 files by concern, each <= 200: winner selection + tiebreak + filtering; loser soft-delete + checklist cascade + multiple/three-plus groups; skip optimization + guard describes; reuse the same test-setup module (FR3 characterization coverage unchanged)
- [x] 8.3 Split `HiddenTaskService.test.ts` (300): move the `revealHiddenTasks preserving updated_at` describe (FR1 block) into a sibling `HiddenTaskService.reveal-preserves-updated-at.test.ts`; both files end up <= 200 (FR1 coverage unchanged)
- [x] 8.4 Slim `multi-device-stale-rebalance.spec.ts` (319): move `dragTaskOnto` into `page-actions.ts` and `buildInboxTaskPayload` into a shared integration helper module; the spec keeps only the U3 scenario and lands <= 200 (U3/FR4/NFR-REL1 coverage unchanged)
- [x] 8.4a Follow-up: `page-actions.ts` grew to 312 lines after 8.4 added `dragTaskOnto`, breaching the 300-line hard cap. Split it by action category (task actions, checklist actions, goal/category/context actions, attachment actions) into sibling files under 200 lines each, reusing existing repo module patterns; update all importers; no behavior change (process-invariants file-size cap)
- [x] 8.5 Verification: scoped vitest run (one command, foreground) over all files produced by 8.1-8.3 — green, and the total test count of the split groups equals the pre-split count (no scenario silently dropped)
- [x] 8.6 Verification: scoped mutation run on `src/services/RecurringTaskDeduplicator.ts,src/services/RecurringTaskDeduplicator.merge.ts,src/services/HiddenTaskService.ts` (wait for completion) — scores unchanged, confirming Stryker still discovers the renamed test files (M3)
- [x] 8.7 Verification: `wc -l` confirms every touched test file <= 200 (hard cap 300 nowhere needed) — confirmed, all pass; `get_file_problems` on new/changed files — clean. At 8.7 time, `pnpm run preflight` failed on 4 pre-existing integration spec bugs from section 5 (unrelated to the section-8 reorg — see 9.1-9.4 below); investigation confirmed all section-8 moved/split code is byte-identical to its pre-move source and correctly imported, so section 8's own scope was verified complete. Those 4 specs were real bugs (not flakes) and are now fixed in section 9; `pnpm run preflight` and `pnpm run build` are both green.

## 9. Follow-up: pre-existing integration spec bugs surfaced by preflight (found during 8.7 verification, not caused by section 8's reorg) — FIXED

Root causes (all fixed): the specs assumed tasks stay clickable from `/tasks` in states the app correctly hides/filters them; deeper issues surfaced once those were fixed — invalid seeded sort keys poisoning shared-inbox key generation, a strict-mode drag-handle locator collision, missing final pull-on-A convergence rounds, a token refresh triggered by the faked clock jump (Kong CORS + short JWT), and an over-broad shared-user convergence assertion. See per-item notes below.

- [x] 9.1 Fixed `multi-device-stale-recurring-fixed.spec.ts` and `multi-device-stale-recurring-after-completion.spec.ts`: the description edit now precedes completion (the new occurrence is cloned from the original's fields at completion time, so both occurrences carry the fresh description), preceded by a clean `/tasks` navigation so the detail panel stays mounted; a final `triggerSyncAndWait(pageA)` pulls B's reveal so all three converge (U1, FR6, NFR-REL1)
- [x] 9.2 Fixed `multi-device-manual-unhide.spec.ts`: click the `command-bar-eye-toggle` control (the actual sidebar reveal toggle; `hidden-tasks-toggle` is an older e2e locator) on `pageA` before step 4's `openTaskDetail` so the hidden task is clickable (U2, FR2, NFR-REL1)
- [x] 9.3 Fixed `multi-device-stale-rebalance.spec.ts`: the seeded tasks live in the inbox box, so the flow now runs on `/inbox` (not `/tasks`, which shows only today/week/later); `dragTaskOnto` matches the drag handle by its exact "Drag task" label (a task named "…Dragged" collided with `/drag/i`); seed keys are valid fractional-indexing keys ("ac"/"ab", not "z"/"m" which pass the app's lax check but throw in `generateKeyBetween`, poisoning inbox key generation for later specs); a final `triggerSyncAndWait(pageA)` pulls B's rebalance (U3, FR4, NFR-REL1)
- [x] 9.4 Verification: `pnpm run preflight` green (85 integration + 7959 client tests pass). Also fixed two cross-cutting harness issues surfaced once the specs progressed past the clickability bugs: (a) Kong CORS now allows the `x-supabase-api-version` header, and the test backend issues 7-day JWTs (`GOTRUE_JWT_EXP`) so a device's day-long clock jump never triggers a token refresh that raced/failed under the faked clock — the `advanceClockPastDate` helper uses `page.clock.install({ time }) + resume()`; (b) `assertConverged` takes an optional record filter so the shared-user convergence check is scoped to each test's own records (a clock-advanced device also reveals unrelated specs' hidden occurrences) (NFR-REL1, M1)

Still not in scope for this change (flag separately, do not fix here): `TaskService.complete()`'s broad `catch` (lines ~212-219) mislabels any exception during recurring-copy creation as `skipped_invalid_rule`, surfacing a misleading "Repeat rule issue" dialog; it masked the invalid-sort-key root cause during 9.3's investigation.
