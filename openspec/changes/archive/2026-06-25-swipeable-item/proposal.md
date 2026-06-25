# Swipeable Item

## Why

Deleted entities on DeletedPage can only be restored via a tiny button, which is inconvenient on mobile. Right swipe is the standard gesture for non-destructive actions (restore, pin) on iOS/Android, but the current swipe system (`useSwipeAction`) is hardcoded into TaskItem, supports only right swipe, and uses legacy Touch Events. Additionally, ideas are missing from the trash (bug in `useDeletedEntities`).

## What Changes

- ADDED: Universal `SwipeableItem` component with configurable actions in both directions
- ADDED: `useSwipeGesture` hook on Pointer Events with velocity-based triggering
- ADDED: Render-prop `SortableItem` component for swipe + drag-and-drop coordination
- ADDED: Right swipe to restore on DeletedPage (blue background, ArchiveRestore icon)
- ADDED: Ideas in trash (useDeletedEntities, useRestoreEntity, DeletedPage)
- MODIFIED: TaskItem — swipe logic extracted into SwipeableItem
- MODIFIED: TaskList — SortableTaskItem replaced with SortableItem + SwipeableItem
- REMOVED: `useSwipeAction` — replaced by `useSwipeGesture`

## Goals

- G1: User can restore any deleted entity via right swipe on DeletedPage
- G2: Swipe component is reusable on any page with any actions
- G3: Swipe and drag-and-drop coordinate correctly without gesture conflicts
- G4: Ideas appear in trash alongside other entity types

## Non-Goals

- NG1: Adding swipe-to-delete on list pages (Ideas, Goals, etc.) — separate change
- NG2: Slide-out / fade-out animation after swipe action
- NG3: Multiple actions per swipe direction (like iOS Mail: flag + more + delete)
- NG4: Migrating SortableGoalItem, SortableChecklistItem, etc. to SortableItem — separate change

## Users & Scenarios

- U1: Mobile user who wants to quickly restore a deleted task via swipe instead of aiming at a tiny button
- U2: User who accidentally deleted an idea and wants to find it in the trash
- U3: User who reorders tasks in Inbox and completes them via swipe — gestures must not conflict

## Requirements

### Functional

- FR1: `useSwipeGesture` SHALL use Pointer Events (pointerdown/pointermove/pointerup) instead of Touch Events
- FR2: `useSwipeGesture` SHALL support right and left swipe independently — each direction is optional
- FR3: `useSwipeGesture` SHALL call onAction on release when |translateX| >= distance threshold (40% of screen width)
- FR4: `useSwipeGesture` SHALL call onAction on release when velocity > velocity threshold, regardless of distance
- FR5: `useSwipeGesture` SHALL block swipe when `isSuspended = true` (DnD coordination)
- FR6: `useSwipeGesture` SHALL export `isSwiping` for external coordination
- FR7: `useSwipeGesture` SHALL clamp translateX at 1.5x threshold (rubber-band)
- FR8: `useSwipeGesture` SHALL cancel swipe on dominant vertical movement (absY > absX && absY > 10px)
- FR9: `useSwipeGesture` SHALL not start swipe on elements with `data-no-swipe`
- FR10: `useSwipeGesture` SHALL recalculate threshold on window resize
- FR11: `useSwipeGesture` SHALL reset state on pointerup (translateX=0, isThresholdReached=false)
- FR12: `useSwipeGesture` SHALL remove all event listeners on unmount
- FR13: `SwipeableItem` SHALL render background with color and icon from SwipeActionConfig during swipe
- FR14: `SwipeableItem` SHALL apply snap-back animation (300ms ease-out) on release
- FR15: `SortableItem` SHALL provide render-prop API with isDragging and dragHandleProps
- FR16: `SortableItem` SHALL pass isDragging to SwipeableItem.isSuspended to block swipe during drag
- FR17: TaskItem SHALL use SwipeableItem instead of built-in swipe logic
- FR18: DeletedPage SHALL wrap each deleted entity item in SwipeableItem with swipeRight={restore}
- FR19: `useDeletedEntities` SHALL include soft-deleted ideas in results
- FR20: `useRestoreEntity` SHALL provide `restoreIdea` function
- FR21: DeletedPage SHALL display an Ideas section with deleted ideas

