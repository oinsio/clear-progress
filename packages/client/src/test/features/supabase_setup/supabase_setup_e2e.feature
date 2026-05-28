Feature: Supabase Connection — Full E2E Flow
  End-to-end Supabase connection and OAuth sign-in flow via Settings page.
  Tests that require a real browser.

  @simplify-backend-connection @FR3 @FR8 @FR14
  Scenario: User connects to Supabase and initiates OAuth sign-in
    Given user opens Settings with no connection
    When user selects Supabase backend
    And user enters Supabase URL "myproject" and Anon Key "test-anon-key"
    And user submits the Supabase connection form
    Then OAuth provider buttons are visible
    When user clicks the "Sign in with Google" OAuth button
    Then OAuth flow is initiated with provider "google"

  @simplify-backend-connection @FR14
  Scenario: After successful OAuth, user lands in inbox
    Given user has completed Supabase OAuth flow
    Then user is on the inbox page

  @simplify-backend-connection @FR3 @FR14
  Scenario: OAuth error shows retry options on Settings page
    Given user returns from OAuth with error "access_denied"
    Then error message is visible on Settings page
    And OAuth buttons are still available for retry
