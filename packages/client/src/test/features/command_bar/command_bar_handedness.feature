Feature: CommandBar handedness layout
  Implements FR13, FR14, FR15 of command-bar.

  @command-bar @FR13
  Scenario: Right-handed default layout order
    Given handedness is "right"
    When CommandBar is rendered with filter and eyeToggle
    Then layout order is Filter, Textarea, Eye, Create

  @command-bar @FR13
  Scenario: Left-handed layout reverses element order
    Given handedness is "left"
    When CommandBar is rendered with filter and eyeToggle
    Then layout order is Create, Eye, Textarea, Filter

  @command-bar @FR14
  Scenario: Entity icon not mirrored for left-handed layout
    Given handedness is "left"
    When CommandBar is rendered
    Then entity icon remains on the left inside the textarea

  @command-bar @FR15
  Scenario: Stack order unchanged with left-handedness
    Given handedness is "left"
    And user has typed text that wraps to multiple visual lines
    When buttons are stacked vertically
    Then create button is at the bottom of the stack
