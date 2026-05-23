Feature: Supabase Setup — Connection Flow
  Implements change add-supabase-ui.
  User connects to a Supabase backend from SetupPage.

  Background:
    Given no active connection is configured

  @add-supabase-ui @FR1
  Scenario: Both backend sections visible on SetupPage
    When user opens SetupPage
    Then both "Google Apps Script" and "Supabase" sections are displayed
    And each section can be expanded and collapsed independently

  @add-supabase-ui @FR2
  Scenario: Connect button disabled when inputs are empty
    Given user expands the Supabase section
    When URL field is empty
    Then Connect button is disabled

  @add-supabase-ui @FR2
  Scenario: Connect button enabled when both fields are filled
    Given user expands the Supabase section
    When user enters URL "myproject" and Anon Key "eyJhbGciOiJIUzI1NiJ9.test"
    Then Connect button is enabled

  @add-supabase-ui @FR4
  Scenario: Successful connection check saves config
    Given user enters URL "myproject" and Anon Key "eyJhbGciOiJIUzI1NiJ9.test"
    When user clicks Connect
    And settings endpoint responds with providers "google,github"
    Then connection config is saved with isActive true
    And OAuth provider buttons are displayed

  @add-supabase-ui @FR4 @NFR-P1
  Scenario: Connection check timeout
    Given user enters URL "myproject" and Anon Key "eyJhbGciOiJIUzI1NiJ9.test"
    When user clicks Connect
    And settings endpoint does not respond within timeout
    Then timeout error is displayed
    And user can retry

  @add-supabase-ui @FR4
  Scenario: Connection check network error
    Given user enters URL "myproject" and Anon Key "eyJhbGciOiJIUzI1NiJ9.test"
    When user clicks Connect
    And settings endpoint returns a network error
    Then connection error is displayed
    And user can retry

  @add-supabase-ui @FR5
  Scenario: Multiple OAuth providers displayed
    Given connection check succeeds with providers "google,github"
    Then OAuth button "Sign in with Google" is displayed
    And OAuth button "Sign in with Github" is displayed

  @add-supabase-ui @FR13
  Scenario: No OAuth providers configured
    Given connection check succeeds with no providers
    Then informational message about configuring providers is displayed
    And no OAuth buttons are shown

  @add-supabase-ui @FR6
  Scenario: OAuth sign-in initiated on button click
    Given OAuth providers are loaded with "google"
    When user clicks "Sign in with Google" button
    Then signInWithOAuth is called with provider "google" and redirectTo containing "/setup"

  @add-supabase-ui @FR7
  Scenario: Successful OAuth callback navigates to inbox
    Given user returns from OAuth redirect with authorization code
    When SDK exchanges code for session successfully
    Then app navigates to inbox

  @add-supabase-ui @FR7
  Scenario: OAuth callback with error shows message
    Given user returns from OAuth redirect with an error
    Then error message is displayed on SetupPage
    And OAuth provider buttons remain available for retry

  @add-supabase-ui @FR14
  Scenario: Connected state shows project URL
    Given user is connected to Supabase at "https://myproject.supabase.co"
    When user opens SetupPage
    Then project URL "https://myproject.supabase.co" is displayed
    And Anon Key is not shown

  @add-supabase-ui @FR14
  Scenario: Connected state with expired session shows OAuth buttons
    Given user is connected to Supabase at "https://myproject.supabase.co"
    And Supabase session is expired
    When user opens SetupPage
    Then OAuth provider buttons are displayed for re-authentication
    And Disconnect button is available
