Feature: Language persistence
  Implements FR5, FR6 of add-i18n-specs.

  @add-i18n-specs @FR5
  Scenario: Valid language restored from localStorage
    Given localStorage contains "en" under language key
    When system initializes language
    Then selected language is "en"

  @add-i18n-specs @FR6
  Scenario: Invalid language in localStorage triggers fallback
    Given localStorage contains "xx-invalid" under language key
    And browser language is "en"
    When system initializes language
    Then selected language is "en"

  @add-i18n-specs @FR6
  Scenario: localStorage unavailable triggers browser detection
    Given localStorage throws on access
    And browser language is "en"
    When system initializes language
    Then selected language is "en"
