Feature: Swipe action right swipe behavior
  Implements FR3, FR4, FR5, FR6 of swipe-actions-spec.

  @swipe-actions-spec @FR3
  Scenario: TranslateX updates during right swipe
    Given useSwipeAction is rendered and enabled
    When user swipes right by 40 pixels
    Then translateX equals 40

  @swipe-actions-spec @FR4
  Scenario: Threshold reached on sufficient swipe
    Given useSwipeAction is rendered and enabled
    When user swipes right to exactly the threshold distance
    Then isThresholdReached is true

  @swipe-actions-spec @FR4
  Scenario: Threshold not reached on insufficient swipe
    Given useSwipeAction is rendered and enabled
    When user swipes right to threshold minus 1 pixel
    Then isThresholdReached is false

  @swipe-actions-spec @FR5
  Scenario: Action fires on release past threshold
    Given useSwipeAction is rendered and enabled
    When user swipes right past threshold and releases
    Then onAction is called once

  @swipe-actions-spec @FR5
  Scenario: Action does not fire on release below threshold
    Given useSwipeAction is rendered and enabled
    When user swipes right below threshold and releases
    Then onAction is not called

  @swipe-actions-spec @FR6
  Scenario: State resets after release past threshold
    Given useSwipeAction is rendered and enabled
    When user swipes right past threshold and releases
    Then translateX is 0
    And isThresholdReached is false
