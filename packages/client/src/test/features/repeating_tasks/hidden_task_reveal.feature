Feature: Hidden Task Reveal
  Implements FR11 of repeating-tasks-specs.

  @repeating-tasks-specs @FR11
  Scenario: Reveal tasks whose appear_date has arrived
    Given hidden task with appear_date "2026-06-15" and today is "2026-06-15"
    When system reveals hidden tasks
    Then task has is_hidden false and syncStatus "pending"

  @repeating-tasks-specs @FR11
  Scenario: Do not reveal tasks whose appear_date is future
    Given hidden task with appear_date "2026-06-20" and today is "2026-06-15"
    When system reveals hidden tasks
    Then task remains hidden
