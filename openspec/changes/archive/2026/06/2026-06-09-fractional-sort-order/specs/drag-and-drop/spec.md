# Capability: Drag and Drop — Delta Spec (fractional-sort-order)

## ADDED: Drag-and-drop on Category Detail page
# implements FR7 of fractional-sort-order

Category Detail page MUST support drag-and-drop reordering within each box section, using the same mechanics as Goal Detail and box pages.

### Scenario: Reorder tasks within category box section
- **GIVEN** category "Work" has tasks A and B in today section
- **WHEN** user drags B before A
- **THEN** B appears before A in the category today section
- **AND** only B's sort_order is updated

## ADDED: Drag-and-drop on Context Detail page
# implements FR7 of fractional-sort-order

Context Detail page MUST support drag-and-drop reordering within each box section, using the same mechanics as Goal Detail and box pages.

### Scenario: Reorder tasks within context box section
- **GIVEN** context "Home" has tasks A and B in today section
- **WHEN** user drags B before A
- **THEN** B appears before A in the context today section
- **AND** only B's sort_order is updated

## MODIFIED: Drag-end handler uses fractional key instead of arrayMove
# implements FR6 of fractional-sort-order

handleDragEnd MUST calculate a fractional key between the neighbors at the drop position instead of calling arrayMove + sequential reindex. Only the dragged item is passed to the reorder callback.

### Scenario: Drag-end calculates key between neighbors
- **WHEN** user drops item between two existing items
- **THEN** system generates a key between the neighbors' sort_order values
- **AND** only the dropped item is updated (not the entire list)
