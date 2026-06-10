Feature: App sharing
  Implements FR4, FR5, FR6 of share-with-friend.

  @share-with-friend @FR4
  Scenario: Copy invite message with link to clipboard
    Given clipboard write will succeed
    When user copies the app link
    Then clipboard contains invite message with app URL

  @share-with-friend @FR5
  Scenario: Confirmation after clipboard copy
    Given clipboard write will succeed
    When user copies the app link
    Then copy result is "copied"

  @share-with-friend @FR4
  Scenario: Clipboard copy failure
    Given clipboard write will fail
    When user copies the app link
    Then copy result is "error"

  @share-with-friend @FR5 @FR6
  Scenario: Reset copy result
    Given clipboard write will succeed
    When user copies the app link and then resets copy result
    Then copy result is "idle"
