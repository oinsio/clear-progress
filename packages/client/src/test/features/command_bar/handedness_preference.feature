Feature: Handedness preference persistence
  Implements FR13 of command-bar, local-preferences spec.

  @command-bar @FR13
  Scenario: Default handedness is "right"
    Given no handedness preference has been saved
    When the system reads the handedness setting
    Then handedness is "right"

  @command-bar @FR13
  Scenario: Setting to "left" persists in localStorage
    When user sets handedness to "left"
    Then localStorage contains "left" under the handedness key

  @command-bar @FR13
  Scenario: Invalid stored value falls back to "right"
    Given localStorage contains "invalid" under the handedness key
    When the system reads the handedness setting
    Then handedness is "right"
