# Tasks: fix-stale-sync-overwrites

## 1. Auto-reveal preserves updated_at (FR1, FR2)

- [ ] 1.1 RED: unit tests for `HiddenTaskService.revealHiddenTasks` — revealed task keeps its `updated_at`, gets `syncStatus: "pending"` (FR1)
- [ ] 1.2 RED: unit test — reveal of an already-`pending` record keeps `pending` and does not degrade its state (FR1)
- [ ] 1.3 GREEN: change `HiddenTaskService` to stop refreshing `updated_at` on reveal; update JSDoc traceability to `Implements FR1 of fix-stale-sync-overwrites` (FR1)
- [ ] 1.4 Characterization tests: manual hide via `TaskService.update` refreshes `updated_at`, sets `appear_date`, sets `pending` (FR2 regression guard)
- [ ] 1.5 Characterization tests: manual unhide via `TaskService.update` refreshes `updated_at`, clears `appear_date`, sets `pending` (FR2 regression guard)
- [ ] 1.6 BDD unit: `stale_reveal_sync.feature` + steps — reveal-without-bump scenarios, tags `@fix-stale-sync-overwrites @FR1`
- [ ] 1.7 BDD unit: manual hide/unhide sync scenarios (non-recurring tasks) in the same feature, tags `@fix-stale-sync-overwrites @FR2`

## 2. Rebalance preserves updated_at (FR4)

- [ ] 2.1 RED: unit tests for `TaskService.rebalanceBox` — rebalanced tasks keep `updated_at`, get `pending` (FR4)
- [ ] 2.2 RED: unit test — dragged task in `reorderTasks` still gets a fresh `updated_at` (FR4 regression guard)
- [ ] 2.3 GREEN: change `rebalanceBox` to stop refreshing `updated_at`; add traceability comment `Implements FR4 of fix-stale-sync-overwrites` (FR4)
- [ ] 2.4 BDD unit: `rebalance_sync.feature` + steps, tags `@fix-stale-sync-overwrites @FR4`

## 3. Dedup merge (FR3, FR6)

- [ ] 3.1 RED: merge tests — content fields (`name`, `description`, `goal_id`, `context_id`, `category_id`) come from the freshest-`updated_at` copy (FR3)
- [ ] 3.2 RED: merge tests — `next_date` + `appear_date` + `is_hidden` come as a schedule triple from the earliest-`next_date` copy, never mixed across copies (FR3)
- [ ] 3.3 RED: merge tests — `box` + `sort_order` come as a pair from the freshest copy; `id`, `created_at`, `revision` stay the winner's own (FR3)
- [ ] 3.4 RED: merge tests — winner `updated_at` equals the freshest copy's value (not refreshed to now); on `repeat_rule` mismatch the freshest copy wins wholesale, dates included (FR3)
- [ ] 3.5 RED: merge tests — winner is written with `pending` only when the merge changed it; an already-optimal winner is not rewritten and keeps `synced` (FR3)
- [ ] 3.6 Characterization tests: existing behavior unchanged — winner selection (earliest `next_date`, id tiebreak), completed/deleted copies excluded, loser soft-delete + checklist cascade (FR3)
- [ ] 3.7 GREEN: implement merge in `RecurringTaskDeduplicator` — extract merge logic into a separate module to keep files under 200 lines; update traceability comments to reference FR3 of fix-stale-sync-overwrites (FR3)
- [ ] 3.8 Regression tests: recurrence math untouched for both models — `fixed` early-completion + skip logic, `after_completion` derives from new `completed_at` only (FR6, reuse existing suites as characterization)
- [ ] 3.9 BDD unit: `dedup_merge.feature` + steps — two-device double completion for `fixed` and `after_completion`, tags `@fix-stale-sync-overwrites @FR3` / `@FR6`

## 4. LWW pull protection (FR5)

- [ ] 4.1 RED: contract-style shared test suite for `applyServerRecords` (cases: `synced` overwritten; `rejected` overwritten; `pending` vs strictly newer server → overwritten, logged, marked `synced`; `pending` vs equal → preserved; `pending` vs older → preserved; new record inserted) (FR5)
- [ ] 4.2 GREEN: shared helper (e.g. `applyServerRecordLww`) using `Temporal.Instant.compare` + `console.warn` conflict log with entity type, id, and both timestamps (FR5)
- [ ] 4.3 GREEN: wire the helper into `TaskRepository`, `GoalRepository`, `ContextRepository`, `CategoryRepository`; run the contract suite against each (FR5)
- [ ] 4.4 GREEN: wire the helper into `IdeaRepository`, `ChecklistRepository`, `AttachmentRepository`; run the contract suite against each (`SettingsRepository` excluded — settings sync uses timestamp filtering and has no `applyServerRecords`) (FR5)
- [ ] 4.5 BDD unit: `pull_lww_protection.feature` + steps, tags `@fix-stale-sync-overwrites @FR5`

## 5. Integration tests (packages/integration) (NFR-REL1, M1)

- [ ] 5.1 Two-device harness: two isolated browser contexts with separate storage states for the same user against one backend — reuse existing `page-lifecycle.ts` / `server-api.ts` infrastructure (NFR-REL1)
- [ ] 5.2 Convergence helper: dump both devices' IndexedDB stores + server tables and diff them for equality assertions (NFR-REL1)
- [ ] 5.3 Integration: reported bug end-to-end for the `fixed` model — complete/edit on A, stale B reopens and auto-reveals, both devices converge to the newest description and completed occurrence stays completed; convergence assertion (U1, M1, FR1+FR3+FR5, NFR-REL1)
- [ ] 5.4 Integration: same scenario for the `after_completion` model; convergence assertion (U1, FR6, NFR-REL1)
- [ ] 5.5 Integration: manual unhide before `appear_date` on device A propagates to device B; convergence assertion (U2, FR2, NFR-REL1)
- [ ] 5.6 Integration: rebalance on stale device B does not clobber newer content of untouched tasks (U3, FR4, NFR-REL1)

## 6. Verification

- [ ] 6.1 Mutation run 1 (scoped, max 5 files, wait for completion): `HiddenTaskService.ts`, `TaskService.ts`, `RecurringTaskDeduplicator.ts`, extracted merge module, LWW helper — score >= 95% (min 90%), kill survivors with added tests (M3)
- [ ] 6.2 Mutation run 2 (only after run 1 finishes): `TaskRepository.ts`, `GoalRepository.ts`, `ContextRepository.ts`, `CategoryRepository.ts` — same threshold (M3)
- [ ] 6.3 Mutation run 3 (only after run 2 finishes): `IdeaRepository.ts`, `ChecklistRepository.ts`, `AttachmentRepository.ts` — same threshold (M3)
- [ ] 6.4 `get_file_problems` via JetBrains MCP on all changed files + `pnpm run build`
- [ ] 6.5 Traceability check: grep confirms every FR1-FR6, NFR-REL1, UX1-UX3 has at least one implementing test/artifact reference; BDD scenarios carry `@fix-stale-sync-overwrites @FR-X` tags
