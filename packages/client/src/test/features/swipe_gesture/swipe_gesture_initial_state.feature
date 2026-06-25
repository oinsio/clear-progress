Feature: Swipe gesture initial state and pointer events
  Implements FR1 of swipeable-item.

  @swipeable-item @FR1
  Scenario: Initial state values are defaults
    When useSwipeGesture is rendered with a valid ref
    Then translateX is 0
    And isThresholdReached is false
    And direction is null
    And isSwiping is false
    And activeAction is null

  @swipeable-item @FR1
  Scenario: Pointerdown listener attached to element
    When useSwipeGesture mounts with a valid ref
    Then pointerdown listener is attached to the element

  @swipeable-item @FR1
  Scenario: Document listeners attached after pointerdown
    Given useSwipeGesture is rendered with swipeRight configured
    When pointerdown fires and pointer moves right
    Then translateX reflects the pointer movement
