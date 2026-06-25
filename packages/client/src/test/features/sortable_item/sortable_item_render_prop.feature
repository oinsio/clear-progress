Feature: SortableItem render-prop API
  Implements FR15, FR16 of swipeable-item.

  @swipeable-item @FR15
  Scenario: Children receive isDragging and dragHandleProps
    When SortableItem renders with a render-prop child
    Then the child receives isDragging as false
    And the child receives dragHandleProps with ref and attributes

  @swipeable-item @FR15
  Scenario: isDragging is true during drag
    Given useSortable returns isDragging true
    When SortableItem renders with a render-prop child
    Then the child receives isDragging as true

  @swipeable-item @FR15
  Scenario: Vertical transform applied during drag
    Given useSortable returns a vertical transform
    When SortableItem renders with a render-prop child
    Then the wrapper has translate3d with the vertical offset

  @swipeable-item @FR15
  Scenario: No transform at rest
    When SortableItem renders with a render-prop child
    Then the wrapper has no transform applied

  @swipeable-item @FR15
  Scenario: SortableItem uses provided id
    When SortableItem renders with a specific id
    Then useSortable is called with that id

  @swipeable-item @FR15
  Scenario: Opacity reduced while dragging
    Given useSortable returns isDragging true
    When SortableItem renders with a render-prop child
    Then the wrapper has opacity 0.5
