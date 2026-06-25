Feature: Swipe gesture right swipe behavior
  Implements FR2, FR3 of swipeable-item.

  @swipeable-item @FR2
  Scenario: Right swipe tracked when swipeRight configured
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right by 40 pixels
    Then translateX equals 40
    And direction is "right"

  @swipeable-item @FR2
  Scenario: activeAction matches right config during right swipe
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right by 40 pixels
    Then activeAction equals the swipeRight config

  @swipeable-item @FR3
  Scenario: Threshold reached on sufficient right swipe
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right to exactly the threshold distance
    Then isThresholdReached is true

  @swipeable-item @FR3
  Scenario: Threshold not reached on insufficient right swipe
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right to threshold minus 1 pixel
    Then isThresholdReached is false

  @swipeable-item @FR3
  Scenario: Right action fires on release past threshold
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right past threshold and releases
    Then swipeRight onAction is called once

  @swipeable-item @FR3
  Scenario: Action does not fire on release below threshold
    Given useSwipeGesture is rendered with swipeRight configured
    When user swipes right below threshold and releases with low velocity
    Then swipeRight onAction is not called
