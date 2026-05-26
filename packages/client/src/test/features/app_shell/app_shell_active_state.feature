Feature: Bottom navigation active state
  Implements FR3 of app-shell-navigation-spec.

  @app-shell-navigation-spec @FR3
  Scenario: Active item has aria-current page on Inbox route
    Given user is on the "/tasks" route
    When BottomNav is rendered
    Then Inbox navigation item has aria-current "page"

  @app-shell-navigation-spec @FR3
  Scenario: Non-active items lack aria-current
    Given user is on the "/tasks" route
    When BottomNav is rendered
    Then Today navigation item does not have aria-current

  @app-shell-navigation-spec @FR3
  Scenario: Active item has aria-current page on Goals route
    Given user is on the "/goals" route
    When BottomNav is rendered
    Then Goals navigation item has aria-current "page"

  @app-shell-navigation-spec @FR3
  Scenario: Active item has aria-current page on Today route
    Given user is on the "/today" route
    When BottomNav is rendered
    Then Today navigation item has aria-current "page"