### Non-Functional

#### Performance

- NFR-P1: Swipe animation SHALL run at 60fps — use CSS transform for GPU acceleration
- NFR-P2: useSwipeGesture SHALL avoid unnecessary re-renders — store intermediate values in refs
- NFR-P3: SwipeableItem SHALL apply `touch-action: pan-y` on the container to eliminate scroll/swipe ambiguity delay

#### Accessibility

- NFR-A1: Swipe SHALL NOT be the only way to perform the action — restore button must remain on DeletedPage
- NFR-A2: Swipe background SHALL have `aria-hidden="true"`

#### Responsive

- NFR-R1: SwipeableItem SHALL work correctly on screens from 320px to 2560px

## UX Acceptance Criteria

- UX1: Right swipe on DeletedPage — blue background with ArchiveRestore icon
- UX2: Right swipe on TaskItem (complete) — green background with Check icon
- UX3: Right swipe on TaskItem (uncomplete) — amber background with RotateCcw icon
- UX4: Snap-back animation 300ms ease-out on release below threshold
- UX5: Fast short swipe (high velocity) must trigger action even at short distance
- UX6: During drag (DnD) swipe is fully blocked — no visual response

## UI States Matrix

| Network | Data                   | UI State                                                           |
|---------|------------------------|--------------------------------------------------------------------|
| Online  | Has deleted entities   | List with sections, swipe enabled                                  |
| Online  | No deleted entities    | Empty state message                                                |
| Online  | Loading                | Loading spinner                                                    |
| Offline | Has deleted entities   | List with sections, swipe enabled, restore works locally           |
| Offline | No deleted entities    | Empty state message                                                |

## Behavior

- BDD specs: `features/swipe_gesture/*.feature` (@swipeable-item tags)
- BDD specs: `features/deleted_entities/*.feature` (@swipeable-item tags)

## Visual Reference

- Restore color: `bg-blue-500` (Tailwind)
- Complete color: `bg-green-500`
- Uncomplete color: `bg-amber-500`
- Icons: lucide-react (ArchiveRestore, Check, RotateCcw)

## Affected IA

No changes to information architecture.

## Success Metrics

- M1: All deleted entities (including ideas) can be restored via swipe on DeletedPage
- M2: TaskItem uses SwipeableItem — swipe logic removed from TaskItem
- M3: Mutation score >= 95% on useSwipeGesture
- M4: No regressions: all existing BDD/unit tests pass
- M5: Swipe and DnD do not conflict — task reordering works without accidental swipes

## Capabilities

### New Capabilities

- `swipe-gesture`: Headless hook useSwipeGesture with Pointer Events, bidirectional swipe, velocity threshold, and DnD coordination
- `swipeable-item`: UI component SwipeableItem with configurable swipe actions (color, icon, direction)
- `sortable-item`: Render-prop component SortableItem for integrating @dnd-kit with SwipeableItem

### Modified Capabilities

- `deleted-entities`: Add ideas to deleted entities aggregation, restoreIdea, Ideas section on DeletedPage, swipe to restore
- `swipe-actions`: Replace useSwipeAction with useSwipeGesture in TaskItem, migrate swipe logic to SwipeableItem

## Impact

- `packages/client/src/hooks/useSwipeAction.ts` — deleted, replaced by useSwipeGesture
- `packages/client/src/hooks/useSwipeGesture.ts` — new file
- `packages/client/src/components/shared/SwipeableItem.tsx` — new file
- `packages/client/src/components/shared/SortableItem.tsx` — new file
- `packages/client/src/components/tasks/TaskItem.tsx` — remove swipe logic
- `packages/client/src/components/tasks/TaskList.tsx` — replace SortableTaskItem with SortableItem + SwipeableItem
- `packages/client/src/hooks/useDeletedEntities.ts` — add ideas
- `packages/client/src/hooks/useRestoreEntity.ts` — add restoreIdea
- `packages/client/src/pages/DeletedPage.tsx` — add ideas section, SwipeableItem
- `packages/client/src/constants/index.ts` — new constants for velocity threshold
- All useSwipeAction tests — adapt to useSwipeGesture
