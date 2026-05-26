Feature: App shell routing configuration
  Implements FR4, FR5, FR6 of app-shell-navigation-spec.

  @app-shell-navigation-spec @FR4
  Scenario: Root path redirects to Inbox
    When router is configured
    Then "/" redirects to "/tasks"

  @app-shell-navigation-spec @FR5
  Scenario: All routes are nested under AppLayout
    When router is configured
    Then every page route has AppShell as ancestor layout

  @app-shell-navigation-spec @FR6
  Scenario: Time-box routes are nested under PageLayout
    When router is configured
    Then Today route is wrapped in PageShell
    And Week route is wrapped in PageShell
    And Later route is wrapped in PageShell

  @app-shell-navigation-spec @FR6
  Scenario: Non-time-box routes are not in PageLayout
    When router is configured
    Then Inbox route is not wrapped in PageShell
    And Goals route is not wrapped in PageShell
