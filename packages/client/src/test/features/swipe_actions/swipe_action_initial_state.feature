Feature: Swipe action initial state and disabled guard
  Implements FR1, FR2 of swipe-actions-spec.

  @swipe-actions-spec @FR1
  Scenario: Initial translateX is zero
    When useSwipeAction is rendered with an enabled ref
    Then translateX is 0

  @swipe-actions-spec @FR1
  Scenario: Initial isThresholdReached is false
    When useSwipeAction is rendered with an enabled ref
    Then isThresholdReached is false

  @swipe-actions-spec @FR2
  Scenario: Disabled hook ignores swipe movement
    Given useSwipeAction is rendered with isEnabled false
    When user swipes right past threshold
    Then translateX remains 0

  @swipe-actions-spec @FR2
  Scenario: Disabled hook does not call onAction
    Given useSwipeAction is rendered with isEnabled false
    When user swipes right past threshold and releases
    Then onAction is not called
