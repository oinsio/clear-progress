Feature: Sync Protocol — Dirty Flag Lifecycle
  Implements spec-sync-protocol dirty flag scenarios: real changes set
  needsSync, no-op changes preserve state, empty values are equal.

  @spec-sync-protocol @FR4
  Scenario: Real field change sets dirty flag
    Given a task exists with name "Buy milk"
    When user changes name to "Buy bread"
    Then hasEntityChanged returns true

  @spec-sync-protocol @FR4
  Scenario: No-op change does not set dirty flag
    Given a task exists with name "Buy milk"
    When user saves without changes
    Then hasEntityChanged returns false

  @spec-sync-protocol @FR4
  Scenario: Empty string equals undefined in comparison
    Given a task exists with description ""
    When compared to same task with description undefined
    Then hasEntityChanged returns false

  @spec-sync-protocol @FR4
  Scenario: Empty string equals null in comparison
    Given a task exists with description ""
    When compared to same task with description null
    Then hasEntityChanged returns false

  @spec-sync-protocol @FR4
  Scenario: Service fields are excluded from comparison
    Given a task exists with version 1
    When compared to same task with version 2
    Then hasEntityChanged returns false

  @spec-sync-protocol @FR4
  Scenario: Created/accepted clears dirty flag if version unchanged
    Given a dirty task with version 3 was pushed
    And server returned created status
    And local version is still 3
    When push results are applied
    Then needsSync is set to false

  @spec-sync-protocol @FR4
  Scenario: Created/accepted keeps dirty flag if version changed locally
    Given a dirty task with version 3 was pushed
    And server returned accepted status
    And local version changed to 4 during push
    When push results are applied
    Then needsSync remains true
