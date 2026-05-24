Feature: Checklists — Reorder
  Implements FR5 of add-checklist-specs.

  @add-checklist-specs @FR5
  Scenario: Reorder assigns sequential sort_order
    Given checklist items "A", "B", "C" exist with sort_order 0, 1, 2
    When user reorders items to "B", "C", "A"
    Then item "B" has sort_order 0
    And item "C" has sort_order 1
    And item "A" has sort_order 2

  @add-checklist-specs @FR5
  Scenario: Only changed items marked for sync
    Given checklist items "A", "B", "C" exist with sort_order 0, 1, 2
    When user reorders items to "A", "C", "B"
    Then item "A" has needsSync false
    And item "C" has needsSync true
    And item "B" has needsSync true

  @add-checklist-specs @FR5
  Scenario: Empty reorder is no-op
    When user reorders an empty array
    Then no error occurs

  @add-checklist-specs @FR5
  Scenario: Same order is no-op
    Given checklist items "A", "B" exist with sort_order 0, 1
    When user reorders items to "A", "B"
    Then item "A" has needsSync false
    And item "B" has needsSync false
