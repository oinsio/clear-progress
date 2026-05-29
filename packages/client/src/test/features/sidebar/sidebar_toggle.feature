Feature: Sidebar Toggle
  Sidebar panel toggles between expanded and collapsed states.
  Always-open mode overrides the toggle behavior.

  @add-sidebar-specs @FR2
  Scenario: Sidebar opens from collapsed state
    Given sidebar is collapsed
    When user clicks the collapsed strip
    Then sidebar expands to show icons and labels

  @add-sidebar-specs @FR2
  Scenario: Sidebar closes from expanded state
    Given sidebar is expanded
    And always-open mode is disabled
    When user clicks the panel area
    Then sidebar collapses to show icons only

  @add-sidebar-specs @FR2
  Scenario: Collapsed sidebar renders narrow strip
    Given sidebar is collapsed
    Then sidebar renders a narrow strip with icon-only buttons
    And sidebar toggle has "open" aria-label
    And sidebar toggle has role "button"

  @add-sidebar-specs @FR2
  Scenario: Expanded sidebar renders full panel
    Given sidebar is expanded
    And always-open mode is disabled
    Then sidebar renders a full panel with icons and labels
    And sidebar toggle has "close" aria-label
    And sidebar toggle has role "button"

  @add-sidebar-specs @FR2
  Scenario: Always-open mode prevents collapse
    Given always-open mode is enabled
    Then sidebar is expanded
    And sidebar toggle does not have role "button"
    And sidebar toggle does not have "close" aria-label

  @add-sidebar-specs @FR2
  Scenario: Sidebar toggle is keyboard accessible
    Given sidebar is collapsed
    And always-open mode is disabled
    Then sidebar toggle has tabIndex 0
    When user presses Enter on the toggle area
    Then sidebar expands to show icons and labels
