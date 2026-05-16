Feature: Supabase Setup — Accessibility and Responsive (E2E)
  Non-functional requirements for Supabase setup flow.
  Tests requiring a real browser.

  @add-supabase-ui @NFR-A1
  Scenario: Keyboard navigation through Supabase setup form
    Given user opens SetupPage with no saved connection
    When user expands Supabase section via keyboard
    Then Supabase URL input is focusable via Tab
    And Anon Key input is focusable via Tab
    And Connect button is focusable via Tab

  @add-supabase-ui @NFR-A1
  Scenario: User submits Supabase form via keyboard
    Given user opens SetupPage with Supabase section expanded
    When user fills Supabase URL "myproject" via keyboard
    And user fills Anon Key "test-anon-key" via keyboard
    And user activates Connect button via Enter key
    Then Supabase connection attempt is initiated

  @add-supabase-ui @NFR-A2
  Scenario: OAuth provider buttons have accessible names
    Given user has connected to Supabase with providers "google,github"
    Then OAuth button for "google" has accessible name "Sign in with Google"
    And OAuth button for "github" has accessible name "Sign in with Github"

  @add-supabase-ui @NFR-A3
  Scenario: Loading state is announced to screen readers
    Given user opens SetupPage with Supabase section expanded
    When user initiates Supabase connection
    Then a loading indicator with aria-live region is present

  @add-supabase-ui @NFR-A3
  Scenario: Error state is announced to screen readers
    Given user opens SetupPage with Supabase connection error
    Then error message is in an aria-live region

  @add-supabase-ui @NFR-A2 @NFR-A3
  Scenario: SetupPage passes automated accessibility checks
    Given user opens SetupPage with Supabase section expanded
    Then SetupPage passes axe-core accessibility checks

  @add-supabase-ui @NFR-R1
  Scenario Outline: Supabase setup form is usable at different viewport widths
    Given user opens SetupPage at viewport width <width>px
    When user expands the Supabase setup section
    Then Supabase URL input is visible and usable
    And Anon Key input is visible and usable
    And Connect button is visible

    Examples:
      | width |
      | 320   |
      | 768   |
      | 1440  |
