Feature: Supabase Connection — Accessibility and Responsive (E2E)
  Non-functional requirements for Supabase connection flow on Settings page.
  Tests requiring a real browser.

  @simplify-backend-connection @NFR-A3
  Scenario: Keyboard navigation through Supabase connection form
    Given user opens Settings with Supabase form visible
    Then Supabase URL input is focusable via Tab
    And Anon Key input is focusable via Tab
    And Connect button is focusable via Tab

  @simplify-backend-connection @NFR-A3
  Scenario: User submits Supabase form via keyboard
    Given user opens Settings with Supabase form visible
    When user fills Supabase URL "myproject" via keyboard
    And user fills Anon Key "test-anon-key" via keyboard
    And user activates Connect button via Enter key
    Then Supabase connection attempt is initiated

  @simplify-backend-connection @NFR-A1
  Scenario: OAuth provider buttons have accessible names
    Given user has connected to Supabase with providers "google,github"
    Then OAuth button for "google" has accessible name "Sign in with Google"
    And OAuth button for "github" has accessible name "Sign in with Github"

  @simplify-backend-connection @NFR-A2
  Scenario: Loading state is announced to screen readers
    Given user opens Settings with Supabase form visible
    When user initiates Supabase connection
    Then a loading indicator with aria-live region is present

  @simplify-backend-connection @NFR-A2
  Scenario: Error state is announced to screen readers
    Given user opens Settings with Supabase connection error
    Then error message is in an aria-live region

  @simplify-backend-connection @NFR-A1 @NFR-A2 @NFR-A3
  Scenario: Settings Server section passes automated accessibility checks
    Given user opens Settings with Supabase form visible
    Then Server section passes axe-core accessibility checks

  @simplify-backend-connection @NFR-R1
  Scenario Outline: Supabase connection form is usable at different viewport widths
    Given user opens Settings at viewport width <width>px
    When user selects Supabase backend
    Then Supabase URL input is visible and usable
    And Anon Key input is visible and usable
    And Connect button is visible

    Examples:
      | width |
      | 320   |
      | 768   |
      | 1440  |
