Feature: DnD Drag-End Handler
  Implements FR4, FR5, FR6, FR7 of drag-and-drop-spec.

  @drag-and-drop-spec @FR4
  Scenario: Drop outside valid zone is ignored
    Given a list of items A, B, C
    When user drops an item with no valid target
    Then the reorder callback is not called

  @drag-and-drop-spec @FR5
  Scenario: Drop on same position is ignored
    Given a list of items A, B, C
    When user drops item A onto item A
    Then the reorder callback is not called

  @drag-and-drop-spec @FR6
  Scenario: Item moved from position 0 to position 2
    Given a list of items A, B, C
    When user drags A and drops onto C
    Then the reorder callback receives items B, C, A

  @drag-and-drop-spec @FR6
  Scenario: Item moved from position 2 to position 0
    Given a list of items A, B, C
    When user drags C and drops onto A
    Then the reorder callback receives items C, A, B

  @drag-and-drop-spec @FR7
  Scenario: Reorder callback receives reordered items
    Given a list of items A, B, C
    When user drags B and drops onto A
    Then the reorder callback receives items B, A, C
    And the reorder callback is called exactly once
