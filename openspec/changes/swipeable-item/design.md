# Design: swipeable-item

## Context

The current swipe system is tightly coupled to TaskItem: `useSwipeAction` supports only right swipe via Touch Events, and the visual part (background, icons) is embedded directly in TaskItem. This prevents reuse on other pages (DeletedPage, GoalsPage, IdeasPage).

The DnD system (@dnd-kit) uses `PointerSensor` + `TouchSensor` with activation on the drag handle via `setActivatorNodeRef`. Swipe and DnD are currently isolated by the `data-no-swipe` attribute on the drag handle, but there is no explicit state coordination (isDragging <-> isSwiping).

## Goals / Non-Goals

**Goals:**
- Create a reusable swipe component with configurable actions (FR13, FR14)
- Migrate to Pointer Events for a unified touch/mouse/pen API (FR1)
- Add velocity-based triggering (FR4)
- Ensure DnD coordination (FR5, FR6, FR15, FR16)
- Fix ideas missing from trash (FR19, FR20, FR21)

**Non-Goals:**
- Multiple actions per direction (NG3)
- Migrating all Sortable*Item components (NG4)

## Decisions

### D1: Pointer Events instead of Touch Events

**Decision**: `useSwipeGesture` uses Pointer Events API.

**Rationale**: Pointer Events provide a unified API for touch, mouse, and pen. @dnd-kit already uses PointerSensor. This eliminates parallel event streams (touch + pointer).

**Alternative**: Keep Touch Events — simpler, but creates two parallel event processing streams with DnD.

**Caveat**: Do NOT use `setPointerCapture` — it would block pointer events for @dnd-kit PointerSensor. Instead, listen to `pointermove` on `document` after `pointerdown`.

### D2: Three-layer composition (useSwipeGesture -> SwipeableItem -> SortableItem)

**Decision**: Three layers with clear responsibilities:

```
SortableItem (DnD, render-prop)
  -> SwipeableItem (swipe UI, background + translateX)
       -> useSwipeGesture (headless hook, pointer events + state)
```

**Rationale**: Each layer can be used independently. DeletedPage uses only SwipeableItem (no DnD). Pages with DnD wrap in SortableItem. The headless hook can be reused for custom components.

**Alternative**: Compound Component (SwipeableItem.DragHandle + SwipeableItem.Content) — more verbose, overkill for a single content slot.

### D3: SortableItem as render-prop instead of separate SortableXxxItem per entity

**Decision**: A single universal `SortableItem` with render-prop API.

```tsx
<SortableItem id={task.id}>
  {({ isDragging, dragHandleProps }) => (
    <SwipeableItem isSuspended={isDragging} ...>
      <TaskItem dragHandleProps={dragHandleProps} ... />
    </SwipeableItem>
  )}
</SortableItem>
```

**Rationale**: Eliminates duplication of SortableTaskItem, SortableGoalItem, etc. — they all do the same thing (useSortable + style + ref). Render-prop gives consumers control over internal structure.

**Alternative**: Keep the current SortableXxxItem-per-entity pattern — more files, familiar, but does not scale.

### D4: Swipe <-> DnD coordination via prop-drilling isDragging/isSwiping

**Decision**: `SortableItem` passes `isDragging` from `useSortable()` -> `SwipeableItem.isSuspended`. `useSwipeGesture` exports `isSwiping`. @dnd-kit manages blocking via `setActivatorNodeRef` (DnD activates only on the drag handle).

```
Coordination:
- isDragging=true -> SwipeableItem.isSuspended=true -> swipe blocked
- isSwiping=true -> drag handle still works, but DnD does not start
  (because DnD activates only on drag handle with data-no-swipe,
  and swipe does not react to data-no-swipe — spatial separation)
```

**Rationale**: Minimal approach — no Context, no State Machine. Sufficient thanks to spatial separation (drag handle vs rest of content). @dnd-kit TouchSensor with delay=250ms does not conflict with swipe because the sensor is bound to activatorNodeRef.

**Alternative**: GestureContext with a shared state machine (idle/touching/swiping/dragging) — more robust, but overengineering for the current drag-handle usage.

### D5: Velocity threshold

**Decision**: Add velocity-based triggering. If `velocity > SWIPE_VELOCITY_THRESHOLD_PX_PER_MS` (0.5 px/ms) at pointerup, the action fires regardless of distance.

**Computation**: velocity = deltaX / deltaTime between the last two pointermove events.

**Rationale**: Standard UX pattern. A fast short swipe should work — the user expresses clear intent through speed, not distance.

### D6: Removing useSwipeAction, backward compatibility

**Decision**: Delete `useSwipeAction.ts` and all its test files. Replace with `useSwipeGesture`. Rewrite tests for the new hook.

**Rationale**: Two hooks for the same purpose creates confusion. The new hook fully covers the old one's functionality.

### D7: Ideas in trash

**Decision**: Add ideas to `useDeletedEntities` (subscribe to `db.ideas.filter(i => i.is_deleted)`), add `restoreIdea` to `useRestoreEntity`, add Ideas section to DeletedPage.

**Rationale**: Bug — ideas already support soft delete and restore (IdeaService) but are not displayed in the trash.

### D8: touch-action: pan-y on SwipeableItem

**Decision**: Apply `touch-action: pan-y` CSS on the SwipeableItem container.

**Rationale**: Tells the browser to handle vertical scrolling natively while delegating horizontal gestures to JavaScript. Eliminates the ~100ms ambiguity delay on mobile and ensures `pointermove` fires reliably for horizontal movement. One line of CSS that removes an entire class of scroll/swipe coordination problems.

## Risks / Trade-offs

- **[Risk] Regression in TaskItem when extracting swipe logic** -> Mitigation: existing BDD tests for swipe actions cover behavior. Adapt tests to the new hook before refactoring TaskItem.

- **[Risk] Pointer Events may behave differently on older mobile browsers** -> Mitigation: Pointer Events are supported by all current browsers (Can I Use: 97%+). PWA does not support legacy browsers.

- **[Risk] Velocity threshold may be too sensitive or not sensitive enough** -> Mitigation: extract threshold to constant `SWIPE_VELOCITY_THRESHOLD_PX_PER_MS`, easy to tune.

- **[Trade-off] Only TaskList SortableTaskItem -> SortableItem migration** — other Sortable*Item components remain in the old pattern until a separate change. Temporary inconsistency in the codebase.
