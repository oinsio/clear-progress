Feature: Sidebar Sync Status
  Sidebar displays connection status via sync button.
  Shows sign-in or configure server button when auth is needed.

  @add-sidebar-specs @FR5
  Scenario: Synced state shows static sync button
    Given sidebar is expanded
    And connection status is "synced"
    Then sync button is displayed
    And sync icon is not spinning

  @add-sidebar-specs @FR5
  Scenario: Syncing state shows spinning icon
    Given sidebar is expanded
    And connection status is "syncing"
    Then sync button is displayed
    And sync icon is spinning

  @add-sidebar-specs @FR5
  Scenario: Offline state shows error badge and no connection text
    Given sidebar is expanded
    And connection status is "offline"
    Then sync button shows a red error badge
    And sidebar shows "No connection" text

  @add-sidebar-specs @FR5
  Scenario: Server error state shows error badge and error text
    Given sidebar is expanded
    And connection status is "error"
    Then sync button shows a red error badge
    And sidebar shows "Server error" text

  @add-sidebar-specs @FR5
  Scenario: Configure server button when not configured
    Given sidebar is expanded
    And connection status is "not_configured"
    Then a configure server button is displayed
    And sync button is not displayed

  @add-sidebar-specs @FR5
  Scenario: Configure server button navigates to settings
    Given sidebar is expanded
    And connection status is "not_configured"
    When user clicks the configure server button
    Then app navigates to settings

  @add-sidebar-specs @FR5
  Scenario: Sign-in button when unauthorized
    Given sidebar is expanded
    And connection status is "unauthorized"
    Then a sign-in button is displayed
    And sync button is not displayed

  @add-sidebar-specs @FR5
  Scenario: Sign-in button when no auth
    Given sidebar is expanded
    And connection status is "no_auth"
    Then a sign-in button is displayed

  @add-sidebar-specs @FR5
  Scenario: Clicking sign-in invokes auth flow
    Given sidebar is expanded
    And connection status is "unauthorized"
    When user clicks the sign-in button
    Then the sign-in function is called

  @add-sidebar-specs @FR5
  Scenario: Account button navigates to settings
    Given sidebar is expanded
    And connection status is "synced"
    When user clicks the account button
    Then app navigates to settings
