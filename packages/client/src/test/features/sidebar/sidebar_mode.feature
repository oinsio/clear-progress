Feature: Sidebar Mode Selection
  Sidebar filter items change active mode or navigate to a route.
  Clicking an active mode deactivates it. Items with routes navigate instead of toggling.

  @add-sidebar-specs @FR3
  Scenario: Selecting a routed mode navigates to its route
    Given sidebar is expanded
    And no mode is active
    When user selects the "tasks" filter item
    Then app navigates to the tasks route
    And the "tasks" filter button has aria-pressed "true" when mode is active

  @add-sidebar-specs @FR3
  Scenario: Clicking active routed mode navigates again
    Given sidebar is expanded
    And "tasks" mode is active
    When user selects the "tasks" filter item
    Then app navigates to the tasks route again

  @add-sidebar-specs @FR3
  Scenario: Filter item with route navigates instead of toggling
    Given sidebar is expanded
    When user selects the "goals" filter item
    Then app navigates to the goals route

  @add-sidebar-specs @FR3
  Scenario: Contexts filter item navigates to contexts page
    Given sidebar is expanded
    When user selects the "contexts" filter item
    Then app navigates to the contexts route

  @add-sidebar-specs @FR3
  Scenario: Menu order controls visible filter items
    Given sidebar is expanded
    And menu order has "categories" set to not visible
    Then the "categories" filter item is not rendered in the sidebar

  @add-sidebar-specs @FR3
  Scenario: Filter items appear in configured order
    Given sidebar is expanded
    And menu order defines items: "goals", "inbox", "tasks"
    Then filter items render in order: "goals", "inbox", "tasks"
