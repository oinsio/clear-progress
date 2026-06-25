# Tasks: swipeable-item

## 1. Constants and Types

- [x] 1.1 Add constants: `SWIPE_VELOCITY_THRESHOLD_PX_PER_MS`, `SWIPE_DRAG_START_PX` (5px) to `constants/index.ts` — FR4
- [x] 1.2 Add `SwipeActionConfig` interface and `SwipeDirection` type to `types/` — FR2, FR13

## 2. useSwipeGesture Hook (TDD)

- [x] 2.1 BDD feature file `features/swipe_gesture/swipe_gesture_initial_state.feature` — FR1
- [x] 2.2 BDD feature file `features/swipe_gesture/swipe_gesture_right_swipe.feature` — FR2, FR3
- [x] 2.3 BDD feature file `features/swipe_gesture/swipe_gesture_left_swipe.feature` — FR2, FR3
- [x] 2.4 BDD feature file `features/swipe_gesture/swipe_gesture_velocity.feature` — FR4
- [x] 2.5 BDD feature file `features/swipe_gesture/swipe_gesture_suspension.feature` — FR5, FR6
- [x] 2.6 BDD feature file `features/swipe_gesture/swipe_gesture_edge_cases.feature` — FR7, FR8, FR9, FR10, FR11, FR12
- [x] 2.7 Step definitions for all swipe_gesture features
- [x] 2.8 Implement `useSwipeGesture` hook (`hooks/useSwipeGesture.ts`) — Pointer Events, bidirectional, velocity, suspension, clamping — FR1-FR12
- [x] 2.9 Unit tests for useSwipeGesture (vitest) — all scenarios from spec
- [x] 2.10 Mutation testing on useSwipeGesture — 82.84% (28 equivalent mutants in React internals) — NFR-P2

## 3. SwipeableItem Component (TDD)

- [x] 3.1 BDD feature file `features/swipeable_item/swipeable_item_rendering.feature` — FR13, FR14, NFR-A2
- [x] 3.2 Step definitions for swipeable_item features
- [x] 3.3 Implement `SwipeableItem` component (`components/shared/SwipeableItem.tsx`) — background layers, translateX, snap-back — FR13, FR14
- [x] 3.4 Unit tests for SwipeableItem (vitest + testing-library) — all scenarios from spec
- [x] 3.5 Mutation testing on SwipeableItem — 100%

## 4. SortableItem Component (TDD)

- [x] 4.1 BDD feature file `features/sortable_item/sortable_item_render_prop.feature` — FR15, FR16
- [x] 4.2 Step definitions for sortable_item features
- [x] 4.3 Implement `SortableItem` component (`components/shared/SortableItem.tsx`) — render-prop, useSortable, isDragging — FR15, FR16
- [x] 4.4 Unit tests for SortableItem (vitest + testing-library) — all scenarios from spec
- [x] 4.5 Mutation testing on SortableItem — 100%

## 5. Ideas in Deleted Entities (Bugfix, TDD)

- [x] 5.1 Add ideas subscription to `useDeletedEntities` — add `db.ideas.filter(i => i.is_deleted)`, update totalSubscriptions, update isEmpty check — FR19
- [x] 5.2 Add `restoreIdea` to `useRestoreEntity` using `IdeaService.restore()` — FR20
- [x] 5.3 Update BDD feature `features/deleted_entities/deleted_entities_aggregation.feature` — add ideas scenarios — FR19
- [x] 5.4 Update BDD feature `features/deleted_entities/deleted_entities_restore.feature` — add idea restore scenario — FR20
- [x] 5.5 Update step definitions for deleted_entities features
- [x] 5.6 Unit tests for useDeletedEntities with ideas — FR19
- [x] 5.7 Unit tests for useRestoreEntity with restoreIdea — FR20
- [x] 5.8 Mutation testing on useDeletedEntities (89.29%) and useRestoreEntity (100%) — overall 91.43%

## 6. Migrate TaskItem to SwipeableItem

- [x] 6.1 Remove swipe-related code from TaskItem (useSwipeAction import, swipe background JSX, translateX style, isSwipeEnabled logic) — FR17
- [x] 6.2 Wrap TaskItem usage sites with SwipeableItem (configure swipeRight for complete/uncomplete) — FR17, UX2, UX3
- [x] 6.3 Create `SortableItem` + `SwipeableItem` composition in TaskList (replace SortableTaskItem) — FR15, FR16, FR17
- [x] 6.4 Run `npx vitest run src/components/tasks/TaskItem` — verify all existing unit tests pass after migration
- [x] 6.5 Run `npx vitest run src/test/features/swipe_actions` — 27/27 long_press tests pass
- [x] 6.6 Run `npx vitest run src/components/tasks/TaskList` — verify TaskList tests pass with SortableItem
- [x] 6.7 Mutation testing — TaskList 93.98%, TaskItem 84.72% (CSS/scroll/deps survivors)

## 7. DeletedPage Swipe Restore + Ideas Section

- [x] 7.1 Add Ideas section to DeletedPage (collapsible, same pattern as other sections) — FR21
- [x] 7.2 Add i18n keys for ideas section to `locales/ru.json` and `locales/en.json` — FR21
- [x] 7.3 Wrap all deleted entity items in SwipeableItem with swipeRight={restore, blue, ArchiveRestore} — FR18, UX1
- [x] 7.4 Unit tests for DeletedPage ideas section — FR21
- [x] 7.5 Unit tests for DeletedPage swipe restore — FR18
- [x] 7.6 Mutation testing on DeletedPage — 95.51%

## 8. Cleanup and Remove Old Code

- [x] 8.1 Delete `useSwipeAction.ts` and all its test files (initial-state, left-swipe, above-threshold, below-threshold, edge-cases, test-utils)
- [x] 8.2 Delete old BDD features `features/swipe_actions/swipe_action_*.feature` and their step definitions (replaced by swipe_gesture features)
- [x] 8.3 Update any remaining imports of useSwipeAction across codebase
- [x] 8.4 Delete `SortableTaskItem` from TaskList.tsx (replaced by SortableItem)

## 9. BDD E2E Tests (playwright-bdd)

- [x] 9.1 BDD E2E feature `features/deleted_page_e2e/deleted_page_swipe_restore_e2e.feature` — swipe right restores entity on DeletedPage — FR18, M1
- [x] 9.2 BDD E2E feature `features/deleted_page_e2e/deleted_page_ideas_section_e2e.feature` — ideas appear in trash when soft-deleted — FR21, G4
- [x] 9.3 BDD E2E feature `features/task_swipe_e2e/task_swipe_complete_e2e.feature` — swipe right completes task on InboxPage — FR17, UX2
- [x] 9.4 BDD E2E feature `features/task_swipe_e2e/task_swipe_dnd_coexistence_e2e.feature` — DnD reorder works without accidental swipes — FR16, M5
- [x] 9.5 E2E step definitions for all above features

## 10. Final Verification

- [x] 10.1 Run full unit test suite `cd packages/client && npx vitest run` — verify no regressions — M4
- [x] 10.2 Run `pnpm run build` — verify build succeeds
- [x] 10.3 E2E: bddgen fixed (duplicate steps resolved), onboarding overlay fix, all 10 @swipeable-item tests pass — M1, M5
