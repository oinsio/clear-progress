Feature: Dr. House locale content
  Implements change rework-house-locale.
  The Dr. House dialect locale is a minimal themed override of the Russian
  base locale: one hospital glossary, no redundant keys, no jokes where
  operability matters.

  Background:
    Given the "house" and "ru" locale files are flattened

  @rework-house-locale @FR1
  Scenario: Locale carries only phrases that differ from the base
    Then no house override has a value identical to its base value

  @rework-house-locale @FR1
  Scenario: Every override exists in the base locale
    Then every house override key exists in the base locale

  @rework-house-locale @FR2
  Scenario: Entity pages follow the hospital glossary
    Then the house locale values are:
      | key              | value          |
      | goal.pageName    | Диагнозы       |
      | idea.pageName    | Озарения       |
      | memo.pageName    | Советы Уилсона |
      | deleted.pageName | Морг           |

  @rework-house-locale @FR3
  Scenario: Deletion verbs follow the verb system
    Then the house locale values are:
      | key                  | value             |
      | common.delete        | В морг            |
      | taskDetail.delete    | В морг            |
      | category.deleteLabel | Закрыть отделение |

  @rework-house-locale @FR4
  Scenario: Accessibility strings keep their base wording
    Then no accessibility-only key is overridden

  @rework-house-locale @FR5
  Scenario: Data-repair and configuration instructions keep their base wording
    Then no data-repair or configuration key is overridden

  @rework-house-locale @FR6
  Scenario: Overrides keep the placeholders of their base phrases
    Then every override contains exactly the placeholders of its base value

  @rework-house-locale @FR7
  Scenario: Locale metadata identifies the dialect
    Then house locale metadata declares code "house" with base language "ru"

  @rework-house-locale @FR8
  Scenario: The user is addressed with capitalized Вы
    Then no override contains a lowercase direct-address pronoun

  @rework-house-locale @FR1 @FR2 @FR3
  Scenario: Locale content equals the normative inventory
    Then the house overrides equal the normative phrase inventory exactly
