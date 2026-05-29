## 1. Unit BDD Test (RED)

- [ ] 1.1 Create `sync_indicator_race.feature` with scenarios for race condition (FR1, FR4) — `packages/client/src/test/features/sync_protocol/`
- [ ] 1.2 Create `sync_indicator_race.steps.ts` step definitions following `sync_dirty_flag.steps.ts` pattern — verify RED

## 2. Fix useIsUnsynced Hook (FR1)

- [ ] 2.1 Modify `useIsUnsynced.ts` — use `entity.needsSync` instead of `updated_at > lastSyncedAt`
- [ ] 2.2 Update fallback values in `EntityDetailLayout.tsx` and `GoalDetailPage.tsx` — `{ needsSync: false }`
- [ ] 2.3 Verify unit BDD test is GREEN

## 3. Fix Checklist Indicator (FR2, FR3)

- [ ] 3.1 Modify `useChecklist.ts` — `hasUnsyncedItems` uses `item.needsSync`, remove `lastSyncedAt` from destructuring
- [ ] 3.2 Modify `SortableChecklistItem.tsx` — remove `lastSyncedAt` prop, use `item.needsSync` for amber logic
- [ ] 3.3 Modify `TaskDetailPanel.tsx` — remove `lastSyncedAt` prop drilling to ChecklistSection and SortableChecklistItem

## 4. Verify Existing Tests

- [ ] 4.1 Run existing tests for modified hooks and components — fix any breakages
- [ ] 4.2 Run `pnpm run build` and `getDiagnostics` for all changed files

## 5. Integration Test (FR4)

- [ ] 5.1 Create `sync-indicator-race.spec.ts` in `packages/integration/src/tests/` — Playwright test with route interception to delay push, add items during sync, verify amber state
