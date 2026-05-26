Feature: Long press click behavior
  Implements FR15, FR16, FR19 of swipe-actions-spec.

  @swipe-actions-spec @FR15
  Scenario: Quick tap triggers onClick
    When user taps and releases before threshold
    Then onClick is called
    And onLongPress is not called

  @swipe-actions-spec @FR16
  Scenario: TouchEnd after long press does not trigger click
    When long press fires and user releases
    Then onClick is not called

  @swipe-actions-spec @FR19
  Scenario: Mouse click triggers onClick
    When user clicks with mouse
    Then onClick is called
    And onLongPress is not called
