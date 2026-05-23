Feature: Contexts Dirty Flag
  Implements FR3 of add-context-category-specs.
  Smart dirty flag: identical updates do not mark for sync.

  @add-context-category-specs @FR3
  Scenario: No-op update does not trigger sync
    Given context "@home" exists with needsSync false
    When user updates context name to "@home"
    Then context needsSync remains false
    And context updated_at is unchanged

