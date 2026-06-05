Feature: Day boundary time input (E2E)
  Validates that the split hours/minutes input on Settings page
  correctly accepts, rejects, and formats time values in a real browser.

  Background:
    Given user is on the settings page

  @day-boundary @FR11
  Scenario Outline: Valid time is accepted and persisted
    When user enters "<hours>" into hours and "<minutes>" into minutes
    Then day boundary displays "<expectedHours>" hours and "<expectedMinutes>" minutes

    Examples:
      | hours | minutes | expectedHours | expectedMinutes |
      | 04    | 00      | 04            | 00              |
      | 23    | 59      | 23            | 59              |
      | 00    | 00      | 00            | 00              |
      | 5     | 3       | 05            | 03              |
      | 12    | 30      | 12            | 30              |

  @day-boundary @FR11
  Scenario: Invalid hours revert to previous value
    When user enters "04" into hours and "00" into minutes
    And user enters "25" into hours and blurs
    Then day boundary displays "04" hours and "00" minutes

  @day-boundary @FR11
  Scenario: Invalid minutes revert to previous value
    When user enters "04" into hours and "30" into minutes
    And user enters "65" into minutes and blurs
    Then day boundary displays "04" hours and "30" minutes

  @day-boundary @FR11
  Scenario: Non-digit characters are stripped from input
    When user types "a1b2" into hours
    Then hours input contains "12"

  @day-boundary @FR11
  Scenario: Focus moves from hours to minutes after two valid digits
    When user types "05" into hours
    Then minutes input is focused

  @day-boundary @FR11
  Scenario: Enter key commits the value
    When user enters "06" into hours and "00" into minutes
    And user types "3" into minutes and presses Enter
    Then day boundary displays "06" hours and "03" minutes
