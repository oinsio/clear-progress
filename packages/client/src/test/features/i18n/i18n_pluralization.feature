Feature: Pluralization
  Implements FR12 of add-i18n-specs.

  @add-i18n-specs @FR12
  Scenario: Russian pluralization one/few/many
    Given locale is "ru"
    When translating "repeat.intervalDays" with count 1
    Then translation contains "1 день"
    When translating "repeat.intervalDays" with count 3
    Then translation contains "3 дня"
    When translating "repeat.intervalDays" with count 5
    Then translation contains "5 дней"

  @add-i18n-specs @FR12
  Scenario: English pluralization one/other
    Given locale is "en"
    When translating "repeat.intervalDays" with count 1
    Then translation contains "1 day"
    When translating "repeat.intervalDays" with count 5
    Then translation contains "5 days"
