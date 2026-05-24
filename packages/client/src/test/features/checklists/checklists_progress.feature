Feature: Checklists — Progress
  Implements FR6 of add-checklist-specs.

  @add-checklist-specs @FR6
  Scenario: Progress with mixed completion
    Given 3 active checklist items exist: 2 completed and 1 incomplete
    When user gets checklist progress
    Then progress shows completed 2 and total 3

  @add-checklist-specs @FR6
  Scenario: Progress with no items
    Given no checklist items exist
    When user gets checklist progress
    Then progress shows completed 0 and total 0

  @add-checklist-specs @FR6
  Scenario: Soft-deleted items excluded from progress
    Given 2 active completed items and 1 deleted completed item exist
    When user gets checklist progress
    Then progress shows completed 2 and total 2
