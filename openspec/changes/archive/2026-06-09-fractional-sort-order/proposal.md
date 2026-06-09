# Fractional Sort Order

## Why

Currently, `sort_order` is an integer field (0, 1, 2...) shared across all views. This causes two problems:

1. **Cross-view conflicts**: A task has one `sort_order`, but appears on multiple pages (box page, goal detail, category detail, context detail). Reordering on one page disrupts order on another. Integer-based reorder recalculates ALL indices via `bulkUpsert`, so every task in the list gets `needsSync=true` and syncs to the server.

2. **Unpredictable insertion**: New tasks get `sort_order = existingTasks.length` (end of the box). On filtered pages (goal/category/context detail), this places the task at an arbitrary position because the index is relative to the global box, not the filtered list.

Additionally, Category Detail and Context Detail pages are missing drag-and-drop reordering (bug).

## What Changes

### MODIFIED: sort_order field type

`sort_order` changes from integer to string (fractional indexing keys) across all entities: tasks, goals, ideas, categories, contexts, checklist items.

### MODIFIED: Task sort direction

Tasks sort by `sort_order` **descending** (higher key = top of list). This enables "insert at top" with a single record write.

### MODIFIED: Task creation positioning

New tasks appear at the **top** of the box list instead of the bottom.

### MODIFIED: Task box transfer positioning

Tasks moved between boxes appear at the **top** of the destination box.

### MODIFIED: Task uncomplete positioning

Tasks returned from completed state appear at the **top** of their box.

### MODIFIED: Reorder write efficiency

Drag-and-drop updates **1 record** instead of all records in the list.

### ADDED: Drag-and-drop on Category and Context Detail pages

### ADDED: Lazy rebalancing when keys grow too long

### UNCHANGED: Non-task entity sort direction

Goals, ideas, categories, contexts, and checklist items continue to sort **ascending** (lower key = top of list). New entities are appended to the end.

## Goals

- G1: Predictable task positioning on all pages
- G2: Minimal database writes on reorder/insert/move operations (1 record per operation)
- G3: Consistent drag-and-drop across all task list pages

## Non-Goals

- NG1: Independent sort order per view (separate sort_order for each goal/category/context) — too complex, one sort_order with smart positioning is sufficient
- NG2: Collaborative real-time reordering — single-user app
- NG3: Changing positioning rules for non-task entities — goals, ideas, categories, contexts, and checklist items keep append-to-end behavior

## Users & Scenarios

- U1: User creates a task from Today page — sees it immediately at the top of Today
- U2: User creates a task from Goal Detail page (Today section) — sees it at the top of the section, and it also appears at the top of the global Today page
- U3: User drags a task on Goal Detail page — task moves to exact position within the goal; position in global box shifts proportionally (acceptable side effect)
- U4: User moves a task from Inbox to Today — task appears at the top of Today
- U5: User uncompletes a task — task reappears at the top of its box
- U6: User reorders tasks on Category/Context Detail page — drag-and-drop works (currently broken)

## Requirements

### Functional

#### FR1: Fractional indexing for sort_order

`sort_order` field MUST change from `number` to `string` across all entities (tasks, goals, ideas, categories, contexts, checklist items). Keys MUST be lexicographically sortable. The `fractional-indexing` npm package MUST be used for key generation.

#### FR2: Task sort direction — descending

All task list queries MUST sort by `sort_order` **descending** (higher key = top of list).

#### FR3: Task creation — insert at top of box

When creating a task, `sort_order` MUST be generated as a key above the current maximum `sort_order` in the target box (global, not filtered). The new task appears at the top of the box list.

#### FR4: Task box transfer — insert at top of new box

When moving a task to a different box, `sort_order` MUST be recalculated as a key above the current maximum in the **destination** box. The task appears at the top of its new box.

#### FR5: Task uncomplete — insert at top of box

When returning a task from completed state, `sort_order` MUST be recalculated as a key above the current maximum in the task's box.

#### FR6: Drag-and-drop reorder — single record update

When a user reorders via drag-and-drop, the system MUST generate a new `sort_order` key between the two neighbors in the **current view**. Only the dragged item's record MUST be updated. Other items' `sort_order` values MUST NOT change.

#### FR7: Drag-and-drop on Category and Context Detail pages

Category Detail and Context Detail pages MUST support drag-and-drop reordering within each box section, consistent with Goal Detail and box pages behavior.

#### FR8: Non-task entity sort direction — ascending

Goals, ideas, categories, contexts, and checklist items MUST sort by `sort_order` **ascending** (lower key = top of list). New entities MUST be created with a key above the current maximum (end of list).

#### FR9: Lazy rebalancing

When a newly generated `sort_order` key exceeds 10 characters, the system MUST trigger rebalancing of the affected scope:
- For tasks: all tasks in the same box
- For checklist items: all items of the same task
- For other entities: all entities of that type (all goals, all categories, etc.)

Rebalancing MUST regenerate evenly distributed keys for all items in the scope while preserving current display order. All rebalanced items MUST be marked `needsSync=true`.

#### FR10: Data migration

Existing integer `sort_order` values MUST be migrated to fractional indexing string keys preserving the current relative order. Migration MUST handle the sort direction change for tasks (ascending integers to descending strings).

## UX Acceptance Criteria

- UX1: New tasks always appear at the top of the list on the page where they were created
- UX2: Tasks moved between boxes appear at the top of the destination box
- UX3: Tasks returned from completed state appear at the top of their box
- UX4: Drag-and-drop on any page places the task exactly where the user dropped it
- UX5: Drag-and-drop on a filtered page (goal/category/context) does not visibly disrupt order on that page
- UX6: Category and Context detail pages support drag-and-drop reordering

## Success Metrics

- M1: Reorder/insert/move operations update exactly 1 database record (down from N)
- M2: `needsSync` is set on exactly 1 entity per operation (down from N)
- M3: All existing sort orders are preserved after migration (no visual change for user)
- M4: Mutation test score >= 95% on new sort order logic
