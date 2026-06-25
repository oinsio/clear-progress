Feature: Swipe gesture left swipe behavior
  Implements FR2, FR3 of swipeable-item.

  @swipeable-item @FR2
  Scenario: Left swipe tracked when swipeLeft configured
    Given useSwipeGesture is rendered with swipeLeft configured
    When user swipes left by 40 pixels
    Then translateX equals -40
    And direction is "left"

  @swipeable-item @FR2
  Scenario: activeAction matches left config during left swipe
    Given useSwipeGesture is rendered with swipeLeft configured
    When user swipes left by 40 pixels
    Then activeAction equals the swipeLeft config

  @swipeable-item @FR3
  Scenario: Threshold reached on sufficient left swipe
    Given useSwipeGesture is rendered with swipeLeft configured
    When user swipes left to exactly the threshold distance
    Then isThresholdReached is true

  @swipeable-item @FR3
  Scenario: Left action fires on release past threshold
    Given useSwipeGesture is rendered with swipeLeft configured
    When user swipes left past threshold and releases
    Then swipeLeft onAction is called once

  @swipeable-item @FR2
  Scenario: Right swipe ignored when only swipeLeft configured
    Given useSwipeGesture is rendered with only swipeLeft configured
    When user swipes right by 40 pixels
    Then translateX remains 0

  @swipeable-item @FR2
  Scenario: Left swipe ignored when only swipeRight configured
    Given useSwipeGesture is rendered with only swipeRight configured
    When user swipes left by 40 pixels
    Then translateX remains 0

  @swipeable-item @FR2
  Scenario: activeAction is null when no config for direction
    Given useSwipeGesture is rendered with only swipeLeft configured
    When user swipes right by 40 pixels
    Then activeAction is null
