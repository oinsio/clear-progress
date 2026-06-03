Feature: Command Bar — Responsive Layout (E2E)
  Implements NFR-R1–R4 of command-bar.
  Tests that require a real browser for layout and viewport behavior.

  @command-bar @NFR-R3
  Scenario: CommandBar does not overlap sidebar on desktop
    Given viewport is 1440px wide
    And user is on a page with CommandBar
    Then CommandBar does not overlap the Sidebar

  @command-bar @NFR-R3
  Scenario: CommandBar does not overlap sidebar on mobile
    Given viewport is 375px wide
    And user is on a page with CommandBar
    Then CommandBar does not overlap the Sidebar

  @command-bar @NFR-R1
  Scenario: CommandBar width matches content area on mobile
    Given viewport is 375px wide
    And user is on a page with CommandBar
    Then CommandBar width matches the content column width

  @command-bar @NFR-R2
  Scenario: CommandBar width matches content area on desktop
    Given viewport is 1440px wide
    And user is on a page with CommandBar
    Then CommandBar width matches the content column width
