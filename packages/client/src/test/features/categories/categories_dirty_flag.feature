Feature: Categories Dirty Flag
  Implements FR3, FR6 of add-context-category-specs.
  Smart dirty flag: identical updates do not mark for sync.

  @add-context-category-specs @FR3
  Scenario: No-op update does not trigger sync
    Given category "Work" exists with syncStatus "synced"
    When user updates category name to "Work"
    Then category syncStatus remains "synced"
    And category updated_at is unchanged

  @add-context-category-specs @FR6
  Scenario: Reorder marks only moved category for sync
    Given categories A, B, C with ascending sort_order
    When user moves category C between A and B
    Then category A has syncStatus "synced"
    And category B has syncStatus "synced"
    And category C has syncStatus "pending"
