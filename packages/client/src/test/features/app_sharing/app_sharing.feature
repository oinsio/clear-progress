Feature: App sharing
  Implements FR3, FR4, FR5, FR6 of share-with-friend.

  @share-with-friend @FR3
  Scenario: Share via Web Share API on mobile
    Given Web Share API is available
    When user triggers share action
    Then native share sheet is invoked with app title, invite message, and origin URL

  @share-with-friend @FR3
  Scenario: Share data contains correct information
    Given Web Share API is available
    When user triggers share action
    Then share data includes title "Clear Progress"
    And share data includes text from i18n key "share.inviteMessage"
    And share data includes url from window origin

  @share-with-friend @FR3
  Scenario: User cancels native share sheet
    Given Web Share API is available
    And Web Share API will throw AbortError
    When user triggers share action
    Then share result remains idle

  @share-with-friend @FR4
  Scenario: Web Share API fails with non-AbortError
    Given Web Share API is available
    And Web Share API will throw a non-AbortError
    And clipboard write will succeed
    When user triggers share action
    Then URL is copied to clipboard

  @share-with-friend @FR4
  Scenario: Fallback on desktop without Web Share API
    Given Web Share API is not available
    And clipboard write will succeed
    When user triggers share action
    Then URL is copied to clipboard

  @share-with-friend @FR5
  Scenario: Confirmation after clipboard copy
    Given Web Share API is not available
    And clipboard write will succeed
    When user triggers share action
    Then share result is "copied"

  @share-with-friend @FR4
  Scenario: Clipboard copy failure
    Given Web Share API is not available
    And clipboard write will fail
    When user triggers share action
    Then share result is "error"

  @share-with-friend @FR5 @FR6
  Scenario: Reset share result
    Given Web Share API is not available
    And clipboard write will succeed
    When user triggers share action and then resets share result
    Then share result is "idle"
