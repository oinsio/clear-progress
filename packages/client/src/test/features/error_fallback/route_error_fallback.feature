Feature: RouteErrorFallback
  RouteErrorFallback captures route errors, logs them, and renders ErrorFallback.

  @miss-ui-specs @FR3
  Scenario: Route error is logged and ErrorFallback is rendered
    Given a route error has occurred
    When RouteErrorFallback is rendered
    Then the error is logged to console
    And ErrorFallback UI is displayed
