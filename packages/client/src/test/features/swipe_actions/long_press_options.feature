Feature: Long press custom options
  Implements FR18 of swipe-actions-spec.

  @swipe-actions-spec @FR18
  Scenario: Custom time threshold delays activation
    Given long press threshold is set to 1000ms
    When user holds touch for 500ms
    Then onLongPress is not called
    When user continues holding until 1000ms total
    Then onLongPress is called

  @swipe-actions-spec @FR18
  Scenario: Custom move threshold allows more movement
    Given long press move threshold is set to 20 pixels
    When user moves finger by 18 pixels during hold and waits
    Then onLongPress is called

  @swipe-actions-spec @FR18
  Scenario: Without onClick callback quick tap does nothing
    Given no onClick callback is provided
    When user taps and releases before threshold
    Then onLongPress is not called
