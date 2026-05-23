Feature: Supabase Setup — Full Connection Flow (E2E)
  End-to-end Supabase connection and OAuth sign-in flow.
  Tests that require a real browser.

  @add-supabase-ui @FR6 @FR7 @UX5
  Scenario: User connects to Supabase and signs in via OAuth
    Given user opens SetupPage with no connection
    When user expands the Supabase section
    And user enters Supabase URL "myproject" and Anon Key "test-anon-key"
    And user clicks the Supabase Connect button
    Then OAuth provider buttons are visible
    When user clicks the "Sign in with Google" OAuth button
    Then OAuth flow is initiated with provider "google"

  @add-supabase-ui @FR6 @UX5
  Scenario: After successful OAuth, user lands in inbox
    Given user has completed Supabase OAuth flow
    Then user is on the inbox page
    And no extra confirmation step is shown

  @add-supabase-ui @FR7
  Scenario: OAuth error shows retry options
    Given user returns from OAuth with error "access_denied"
    Then error message is visible on SetupPage
    And OAuth buttons are still available for retry
