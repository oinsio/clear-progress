Feature: CommandBar textarea auto-grow
  Implements FR10, FR11, FR12, FR15 of command-bar.

  @command-bar @FR10
  Scenario: Short text stays compact at single-line height
    Given CommandBar is rendered
    When user types a short name that fits one line
    Then textarea height equals the CSS min-height
    And no inline height style is applied

  @command-bar @FR10
  Scenario: Long wrapped text grows textarea height
    Given CommandBar is rendered
    When user types a long name that wraps to multiple visual lines
    Then textarea height increases to fit the wrapped content

  @command-bar @FR10
  Scenario: Max-height triggers internal scroll
    Given CommandBar is rendered
    When user types text exceeding the computed max-height
    Then textarea height is capped at max-height
    And textarea scrolls internally

  @command-bar @FR10
  Scenario: Clearing text resets to single-line
    Given CommandBar is rendered
    And user has typed a long name that wraps
    When user clears the textarea
    Then textarea returns to single-line height
    And inline height styles are removed

  @command-bar @FR11
  Scenario: Wrapped text triggers eye and create button stacking
    Given CommandBar is rendered with eyeToggle config
    When user types text that wraps to multiple visual lines
    Then eye toggle and create button are stacked vertically

  @command-bar @FR11
  Scenario: Single-line keeps buttons in row layout
    Given CommandBar is rendered with eyeToggle config
    When user types a short name that fits one line
    Then eye toggle and create button are in a horizontal row

  @command-bar @FR15
  Scenario: Create button always at bottom of stack regardless of handedness
    Given CommandBar is rendered with eyeToggle config
    And handedness is "left"
    When user types text that wraps to multiple visual lines
    Then create button is at the bottom of the stacked layout
