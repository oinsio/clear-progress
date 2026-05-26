# Drag and Drop

Shared drag-and-drop reordering mechanics used across all entity list pages (tasks, goals, ideas, contexts, categories, checklist items, menu order). Configures platform-specific DnD sensors and follows a consistent drag-end handler pattern that delegates to entity-specific reorder services.

## Requirements

### Requirement: Pointer sensor configuration

useDndSensors SHALL configure a PointerSensor with a distance activation constraint of 8 pixels. This prevents accidental drags on desktop when the user intends to click. Implements FR1 of drag-and-drop-spec.

#### Scenario: Pointer sensor uses distance constraint

- **WHEN** useDndSensors is called
- **THEN** the returned sensors include a PointerSensor with distance constraint of 8px

### Requirement: Touch sensor configuration

useDndSensors SHALL configure a TouchSensor with a delay activation constraint of 250 milliseconds and a movement tolerance of 5 pixels. This ensures drag activates only on deliberate long-press on mobile, not on quick taps or scrolls. Implements FR2 of drag-and-drop-spec.

#### Scenario: Touch sensor uses delay and tolerance constraints

- **WHEN** useDndSensors is called
- **THEN** the returned sensors include a TouchSensor with delay of 250ms and tolerance of 5px

### Requirement: Combined sensor output

useDndSensors SHALL return both sensors combined via useSensors, ready for passing to DndContext. Implements FR3 of drag-and-drop-spec.

#### Scenario: Hook returns two sensors

- **WHEN** useDndSensors is called
- **THEN** the result contains exactly 2 sensor entries

### Requirement: Drag-end no-op on null target

handleDragEnd SHALL not invoke the reorder callback when the drop target (over) is null, i.e. the item was dropped outside any valid drop zone. Implements FR4 of drag-and-drop-spec.

#### Scenario: Drop outside valid zone is ignored

- **GIVEN** a list of 3 items
- **WHEN** user drops an item with no valid target (over is null)
- **THEN** the reorder callback is not called

### Requirement: Drag-end no-op on same position

handleDragEnd SHALL not invoke the reorder callback when the active item ID equals the over item ID, i.e. the item was dropped back to its original position. Implements FR5 of drag-and-drop-spec.

#### Scenario: Drop on same position is ignored

- **GIVEN** a list of 3 items
- **WHEN** user drops item A onto item A
- **THEN** the reorder callback is not called

### Requirement: Drag-end computes reordered array

handleDragEnd SHALL find the old index and new index of the dragged item in the items array, apply arrayMove, and produce a reordered array. Implements FR6 of drag-and-drop-spec.

#### Scenario: Item moved from position 0 to position 2

- **GIVEN** items [A, B, C]
- **WHEN** user drags A and drops onto C
- **THEN** the reordered array is [B, C, A]

#### Scenario: Item moved from position 2 to position 0

- **GIVEN** items [A, B, C]
- **WHEN** user drags C and drops onto A
- **THEN** the reordered array is [C, A, B]

### Requirement: Drag-end delegates to reorder callback

handleDragEnd SHALL call the entity-specific reorder callback with the reordered array. Implements FR7 of drag-and-drop-spec.

#### Scenario: Reorder callback receives reordered items

- **GIVEN** items [A, B, C] and a reorder callback
- **WHEN** user drags B and drops onto A
- **THEN** the reorder callback is called with [B, A, C]
