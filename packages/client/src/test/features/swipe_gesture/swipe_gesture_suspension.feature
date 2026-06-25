Feature: Swipe gesture suspension and isSwiping
  Implements FR5, FR6 of swipeable-item.

  @swipeable-item @FR5
  Scenario: Suspended hook ignores pointer events
    Given useSwipeGesture is rendered with isSuspended true
    When user swipes right past threshold and releases
    Then translateX remains 0
    And swipeRight onAction is not called

  @swipeable-item @FR5
  Scenario: Active swipe cancelled on suspension
    Given useSwipeGesture is rendered with swipeRight configured
    When user is mid-swipe and isSuspended becomes true
    Then translateX resets to 0
    And isSwiping becomes false

  @swipeable-item @FR6
  Scenario: isSwiping becomes true during drag
    Given useSwipeGesture is rendered with swipeRight configured
    When user drags horizontally beyond drag start threshold
    Then isSwiping is true

  @swipeable-item @FR6
  Scenario: isSwiping resets on release
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right and releases
    Then isSwiping is false
