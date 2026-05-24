Feature: Repeat rule parsing and serialization
  Implements FR1, FR2 of repeating-tasks-specs.

  @repeating-tasks-specs @FR1
  Scenario: Parse valid fixed daily rule
    Given JSON string with fixed daily rule
    When repeat rule is parsed
    Then result has type "fixed"
    And result has frequency "daily"
    And result has interval 1

  @repeating-tasks-specs @FR1
  Scenario: Parse valid after_completion rule
    Given JSON string with after_completion rule and delay_days 3
    When repeat rule is parsed
    Then result has type "after_completion"
    And result has delay_days 3

  @repeating-tasks-specs @FR1
  Scenario: Parse empty string returns null
    Given an empty string
    When repeat rule is parsed
    Then result is null

  @repeating-tasks-specs @FR1
  Scenario: Parse invalid JSON returns null
    Given invalid JSON string "{not valid}"
    When repeat rule is parsed
    Then result is null

  @repeating-tasks-specs @FR1
  Scenario: Parse JSON failing Zod validation returns null
    Given JSON string with unknown type
    When repeat rule is parsed
    Then result is null

  @repeating-tasks-specs @FR2
  Scenario: Serialize a fixed daily rule
    Given a fixed daily repeat rule with interval 1
    When repeat rule is serialized
    Then result is valid JSON string matching the rule

  @repeating-tasks-specs @FR2
  Scenario: Format label for daily with interval 1
    Given a fixed daily repeat rule with interval 1
    When repeat rule label is formatted
    Then label uses i18n key "repeat.everyNDays" with count 1

  @repeating-tasks-specs @FR2
  Scenario: Format label for weekly with weekdays
    Given a fixed weekly repeat rule with weekdays 1, 3, 5
    When repeat rule label is formatted
    Then label includes translated weekday names

  @repeating-tasks-specs @FR2
  Scenario: Format label for after_completion
    Given an after_completion repeat rule with delay_days 5
    When repeat rule label is formatted
    Then label uses i18n key "repeat.afterCompletion" with count 5
