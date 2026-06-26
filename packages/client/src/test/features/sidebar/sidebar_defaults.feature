Feature: Sidebar Platform-Aware Defaults
  Sidebar preferences use platform-aware defaults based on screen size.
  Desktop and mobile share the same default sidebar mode (expanded).
  Mobile collapsing is handled at the layout level, not in the mode preference.
  Saved values in localStorage override platform defaults.
  Legacy panel_open values are migrated to the new sidebar mode system.

  @improve-sidebar-ux @FR7
  Scenario: Desktop defaults for panel side
    Given the user is on a desktop device
    And no panel side is saved in localStorage
    When the panel side preference is loaded
    Then the panel side is "left"

  @improve-sidebar-ux @FR7
  Scenario: Mobile defaults for panel side
    Given the user is on a mobile device
    And no panel side is saved in localStorage
    When the panel side preference is loaded
    Then the panel side is "right"

  @improve-sidebar-ux @FR7
  Scenario: Saved panel side overrides desktop default
    Given the user is on a desktop device
    And panel side "right" is saved in localStorage
    When the panel side preference is loaded
    Then the panel side is "right"

  @improve-sidebar-ux @FR7
  Scenario: Desktop defaults for sidebar mode
    Given the user is on a desktop device
    And no sidebar mode is saved in localStorage
    When the sidebar mode preference is loaded
    Then the sidebar mode is "expanded"

  @improve-sidebar-ux @FR7
  Scenario: Mobile defaults for sidebar mode
    Given the user is on a mobile device
    And no sidebar mode is saved in localStorage
    When the sidebar mode preference is loaded
    Then the sidebar mode is "expanded"

  @improve-sidebar-ux @FR7
  Scenario: Legacy panel open migrates to sidebar mode
    Given the user is on a mobile device
    And legacy panel open "true" is saved in localStorage
    When the sidebar mode preference is loaded
    Then the sidebar mode is "expanded"

  @improve-sidebar-ux @FR7
  Scenario: Desktop defaults for filter bar position
    Given the user is on a desktop device
    And no filter bar position is saved in localStorage
    When the filter bar position preference is loaded
    Then the filter bar position is "top"

  @improve-sidebar-ux @FR7
  Scenario: Mobile defaults for filter bar position
    Given the user is on a mobile device
    And no filter bar position is saved in localStorage
    When the filter bar position preference is loaded
    Then the filter bar position is "bottom"

  @improve-sidebar-ux @FR7
  Scenario: Saved filter bar position overrides desktop default
    Given the user is on a desktop device
    And filter bar position "bottom" is saved in localStorage
    When the filter bar position preference is loaded
    Then the filter bar position is "bottom"
