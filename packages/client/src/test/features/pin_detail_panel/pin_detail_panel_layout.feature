Feature: Detail panel pinned layout
  Implements FR3, FR4, FR5 of pin-task-detail-panel, task-page-layout spec.

  @pin-task-detail-panel @FR4
  Scenario: Pinned with no task shows empty state
    Given the viewport is desktop
    And detail panel is pinned
    And no task is selected
    When TaskPageLayout is rendered
    Then the empty state placeholder is shown
    And the resize handle is visible

  @pin-task-detail-panel @FR5
  Scenario: Pinned with task shows detail panel
    Given the viewport is desktop
    And detail panel is pinned
    And a task is selected
    When TaskPageLayout is rendered
    Then TaskDetailPanel is shown

  @pin-task-detail-panel @NFR-R1
  Scenario: Pinned mode ignored on mobile
    Given the viewport is mobile
    And detail panel is pinned
    And no task is selected
    When TaskPageLayout is rendered
    Then the empty state placeholder is not shown
    And the resize handle is not visible

  @pin-task-detail-panel @FR3
  Scenario: Unpinned hides detail column when no task
    Given the viewport is desktop
    And detail panel is not pinned
    And no task is selected
    When TaskPageLayout is rendered
    Then the empty state placeholder is not shown
    And TaskDetailPanel is not shown
