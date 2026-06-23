Feature: Server Connection — Backend Selection
  Implements change simplify-backend-connection.
  User selects a backend type from the Server section in Settings.

  Background:
    Given no backend is connected

  @simplify-backend-connection @FR3
  Scenario: Selecting Supabase shows connection form
    When user selects "Connect Supabase"
    Then Supabase connection form is displayed
    And "Connect" and "Cancel" buttons are shown

  @simplify-backend-connection @FR5
  Scenario: Cancel returns to backend selection
    Given user has selected "Connect Supabase"
    When user cancels the form
    Then backend selection buttons are displayed
