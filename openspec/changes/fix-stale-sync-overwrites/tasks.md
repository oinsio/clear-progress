# Tasks: fix-stale-sync-overwrites

## 1. Auto-reveal preserves updated_at (FR1, FR2)

- [ ] 1.1 RED: unit tests for `HiddenTaskService.revealHiddenTasks` — revealed task keeps its `updated_at`, gets `syncStatus: "pending"`; already-`pending` record is not degraded (FR1)
- [ ] 1.2 GREEN: change `HiddenTaskService` to stop refreshing `updated_at` on reveal (FR1)
- [ ] 1.3 Characterization tests: manual hide and manual unhide via `TaskService.update` refresh `updated_at`, clear `appear_date` on unhide, set `pending` (FR2 regression guard)
- [ ] 1.4 BDD unit: `stale_reveal_sync.feature` + steps — reveal-without-bump scenarios and manual hide/unhide sync scenarios, tags `@fix-stale-sync-overwrites @FR1` / `@FR2`

## 2. Rebalance preserves updated_at (FR4)

- [ ] 2.1 RED: unit tests for `TaskService.rebalanceBox` — rebalanced tasks keep `updated_at`, get `pending`; dragged task in `reorderTasks` still gets fresh `updated_at` (FR4)
- [ ] 2.2 GREEN: change `rebalanceBox` to stop refreshing `updated_at` (FR4)
- [ ] 2.3 BDD unit: `rebalance_sync.feature` + steps, tags `@fix-stale-sync-overwrites @FR4`

## 3. Dedup merge (FR3, FR6)

- [ ] 3.1 RED: unit tests for `RecurringTaskDeduplicator` merge — content from freshest `updated_at`, `next_date`+`appear_date` as a pair from earliest, winner `updated_at` = freshest copy's value (not now), wholesale-freshest on `repeat_rule` mismatch, existing winner/tiebreak/exclusion behavior unchanged (FR3)
- [ ] 3.2 GREEN: implement merge in `RecurringTaskDeduplicator` (FR3); keep file under 200 lines — extract merge logic into a separate module if needed
- [ ] 3.3 Regression tests: recurrence math untouched for both models — `fixed` early-completion + skip logic, `after_completion` derives from new `completed_at` only (FR6, reuse existing suites as characterization)
- [ ] 3.4 BDD unit: `dedup_merge.feature` + steps — two-device double completion for `fixed` and `after_completion`, tags `@fix-stale-sync-overwrites @FR3` / `@FR6`

## 4. LWW pull protection (FR5)

- [ ] 4.1 RED: contract-style test suite for `applyServerRecords` (shared cases: synced overwritten; pending vs strictly-newer server → overwritten + logged; pending vs equal → preserved; pending vs older → preserved; new record inserted) run against every entity repository (FR5)
- [ ] 4.2 GREEN: shared helper (e.g. `applyServerRecordLww`) using `Temporal.Instant.compare` + `console.warn` conflict log; wire into all entity repositories (FR5)
- [ ] 4.3 BDD unit: `pull_lww_protection.feature` + steps, tags `@fix-stale-sync-overwrites @FR5`

## 5. Integration tests (packages/integration) (NFR-REL1, M1)

- [ ] 5.1 Two-device harness: two isolated browser contexts (separate storage) against one backend; helper to dump and diff device stores + server tables for convergence assertions (NFR-REL1)
- [ ] 5.2 Integration: reported bug end-to-end for `fixed` model — complete/edit/complete on A, stale B reopens, both converge to the newest description and completed state (U1, M1, FR1+FR3+FR5)
- [ ] 5.3 Integration: same scenario for `after_completion` model (U1, FR6)
- [ ] 5.4 Integration: manual unhide before appear_date propagates to device B (U2, FR2)
- [ ] 5.5 Integration: rebalance on stale device B does not clobber newer content of untouched tasks (U3, FR4)

## 6. Verification

- [ ] 6.1 Mutation testing scoped to changed files (max 5 per run, sequential): `HiddenTaskService.ts`, `TaskService.ts`, `RecurringTaskDeduplicator.ts`, LWW helper — score >= 95% (min 90%), kill survivors with added tests (M3)
- [ ] 6.2 `get_file_problems` via JetBrains MCP on all changed files + `pnpm run build`
- [ ] 6.3 Traceability check: grep confirms every FR1-FR6, NFR-REL1, UX1-UX3 has at least one implementing test/artifact reference
