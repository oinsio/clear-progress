Feature: PWA update notification
  Implements FR5, FR6, FR7 of pwa-specs-and-tests.
  The app notifies the user about a new service worker version
  and provides a way to activate the update.

  @pwa-specs-and-tests @FR5
  Scenario: Notification appears when new version is available
    Given a new service worker version is waiting
    When the update notification state is evaluated
    Then the update notification modal is shown

  @pwa-specs-and-tests @FR5
  Scenario: Notification is not shown when no update is available
    Given no new service worker version is waiting
    When the update notification state is evaluated
    Then the update notification modal is not shown

  @pwa-specs-and-tests @FR6
  Scenario: Notification displays localized message and update button
    Given a new service worker version is waiting
    When the update notification modal is shown
    Then the notification displays a localized new-version message
    And the notification displays an update button

  @pwa-specs-and-tests @FR7
  Scenario: User triggers the update
    Given the update notification modal is shown
    When the user confirms the update
    Then the waiting service worker is activated with reload
