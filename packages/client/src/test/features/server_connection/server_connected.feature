Feature: Server Connection — Connected State
  Implements change simplify-backend-connection.
  User views and manages an active backend connection in the Server section.

  @simplify-backend-connection @FR1 @UX2
  Scenario: Connected Supabase shows type and URL
    Given user is connected to Supabase at "https://myproject.supabase.co"
    When Server section is rendered
    Then "Supabase" label is displayed
    And URL "https://myproject.supabase.co" is displayed
    And Anon Key is not shown

  @simplify-backend-connection @FR1 @UX2
  Scenario: Connected GAS shows type and URL
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    When Server section is rendered
    Then "Google Apps Script" label is displayed
    And URL "https://script.google.com/macros/s/ABC/exec" is displayed

  @simplify-backend-connection @FR10 @UX6
  Scenario: Full sync triggers synchronization
    Given user is connected to Supabase at "https://myproject.supabase.co"
    When user requests full sync and confirms
    Then full synchronization is triggered

  @simplify-backend-connection @FR10
  Scenario: Sign-in prompt shown when GAS unauthenticated
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    And no access token is present
    When Server section is rendered
    Then sign-in required message is displayed
    And Sign In with Google button is available

  @simplify-backend-connection @FR10
  Scenario: Sign-in prompt hidden when GAS authenticated
    Given user is connected to GAS at "https://script.google.com/macros/s/ABC/exec"
    And access token is present
    When Server section is rendered
    Then sign-in prompt is not displayed

  @simplify-backend-connection @FR3
  Scenario: Expired Supabase session shows sign-in prompt
    Given user is connected to Supabase at "https://myproject.supabase.co"
    And Supabase session is expired
    When Server section is rendered
    Then sign-in required message is displayed
    And Disconnect button is available

  @simplify-backend-connection @FR14
  Scenario: OAuth callback with error shows message
    Given user is connected to Supabase at "https://myproject.supabase.co"
    And Supabase session is expired
    When Server section is rendered with OAuth error "User cancelled"
    Then OAuth error "User cancelled" is displayed
    And sign-in required message is displayed

  @simplify-backend-connection @FR10 @UX5
  Scenario: Disconnect clears connection
    Given user is connected to Supabase at "https://myproject.supabase.co"
    When user disconnects and confirms
    Then connection is cleared
    And backend selection is displayed
