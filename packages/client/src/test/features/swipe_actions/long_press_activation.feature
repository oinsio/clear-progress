Feature: Long press activation
  Implements FR13, FR14, FR17 of swipe-actions-spec.

  @swipe-actions-spec @FR13
  Scenario: Long press fires after threshold duration
    When user holds touch for 500ms without moving
    Then onLongPress is called once

  @swipe-actions-spec @FR14
  Scenario: Movement beyond threshold cancels long press
    When user moves finger beyond move threshold during hold
    Then onLongPress is not called after threshold duration

  @swipe-actions-spec @FR14
  Scenario: Small movement within threshold preserves long press
    When user moves finger within move threshold during hold
    Then onLongPress is called after threshold duration

  @swipe-actions-spec @FR17
  Scenario: Touch cancel stops long press
    When touchcancel fires during hold
    Then onLongPress is not called after threshold duration
