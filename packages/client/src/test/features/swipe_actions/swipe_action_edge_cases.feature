Feature: Swipe action edge cases
  Implements FR9, FR10, FR11, FR12 of swipe-actions-spec.

  @swipe-actions-spec @FR9
  Scenario: TranslateX clamped at 1.5x threshold
    Given useSwipeAction is rendered and enabled
    When user swipes right to 3x threshold distance
    Then translateX equals 1.5x threshold

  @swipe-actions-spec @FR10
  Scenario: Touch on data-no-swipe element is ignored
    Given useSwipeAction is rendered and enabled
    And a child element has the data-no-swipe attribute
    When touch starts on the data-no-swipe element and moves right
    Then translateX remains 0

  @swipe-actions-spec @FR11
  Scenario: Threshold updates after window resize
    Given useSwipeAction is rendered and enabled
    When window is resized to 768 pixels wide
    And user swipes right to new threshold distance
    Then isThresholdReached is true

  @swipe-actions-spec @FR12
  Scenario: Listeners removed on unmount
    Given useSwipeAction is rendered and enabled
    When the hook unmounts
    Then touchstart listener is removed from the element
    And touchmove listener is removed from the element
    And touchend listener is removed from the element
