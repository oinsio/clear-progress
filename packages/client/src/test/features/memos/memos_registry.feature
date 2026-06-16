Feature: Memo registry
  Implements FR4, FR8, FR9, FR13 of add-memos.

  @add-memos @FR8
  Scenario: Memos discovered from glob result
    Given a glob result with valid memo files for "ru" and "en"
    When the registry is built
    Then memos are available for language "ru"
    And memos are available for language "en"

  @add-memos @FR4
  Scenario: Memos sorted by order field ascending
    Given a glob result with memos having order 2 and order 1 for "ru"
    When the registry is built
    Then the first memo for "ru" has order 1
    And the second memo for "ru" has order 2

  @add-memos @FR9
  Scenario: Language selection returns memos for requested language
    Given a glob result with Russian and English memos
    When memos are requested for "ru"
    Then only Russian memos are returned

  @add-memos @FR13
  Scenario: Fallback to default language when requested language missing
    Given a glob result with only English memos
    When memos are requested for "fr"
    Then English memos are returned as fallback

  @add-memos @FR13
  Scenario: Empty array when no memos exist
    Given an empty glob result
    When memos are requested for "ru"
    Then an empty array is returned
