Feature: Bottom navigation items
  Implements FR1, FR2, FR8, FR9, FR10, NFR-A1, NFR-A2 of app-shell-navigation-spec.

  @app-shell-navigation-spec @FR1
  Scenario: All five navigation items are rendered
    When BottomNav is rendered
    Then five navigation links are present

  @app-shell-navigation-spec @FR1 @FR2
  Scenario: Navigation items link to correct routes
    When BottomNav is rendered
    Then Inbox links to "/tasks"
    And Today links to "/today"
    And Goals links to "/goals"
    And Ideas links to "/ideas"
    And Search links to "/search"

  @app-shell-navigation-spec @FR1
  Scenario: Navigation items appear in correct order
    When BottomNav is rendered
    Then items appear in order: Inbox, Today, Goals, Ideas, Search

  @app-shell-navigation-spec @FR9 @NFR-A2
  Scenario: Navigation item icons have aria-hidden
    When BottomNav is rendered
    Then all navigation item icons have aria-hidden true

  @app-shell-navigation-spec @FR10 @NFR-A1
  Scenario: Navigation element has aria-label
    When BottomNav is rendered
    Then the navigation element has a descriptive aria-label

  @app-shell-navigation-spec @FR8
  Scenario: Navigation labels are translated
    When BottomNav is rendered
    Then each item uses a translated label
