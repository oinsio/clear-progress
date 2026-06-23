Feature: ErrorFallback Display
  ErrorFallback shows a user-friendly error screen with localized content and reload action.

  @miss-ui-specs @FR1
  Scenario: Error screen displays localized content
    When ErrorFallback is rendered
    Then a heading with translated error title is visible
    And a description with translated error description is visible
    And a reload button with translated error reload text is visible

  @miss-ui-specs @FR2
  Scenario: Reload button reloads the page
    When ErrorFallback is rendered
    And user clicks the reload button
    Then window.location.reload is called

  @miss-ui-specs @UX1
  Scenario: Layout is centered on full screen
    When ErrorFallback is rendered
    Then content container has min-height screen and centering styles
