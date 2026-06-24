# Tasks: swipeable-item

## 1. Constants and Types

- [ ] 1.1 Add constants: `SWIPE_VELOCITY_THRESHOLD_PX_PER_MS`, `SWIPE_DRAG_START_PX` (5px) to `constants/index.ts` — FR4
- [ ] 1.2 Add `SwipeActionConfig` interface and `SwipeDirection` type to `types/` — FR2, FR13

## 2. useSwipeGesture Hook (TDD)

- [ ] 2.1 BDD feature file `features/swipe_gesture/swipe_gesture_initial_state.feature` — FR1
- [ ] 2.2 BDD feature file `features/swipe_gesture/swipe_gesture_right_swipe.feature` — FR2, FR3
- [ ] 2.3 BDD feature file `features/swipe_gesture/swipe_gesture_left_swipe.feature` — FR2, FR3
- [ ] 2.4 BDD feature file `features/swipe_gesture/swipe_gesture_velocity.feature` — FR4
- [ ] 2.5 BDD feature file `features/swipe_gesture/swipe_gesture_suspension.feature` — FR5, FR6
- [ ] 2.6 BDD feature file `features/swipe_gesture/swipe_gesture_edge_cases.feature` — FR7, FR8, FR9, FR10, FR11, FR12
- [ ] 2.7 Step definitions for all swipe_gesture features
- [ ] 2.8 Implement `useSwipeGesture` hook (`hooks/useSwipeGesture.ts`) — Pointer Events, bidirectional, velocity, suspension, clamping — FR1-FR12
- [ ] 2.9 Unit tests for useSwipeGesture (vitest) — all scenarios from spec
- [ ] 2.10 Mutation testing on useSwipeGesture — target >=95% — NFR-P2

## 3. SwipeableItem Component (TDD)

- [ ] 3.1 BDD feature file `features/swipeable_item/swipeable_item_rendering.feature` — FR13, FR14, NFR-A2
- [ ] 3.2 Step definitions for swipeable_item features
- [ ] 3.3 Implement `SwipeableItem` component (`components/shared/SwipeableItem.tsx`) — background layers, translateX, snap-back — FR13, FR14
- [ ] 3.4 Unit tests for SwipeableItem (vitest + testing-library) — all scenarios from spec
- [ ] 3.5 Mutation testing on SwipeableItem — target >=95%

## 4. SortableItem Component (TDD)

- [ ] 4.1 BDD feature file `features/sortable_item/sortable_item_render_prop.feature` — FR15, FR16
- [ ] 4.2 Step definitions for sortable_item features
- [ ] 4.3 Implement `SortableItem` component (`components/shared/SortableItem.tsx`) — render-prop, useSortable, isDragging — FR15, FR16
- [ ] 4.4 Unit tests for SortableItem (vitest + testing-library) — all scenarios from spec
- [ ] 4.5 Mutation testing on SortableItem — target >=95%

## 5. Ideas in Deleted Entities (Bugfix, TDD)

- [ ] 5.1 Add ideas subscription to `useDeletedEntities` — add `db.ideas.filter(i => i.is_deleted)`, update totalSubscriptions, update isEmpty check — FR19
- [ ] 5.2 Add `restoreIdea` to `useRestoreEntity` using `IdeaService.restore()` — FR20
- [ ] 5.3 Update BDD feature `features/deleted_entities/deleted_entities_aggregation.feature` — add ideas scenarios — FR19
- [ ] 5.4 Update BDD feature `features/deleted_entities/deleted_entities_restore.feature` — add idea restore scenario — FR20
- [ ] 5.5 Update step definitions for deleted_entities features
- [ ] 5.6 Unit tests for useDeletedEntities with ideas — FR19
- [ ] 5.7 Unit tests for useRestoreEntity with restoreIdea — FR20
- [ ] 5.8 Mutation testing on useDeletedEntities and useRestoreEntity — target >=95%

## 6. Migrate TaskItem to SwipeableItem

- [ ] 6.1 Remove swipe-related code from TaskItem (useSwipeAction import, swipe background JSX, translateX style, isSwipeEnabled logic) — FR17
- [ ] 6.2 Wrap TaskItem usage sites with SwipeableItem (configure swipeRight for complete/uncomplete) — FR17, UX2, UX3
- [ ] 6.3 Create `SortableItem` + `SwipeableItem` composition in TaskList (replace SortableTaskItem) — FR15, FR16, FR17
- [ ] 6.4 Run `npx vitest run src/components/tasks/TaskItem` — verify all existing unit tests pass after migration
- [ ] 6.5 Run `npx vitest run src/test/features/swipe_actions` — verify existing BDD tests pass (adapt step definitions to new component structure if needed)
- [ ] 6.6 Run `npx vitest run src/components/tasks/TaskList` — verify TaskList tests pass with SortableItem
- [ ] 6.7 Mutation testing on modified TaskItem and TaskList — target >=95%

## 7. DeletedPage Swipe Restore + Ideas Section

- [ ] 7.1 Add Ideas section to DeletedPage (collapsible, same pattern as other sections) — FR21
- [ ] 7.2 Add i18n keys for ideas section to `locales/ru.json` and `locales/en.json` — FR21
- [ ] 7.3 Wrap all deleted entity items in SwipeableItem with swipeRight={restore, blue, ArchiveRestore} — FR18, UX1
- [ ] 7.4 Unit tests for DeletedPage ideas section — FR21
- [ ] 7.5 Unit tests for DeletedPage swipe restore — FR18
- [ ] 7.6 Mutation testing on DeletedPage — target >=95%

## 8. Cleanup and Remove Old Code

- [ ] 8.1 Delete `useSwipeAction.ts` and all its test files (initial-state, left-swipe, above-threshold, below-threshold, edge-cases, test-utils)
- [ ] 8.2 Delete old BDD features `features/swipe_actions/swipe_action_*.feature` and their step definitions (replaced by swipe_gesture features)
- [ ] 8.3 Update any remaining imports of useSwipeAction across codebase
- [ ] 8.4 Delete `SortableTaskItem` from TaskList.tsx (replaced by SortableItem)

## 9. BDD E2E Tests (playwright-bdd)

- [ ] 9.1 BDD E2E feature `features/deleted_page_e2e/deleted_page_swipe_restore_e2e.feature` — swipe right restores entity on DeletedPage — FR18, M1
- [ ] 9.2 BDD E2E feature `features/deleted_page_e2e/deleted_page_ideas_section_e2e.feature` — ideas appear in trash when soft-deleted — FR21, G4
- [ ] 9.3 BDD E2E feature `features/task_swipe_e2e/task_swipe_complete_e2e.feature` — swipe right completes task on InboxPage — FR17, UX2
- [ ] 9.4 BDD E2E feature `features/task_swipe_e2e/task_swipe_dnd_coexistence_e2e.feature` — DnD reorder works without accidental swipes — FR16, M5
- [ ] 9.5 E2E step definitions for all above features

## 10. Final Verification

- [ ] 10.1 Run full unit test suite `cd packages/client && npx vitest run` — verify no regressions — M4
- [ ] 10.2 Run `pnpm run build` — verify build succeeds
- [ ] 10.3 Run E2E suite `cd packages/client && npx bddgen && npx playwright test` — verify all E2E scenarios pass — M1, M5
