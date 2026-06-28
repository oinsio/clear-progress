Feature: Sync Protocol — Dirty Flag Lifecycle
  Implements spec-sync-protocol dirty flag scenarios: real changes set
  syncStatus, no-op changes preserve state, empty values are equal.

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
    Given a task exists
    When compared to same task with different updated_at
    Then hasEntityChanged returns false

  @spec-sync-protocol @FR4
  Scenario: Created result clears dirty flag when unchanged during push
    Given a dirty task was pushed
    And server returned created status
    And local task is unchanged during push
    When push results are applied
    Then syncStatus is set to "synced"

  @spec-sync-protocol @FR4
  Scenario: Accepted result keeps dirty flag when changed during push
    Given a dirty task was pushed
    And server returned accepted status
    And local task changed during push
    When push results are applied
    Then syncStatus remains "pending"
