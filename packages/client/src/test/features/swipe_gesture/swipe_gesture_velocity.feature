Feature: Swipe gesture velocity-based triggering
  Implements FR4 of swipeable-item.

  @swipeable-item @FR4
  Scenario: Fast short swipe triggers action
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right with high velocity but below distance threshold
    Then swipeRight onAction is called once

  @swipeable-item @FR4
  Scenario: Slow swipe below distance does not trigger
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right with low velocity and below distance threshold
    Then swipeRight onAction is not called
