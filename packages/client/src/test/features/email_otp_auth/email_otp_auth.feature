Feature: Email OTP Authentication
  Implements change supabase-email-auth.
  User authenticates via email OTP through the Server section.

  @supabase-email-auth @FR1
  Scenario: Email input visible when email auth enabled
    Given Supabase project has email and OAuth enabled
    When providers screen is displayed
    Then email input and divider are shown

  @supabase-email-auth @FR1
  Scenario: Email input hidden when email auth disabled
    Given Supabase project has only OAuth enabled
    When providers screen is displayed
    Then no email input is shown

  @supabase-email-auth @FR11
  Scenario: Send button disabled when email empty
    Given email input is visible
    When email field is empty
    Then Send code button is disabled

  @supabase-email-auth @FR2
  Scenario: OTP sent successfully transitions to verification
    Given user enters email and requests code
    When OTP is sent successfully
    Then OTP verification screen is shown with email displayed

  @supabase-email-auth @FR3
  Scenario: OTP verification screen shows required elements
    Given user is on OTP verification screen
    Then OTP input, verify button, magic link hint, and back button are visible

  @supabase-email-auth @FR4
  Scenario: Verify button disabled when code is empty
    Given user is on OTP verification screen
    When code input is empty
    Then verify button is disabled

  @supabase-email-auth @FR9
  Scenario: Back button returns to providers without disconnecting
    Given user is on OTP verification screen
    When user navigates back from OTP screen
    Then providers screen is shown
    And connection is not disconnected

  @supabase-email-auth @FR1 @FR8
  Scenario: Email form shown when only email enabled
    Given only email auth is enabled without OAuth
    When providers screen is displayed
    Then email input is shown without divider
    And no-providers warning is not shown
