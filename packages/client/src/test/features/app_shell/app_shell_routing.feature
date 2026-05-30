Feature: App shell routing configuration
  Implements FR4, FR5 of app-shell-navigation-spec.

  @app-shell-navigation-spec @FR4
  Scenario: Root path redirects to Tasks
    When router is configured
    Then "/" redirects to "/tasks"

  @app-shell-navigation-spec @FR5
  Scenario: All routes are nested under AppLayout
    When router is configured
    Then every page route has AppShell as ancestor layout
