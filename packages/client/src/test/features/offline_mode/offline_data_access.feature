Feature: Offline data access
  Implements FR1, FR2, FR3, FR7, FR8 of add-offline-mode-specs.
  All data reads and writes go through IndexedDB. The app is fully
  functional for CRUD operations without any backend configured.

  @add-offline-mode-specs @FR1 @FR2
  Scenario: Create entity without network
    When user creates a task without any backend configured
    Then the task is persisted in IndexedDB
    And the task has syncStatus "pending"

  @add-offline-mode-specs @FR1 @FR2
  Scenario: Read entities without network
    Given tasks exist in IndexedDB
    When user reads all tasks without any backend configured
    Then all non-deleted tasks are returned from IndexedDB

  @add-offline-mode-specs @FR2
  Scenario: Update entity without network
    Given a task exists in IndexedDB
    When user updates the task without any backend configured
    Then the task is updated in IndexedDB
    And the task has syncStatus "pending"

  @add-offline-mode-specs @FR2
  Scenario: Soft-delete entity without network
    Given a task exists in IndexedDB
    When user deletes the task without any backend configured
    Then the task has is_deleted true
    And the task has syncStatus "pending"

  @add-offline-mode-specs @FR3 @FR7
  Scenario: Dirty records survive database reopen
    Given a task was created without any backend configured
    When the database is closed and reopened
    Then the task still exists with syncStatus "pending"
