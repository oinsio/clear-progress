Feature: Command Bar — Responsive Layout (E2E)
  Implements NFR-R1–R4 of command-bar.
  Tests that require a real browser for layout and viewport behavior.

  @command-bar @NFR-R1
  Scenario: Full-width on mobile viewport
    Given viewport is 375px wide
    And user is on a page with CommandBar
    Then CommandBar spans the full viewport width

  @command-bar @NFR-R2
  Scenario: Constrained width on desktop viewport
    Given viewport is 1440px wide
    And user is on a page with CommandBar
    Then CommandBar respects the page max-width and is centered

  @command-bar @NFR-R3
  Scenario: Width matches task list when detail panel is open
    Given viewport is 1440px wide
    And user is on a task page with detail panel open
    Then CommandBar width matches the task list width

  @command-bar @NFR-R4
  Scenario: Position top and bottom work on all viewports
    Given viewport is 375px wide
    And user has CommandBar position set to "bottom"
    And user is on a page with CommandBar
    Then CommandBar is anchored to the bottom of the viewport
    Given viewport is 1440px wide
    And user has CommandBar position set to "top"
    And user is on a page with CommandBar
    Then CommandBar is anchored to the top of the viewport
