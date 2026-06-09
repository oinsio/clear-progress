# Capability: Tasks — Delta Spec (fractional-sort-order)

## MODIFIED: sort_order field type
# implements FR1 of fractional-sort-order

`sort_order` field MUST be a lexicographically sortable string generated via fractional indexing. Replaces integer `sort_order`.

## MODIFIED: Task sort direction
# implements FR2 of fractional-sort-order

All task list queries MUST sort by `sort_order` **descending** (higher key = top of list). Replaces ascending integer sort.

### Scenario: Tasks sorted by sort_order descending
- **GIVEN** tasks with sort_order "a2", "a0", "a1"
- **WHEN** user gets tasks by box
- **THEN** tasks are returned in order: "a2", "a1", "a0"

## MODIFIED: Task creation — insert at top of box
# implements FR3 of fractional-sort-order

When creating a task, `sort_order` MUST be generated as a key above the current maximum `sort_order` in the target box (global, not filtered). The new task appears at the top of the box list.

### Scenario: New task appears at top of box
- **GIVEN** today box has tasks with sort_order "a1", "a0"
- **WHEN** user creates a new task in today box
- **THEN** new task has sort_order greater than "a1"
- **AND** new task appears first when sorted descending

### Scenario: New task from Goal Detail uses global box maximum
- **GIVEN** today box has tasks with sort_order "a2", "a1", "a0"
- **AND** goal "Fitness" contains tasks "a2" and "a0"
- **WHEN** user creates a task for goal "Fitness" in today box
- **THEN** new task has sort_order greater than "a2" (global max, not goal max)

## MODIFIED: Task box transfer — insert at top of new box
# implements FR4 of fractional-sort-order

When moving a task to a different box, `sort_order` MUST be recalculated as a key above the current maximum in the destination box.

### Scenario: Moved task appears at top of destination box
- **GIVEN** task "Buy groceries" is in inbox with sort_order "a1"
- **AND** today box has tasks with sort_order "a3", "a2"
- **WHEN** user moves task to today
- **THEN** task sort_order is greater than "a3"
- **AND** task appears first in today

### Scenario: Move to same box is no-op
- **GIVEN** task "Buy groceries" is in inbox with sort_order "a1"
- **WHEN** user moves task to inbox (same box)
- **THEN** sort_order remains "a1", needsSync remains false

## MODIFIED: Task uncomplete — insert at top of box
# implements FR5 of fractional-sort-order

When returning a task from completed state, `sort_order` MUST be recalculated as a key above the current maximum in the task's box.

### Scenario: Uncompleted task appears at top of box
- **GIVEN** completed task "Buy groceries" was in today box
- **AND** today box has tasks with sort_order "a3", "a2"
- **WHEN** user uncompletes the task
- **THEN** task sort_order is greater than "a3"
- **AND** task appears first in today

## MODIFIED: Drag-and-drop reorder — single record update
# implements FR6 of fractional-sort-order

Drag-and-drop MUST generate a new `sort_order` key between the two neighbors in the current view. Only the dragged task is updated.

### Scenario: Reorder updates only dragged task
- **GIVEN** tasks A (sort_order="a2"), B ("a1"), C ("a0") in today
- **WHEN** user drags C between A and B
- **THEN** C has new sort_order between "a1" and "a2"
- **AND** A and B sort_order values are unchanged

### Scenario: Reorder to first position
- **GIVEN** tasks A ("a2"), B ("a1"), C ("a0") in today
- **WHEN** user drags C to first position (before A)
- **THEN** C has sort_order greater than "a2"
- **AND** A and B are unchanged

### Scenario: Reorder to last position
- **GIVEN** tasks A ("a2"), B ("a1"), C ("a0") in today
- **WHEN** user drags A to last position (after C)
- **THEN** A has sort_order less than "a0"
- **AND** B and C are unchanged

## ADDED: Lazy rebalancing
# implements FR9 of fractional-sort-order

When a newly generated sort_order key exceeds 10 characters, the system MUST rebalance all tasks in the same box with evenly distributed keys preserving current display order.

### Scenario: Rebalancing triggered by long key
- **GIVEN** today box has tasks with deeply nested sort_order keys
- **WHEN** a drag-drop produces a key longer than 10 characters
- **THEN** all tasks in today box get fresh evenly distributed keys
- **AND** display order is preserved
- **AND** all rebalanced tasks are marked needsSync=true

### Scenario: Rebalancing not triggered for short keys
- **GIVEN** today box has tasks with short sort_order keys
- **WHEN** a drag-drop produces a key of 4 characters
- **THEN** only the dragged task is updated
