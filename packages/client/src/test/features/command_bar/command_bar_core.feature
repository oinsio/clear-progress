Feature: CommandBar core rendering and submission
  Implements FR1, FR2, FR3, FR4, FR20, FR21 of command-bar.

  @command-bar @FR1 @FR2 @FR3
  Scenario: Minimal config renders textarea with entity icon and create button only
    When CommandBar receives only entityIcon, placeholder, and onSubmit
    Then it renders textarea with entity icon and create button
    And no filter section is rendered
    And no eye toggle is rendered

  @command-bar @FR1 @FR2 @FR3 @FR4
  Scenario: Full config renders filter, textarea, eye toggle, and create button
    When CommandBar receives filter, eyeToggle, entityIcon, placeholder, and onSubmit
    Then it renders filter toggle, textarea with entity icon, eye toggle, and create button

  @command-bar @FR4 @FR20
  Scenario: Submit via create button calls onSubmit with trimmed text and clears textarea
    Given CommandBar is rendered with onSubmit callback
    And user has typed "  Buy milk  " in the textarea
    When user taps the create button
    Then onSubmit is called with "Buy milk"
    And textarea is empty
    And CommandBar returns to single-line state

  @command-bar @FR4 @FR20
  Scenario: Submit via Enter key calls onSubmit with trimmed text and clears textarea
    Given CommandBar is rendered with onSubmit callback
    And user has typed "  Buy milk  " in the textarea
    When user presses Enter
    Then onSubmit is called with "Buy milk"
    And textarea is empty
    And CommandBar returns to single-line state

  @command-bar @FR21
  Scenario: Empty textarea submit does nothing via button
    Given CommandBar is rendered with onSubmit callback
    And textarea is empty
    When user taps the create button
    Then onSubmit is not called

  @command-bar @FR21
  Scenario: Empty textarea submit does nothing via Enter
    Given CommandBar is rendered with onSubmit callback
    And textarea is empty
    When user presses Enter
    Then onSubmit is not called

  @command-bar @FR21
  Scenario: Whitespace-only textarea submit does nothing
    Given CommandBar is rendered with onSubmit callback
    And user has typed "   " in the textarea
    When user taps the create button
    Then onSubmit is not called

  @command-bar @FR20
  Scenario: Textarea clears and returns to single-line after submit
    Given CommandBar is rendered with onSubmit callback
    And user has typed a long name that wraps to multiple lines
    When user taps the create button
    Then textarea is empty
    And CommandBar returns to single-line state

  @command-bar @FR4
  Scenario: Enter key does not insert newline
    Given CommandBar is rendered
    When user presses Enter in the textarea
    Then no newline character is inserted in the textarea
