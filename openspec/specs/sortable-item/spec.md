# Sortable Item

Render-prop component `SortableItem` that integrates @dnd-kit's useSortable with SwipeableItem. Provides isDragging and dragHandleProps to children via render-prop API. Implements FR15, FR16 of swipeable-item.

## Requirements

### Requirement: SortableItem render-prop API

SortableItem SHALL accept children as a render function that receives isDragging, dragHandleProps, and style. SortableItem SHALL call useSortable internally and wrap children in a positioned container with transform and transition styles. Implements FR15 of swipeable-item.

#### Scenario: Children receive isDragging and dragHandleProps

- **WHEN** SortableItem renders with a render-prop child
- **THEN** the child function is called with isDragging (boolean), dragHandleProps (ref, attributes, listeners), and the child is wrapped in a positioned element

#### Scenario: isDragging is true during active drag

- **WHEN** user drags the item via drag handle
- **THEN** isDragging is true and item opacity is reduced

#### Scenario: isDragging is false at rest

- **WHEN** no drag is in progress
- **THEN** isDragging is false and item has full opacity

### Requirement: SortableItem applies DnD transform

SortableItem SHALL apply vertical translate3d transform from useSortable to the container element. Horizontal transform SHALL be ignored (only Y-axis). Implements FR15 of swipeable-item.

#### Scenario: Vertical transform applied during drag

- **WHEN** item is being dragged vertically
- **THEN** container style includes translate3d(0, Ypx, 0)

#### Scenario: No transform at rest

- **WHEN** no drag is in progress
- **THEN** container has no transform

### Requirement: SortableItem coordinates with SwipeableItem

SortableItem SHALL provide isDragging to consumers so they can pass it as isSuspended to SwipeableItem. This enables blocking swipe during drag. Implements FR16 of swipeable-item.

#### Scenario: isDragging blocks swipe via isSuspended

- **WHEN** isDragging is true and SwipeableItem receives isSuspended=isDragging
- **THEN** swipe is blocked during drag

### Requirement: SortableItem requires id prop

SortableItem SHALL accept a string id prop and pass it to useSortable. Implements FR15 of swipeable-item.

#### Scenario: SortableItem uses provided id

- **WHEN** SortableItem is rendered with id="task-123"
- **THEN** useSortable is called with id "task-123"
