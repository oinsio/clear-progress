Feature: CommandBar position and height variable
  Implements FR16, FR17, FR18 of command-bar.

  @command-bar @FR18
  Scenario: Bottom position renders fixed bottom with border-top
    Given user preference for position is "bottom"
    When CommandBar is rendered
    Then CommandBar is fixed at the bottom of the viewport
    And CommandBar has a top border

  @command-bar @FR18
  Scenario: Top position renders fixed top with border-bottom
    Given user preference for position is "top"
    When CommandBar is rendered
    Then CommandBar is fixed at the top of the viewport
    And CommandBar has a bottom border

  @command-bar @FR16
  Scenario: CSS variable --command-bar-height set on mount
    When CommandBar mounts
    Then document root has CSS variable "--command-bar-height" set to the bar height

  @command-bar @FR16
  Scenario: CSS variable updates on textarea growth
    Given CommandBar is mounted
    When textarea grows from single-line to multiple lines
    Then "--command-bar-height" updates to the new bar height

  @command-bar @FR16
  Scenario: CSS variable resets to 0px on unmount
    Given CommandBar is mounted
    When CommandBar unmounts
    Then "--command-bar-height" is set to "0px"

  @command-bar @FR18
  Scenario: Safe-area-bottom padding applied for bottom position on iOS
    Given user preference for position is "bottom"
    When CommandBar is rendered
    Then safe-area-bottom padding is applied
