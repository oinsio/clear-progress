Feature: Detail panel pin button
  Implements FR6, NFR-A1, NFR-R1 of pin-task-detail-panel, task-page-layout spec.

  @pin-task-detail-panel @FR6 @NFR-A1
  Scenario: Pin button visible on desktop
    Given the viewport is desktop
    When TaskDetailPanel is rendered
    Then a pin button is visible in the header

  @pin-task-detail-panel @FR6 @NFR-R1
  Scenario: Pin button hidden on mobile
    Given the viewport is mobile
    When TaskDetailPanel is rendered
    Then the pin button is not rendered

  @pin-task-detail-panel @FR6
  Scenario: Pin button toggles preference
    Given the viewport is desktop
    And detail panel is not pinned
    When user clicks the pin button
    Then detail panel pinned preference is true

  @pin-task-detail-panel @FR6 @NFR-A1
  Scenario: Pin button shows correct icon when unpinned
    Given the viewport is desktop
    And detail panel is not pinned
    When TaskDetailPanel is rendered
    Then pin button has aria-label for pinning

  @pin-task-detail-panel @FR6 @NFR-A1
  Scenario: Pin button shows correct icon when pinned
    Given the viewport is desktop
    And detail panel is pinned
    When TaskDetailPanel is rendered
    Then pin button has aria-label for unpinning
