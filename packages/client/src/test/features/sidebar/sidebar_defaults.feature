Feature: Sidebar Platform-Aware Defaults
  Sidebar preferences use platform-aware defaults based on screen size.
  Desktop defaults differ from mobile defaults.
  Saved values in localStorage override platform defaults.

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
  Scenario: Desktop defaults for panel open state
    Given the user is on a desktop device
    And no panel open state is saved in localStorage
    When the panel open preference is loaded
    Then the panel is open

  @improve-sidebar-ux @FR7
  Scenario: Mobile defaults for panel open state
    Given the user is on a mobile device
    And no panel open state is saved in localStorage
    When the panel open preference is loaded
    Then the panel is closed

  @improve-sidebar-ux @FR7
  Scenario: Saved panel open state overrides mobile default
    Given the user is on a mobile device
    And panel open state "true" is saved in localStorage
    When the panel open preference is loaded
    Then the panel is open

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
