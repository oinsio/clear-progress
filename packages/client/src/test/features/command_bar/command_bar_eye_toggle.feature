Feature: CommandBar eye toggle
  Implements FR7 of command-bar.

  @command-bar @FR7
  Scenario: Active state shows Eye icon with accent styling
    Given CommandBar is rendered with eyeToggle visible
    Then eye toggle shows the Eye icon
    And eye toggle has accent styling

  @command-bar @FR7
  Scenario: Inactive state shows EyeOff icon with gray styling
    Given CommandBar is rendered with eyeToggle hidden
    Then eye toggle shows the EyeOff icon
    And eye toggle has gray styling

  @command-bar @FR7
  Scenario: Toggle calls onToggle callback
    Given CommandBar is rendered with eyeToggle config
    When user taps the eye toggle
    Then onToggle callback is called

  @command-bar @FR7
  Scenario: Not rendered when eyeToggle prop is undefined
    Given CommandBar is rendered without eyeToggle config
    Then no eye toggle is rendered
