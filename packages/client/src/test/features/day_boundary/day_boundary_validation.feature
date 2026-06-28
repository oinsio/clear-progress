Feature: Day boundary validation and self-healing
  Implements FR11, FR12 of day-boundary.

  @day-boundary @FR11
  Scenario Outline: Valid day boundary values are accepted
    When validating day boundary "<value>"
    Then the value is valid

    Examples:
      | value |
      | 00:00 |
      | 02:30 |
      | 23:59 |
      | 12:00 |

  @day-boundary @FR11
  Scenario Outline: Invalid day boundary values are rejected
    When validating day boundary "<value>"
    Then the value is invalid

    Examples:
      | value |
      | 24:00 |
      | abc   |
      |       |
      | 2:00  |
      | -1:00 |
      | 12:60 |

  @day-boundary @FR12
  Scenario: Invalid value in storage returns default
    Given stored day boundary is "invalid"
    When the system reads the day boundary setting
    Then the returned value is "00:00"

  @day-boundary @FR12
  Scenario: Invalid value triggers self-healing write
    Given stored day boundary is "25:00"
    When the system reads the day boundary setting
    Then the repository is updated with value "00:00" and syncStatus "pending"

  @day-boundary @FR12
  Scenario: Valid value passes through unchanged
    Given stored day boundary is "02:00"
    When the system reads the day boundary setting
    Then the returned value is "02:00"
    And no healing write occurs

  @day-boundary @FR12
  Scenario: Missing value returns default without healing
    Given no day boundary setting exists
    When the system reads the day boundary setting
    Then the returned value is "00:00"
    And no healing write occurs
