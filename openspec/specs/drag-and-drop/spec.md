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

### Requirement: Drag-end computes fractional key between neighbors

handleDragEnd SHALL calculate a fractional key between the neighbors at the drop position instead of calling arrayMove + sequential reindex. Only the dragged item is passed to the reorder callback. Implements FR6 of drag-and-drop-spec, FR6 of fractional-sort-order.

#### Scenario: Drag-end calculates key between neighbors
- **WHEN** user drops item between two existing items
- **THEN** system generates a key between the neighbors' sort_order values
- **AND** only the dropped item is updated (not the entire list)

#### Scenario: Item moved from position 0 to position 2

- **GIVEN** items [A, B, C]
- **WHEN** user drags A and drops onto C
- **THEN** A gets a new sort_order key below C's key

#### Scenario: Item moved from position 2 to position 0

- **GIVEN** items [A, B, C]
- **WHEN** user drags C and drops onto A
- **THEN** C gets a new sort_order key above A's key

### Requirement: Drag-end delegates to reorder callback

handleDragEnd SHALL call the entity-specific reorder callback with the dragged item and its new sort_order. Implements FR7 of drag-and-drop-spec.

#### Scenario: Reorder callback receives dragged item update

- **GIVEN** items [A, B, C] and a reorder callback
- **WHEN** user drags B and drops onto A
- **THEN** the reorder callback is called with B's ID and its new sort_order

### Requirement: Drag-and-drop on Category Detail page
# implements FR7 of fractional-sort-order

Category Detail page MUST support drag-and-drop reordering within each box section, using the same mechanics as Goal Detail and box pages.

#### Scenario: Reorder tasks within category box section
- **GIVEN** category "Work" has tasks A and B in today section
- **WHEN** user drags B before A
- **THEN** B appears before A in the category today section
- **AND** only B's sort_order is updated

### Requirement: Drag-and-drop on Context Detail page
# implements FR7 of fractional-sort-order

Context Detail page MUST support drag-and-drop reordering within each box section, using the same mechanics as Goal Detail and box pages.

#### Scenario: Reorder tasks within context box section
- **GIVEN** context "Home" has tasks A and B in today section
- **WHEN** user drags B before A
- **THEN** B appears before A in the context today section
- **AND** only B's sort_order is updated
