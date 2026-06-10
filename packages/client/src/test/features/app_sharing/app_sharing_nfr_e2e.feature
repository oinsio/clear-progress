Feature: App Sharing — Accessibility and Responsiveness (E2E)
  Implements NFR-A1, NFR-A2, NFR-A3, NFR-R1, FR4 of share-with-friend.
  Tests requiring a real browser for aria, keyboard, and responsive behavior.

  Background:
    Given user is on the Settings page with share section visible

  @share-with-friend @NFR-A1
  Scenario: Share button has proper aria-label
    Then share button has a non-empty aria-label

  @share-with-friend @NFR-A3 @FR4
  Scenario: Confirmation dialog has alertdialog role and aria attributes
    When user clicks the share button
    Then confirmation dialog has role "alertdialog"
    And confirmation dialog has aria-labelledby linked to its title
    And confirmation dialog has aria-describedby linked to its message

  @share-with-friend @NFR-A2
  Scenario: Confirmation dialog is keyboard-navigable with Tab
    When user clicks the share button
    Then confirmation dialog is visible
    When user presses Tab inside share dialog
    Then focus moves to the next share dialog button
    When user presses Tab inside share dialog again
    Then focus cycles back to the first share dialog button

  @share-with-friend @NFR-A2
  Scenario: Confirmation dialog closes with Escape
    When user clicks the share button
    Then confirmation dialog is visible
    When user presses Escape on share dialog
    Then confirmation dialog is closed

  @share-with-friend @NFR-A2
  Scenario: Confirmation dialog confirm button is activatable via Enter
    When user clicks the share button
    Then confirmation dialog is visible
    When user presses Enter on the share dialog confirm button
    Then confirmation dialog is closed

  @share-with-friend @NFR-R1
  Scenario: Share section renders correctly on mobile viewport
    When viewport is set to 320 pixels wide for share test
    Then share section is visible
    And share button is visible

  @share-with-friend @NFR-R1
  Scenario: Share section renders correctly on desktop viewport
    When viewport is set to 2560 pixels wide for share test
    Then share section is visible
    And share button is visible

  @share-with-friend @NFR-A1 @NFR-A2 @NFR-A3
  Scenario: Settings page with share section passes axe-core checks
    Then Settings page share section passes axe-core accessibility checks

  @share-with-friend @NFR-A1 @NFR-A2 @NFR-A3
  Scenario: Confirmation dialog passes axe-core checks
    When user clicks the share button
    Then confirmation dialog passes axe-core accessibility checks
