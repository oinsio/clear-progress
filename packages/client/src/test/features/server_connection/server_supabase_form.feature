Feature: Server Connection — Supabase Form
  Implements change simplify-backend-connection.
  User connects to Supabase backend via the Server section form.

  Background:
    Given no backend is connected
    And user has selected "Connect Supabase"

  @simplify-backend-connection @FR6
  Scenario: Connect disabled when fields are empty
    When both URL and Anon Key fields are empty
    Then Connect button is disabled

  @simplify-backend-connection @FR6
  Scenario: Connect enabled when both fields are filled
    When user enters Project URL and Anon Key
    Then Connect button is enabled

  @simplify-backend-connection @FR3
  Scenario: Anon Key input is plain text
    Then Anon Key input has type "text"

  @simplify-backend-connection @FR3 @UX4
  Scenario: Successful connection shows OAuth providers
    Given user enters URL "myproject" and Anon Key "test-key"
    When user connects
    And settings endpoint responds with providers "google,github"
    Then connection config is saved
    And OAuth provider buttons are displayed

  @simplify-backend-connection @FR3 @UX3
  Scenario: Connection failure shows inline error
    Given user enters URL "badproject" and Anon Key "test-key"
    When user connects
    And settings endpoint returns an error
    Then connection error is displayed inline
    And user can retry

  @simplify-backend-connection @FR3 @UX3
  Scenario: Connection timeout shows error
    Given user enters URL "slowproject" and Anon Key "test-key"
    When user connects
    And settings endpoint does not respond within timeout
    Then timeout error is displayed inline

  @simplify-backend-connection @FR8
  Scenario: Multiple OAuth providers displayed
    Given connection check succeeds with providers "google,github"
    Then OAuth button for "google" is displayed
    And OAuth button for "github" is displayed

  @simplify-backend-connection @FR8
  Scenario: No providers shows informational message
    Given connection check succeeds with no providers
    Then no-providers informational message is displayed
    And no OAuth buttons are shown

  @simplify-backend-connection @FR8
  Scenario: OAuth sign-in initiated on button click
    Given OAuth providers are loaded with "google"
    When user clicks the OAuth "google" button
    Then signInWithOAuth is called with provider "google"
