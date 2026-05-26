Feature: Swipe action cancellation
  Implements FR7, FR8 of swipe-actions-spec.

  @swipe-actions-spec @FR7
  Scenario: Left swipe does not update translateX
    Given useSwipeAction is rendered and enabled
    When user swipes left
    Then translateX remains 0

  @swipe-actions-spec @FR7
  Scenario: Left swipe does not trigger onAction
    Given useSwipeAction is rendered and enabled
    When user swipes left and releases
    Then onAction is not called

  @swipe-actions-spec @FR8
  Scenario: Vertical scroll cancels swipe
    Given useSwipeAction is rendered and enabled
    When user moves finger predominantly vertically
    Then translateX is reset to 0
