Feature: CommandBar position
  Implements FR18 of command-bar.

  @command-bar @FR18
  Scenario: Bottom position renders with order-last and border-top
    Given user preference for position is "bottom"
    When CommandBar is rendered
    Then CommandBar has order-last class for bottom placement
    And CommandBar has a top border

  @command-bar @FR18
  Scenario: Top position renders with border-bottom
    Given user preference for position is "top"
    When CommandBar is rendered
    Then CommandBar does not have order-last class
    And CommandBar has a bottom border

  @command-bar @FR18
  Scenario: CommandBar is not fixed positioned
    When CommandBar is rendered
    Then CommandBar does not have fixed positioning

  @command-bar @FR18
  Scenario: Safe-area-bottom padding applied for bottom position on iOS
    Given user preference for position is "bottom"
    When CommandBar is rendered
    Then safe-area-bottom padding is applied
