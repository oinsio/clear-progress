# Drag and Drop Specs

## Why

Drag-and-drop reordering is implemented across all entity lists (tasks, goals, ideas, contexts, categories, checklist items, menu order), but the DnD-specific behavior lacks a formal specification and BDD tests. The shared `useDndSensors` hook configures platform-specific sensor parameters (pointer distance for desktop, touch delay for mobile), and every list page follows the same handleDragEnd pattern. Without specs, the sensor configuration thresholds and the drag-end handler contract are undocumented.

## What Changes

- ADDED: Specification for DnD sensor configuration (useDndSensors hook)
- ADDED: Specification for drag-end handler pattern (arrayMove + reorder delegation)
- ADDED: BDD unit tests for useDndSensors sensor configuration
- ADDED: BDD unit tests for drag-end handler logic (TaskList handleDragEnd)

## Goals

- G1: Document DnD sensor configuration behavior in executable specifications
- G2: Cover useDndSensors and drag-end handler logic with BDD unit tests

## Non-Goals

- NG1: Do not modify existing implementation code
- NG2: Do not add E2E tests for drag interactions (requires real pointer events)
- NG3: Do not test dnd-kit library internals (sensor activation, collision detection)
- NG4: Do not re-test entity reorder service logic (already covered in tasks_reorder, checklists_reorder, etc.)

## Users & Scenarios

- U1: User drags a task on desktop — pointer sensor activates after 8px movement distance
- U2: User long-presses a task on mobile — touch sensor activates after 250ms delay with 5px tolerance
- U3: User completes a drag — items are reordered via arrayMove and delegated to the reorder service
- U4: User drops item on itself — no reorder occurs (no-op)
- U5: User drops item with no valid target — no reorder occurs (no-op)

## Requirements

### Functional

- FR1: useDndSensors SHALL configure a PointerSensor with distance activation constraint of 8px
- FR2: useDndSensors SHALL configure a TouchSensor with delay activation constraint of 250ms and tolerance of 5px
- FR3: useDndSensors SHALL return both sensors via useSensors for use in DndContext
- FR4: handleDragEnd SHALL skip reorder when the drop target is null (no valid target)
- FR5: handleDragEnd SHALL skip reorder when the active item ID equals the over item ID (same position)
- FR6: handleDragEnd SHALL compute old and new indices from the items array and call arrayMove
- FR7: handleDragEnd SHALL delegate the reordered array to the entity-specific reorder callback

### Non-Functional

#### Accessibility
- NFR-A1: Drag handles SHALL have descriptive aria-labels for screen readers
- NFR-A2: Drag handles SHALL use the GripVertical icon as a visual affordance

## UX Acceptance Criteria

- UX1: Dragged item shows reduced opacity (0.4-0.5) during drag
- UX2: Drag handle shows grab cursor on hover and grabbing cursor when active
- UX3: On mobile, drag activates only after a deliberate long-press (not on quick tap)

## Behavior

Reference to feature files:
- `features/drag_and_drop/drag_and_drop_sensors.feature` (@drag-and-drop-spec tags)
- `features/drag_and_drop/drag_and_drop_handler.feature` (@drag-and-drop-spec tags)

## Affected IA

No changes.

## Success Metrics

- M1: Spec covers FR1-FR7 with executable scenarios
- M2: BDD unit tests pass for all scenarios
- M3: All existing tests remain green after adding new specs

## Capabilities

### New Capabilities
- `drag-and-drop`: DnD sensor configuration and drag-end handler pattern — shared across all entity lists

### Modified Capabilities

None.

## Impact

- New files: `openspec/specs/drag-and-drop/spec.md`, BDD features + steps
- Existing code is not modified
