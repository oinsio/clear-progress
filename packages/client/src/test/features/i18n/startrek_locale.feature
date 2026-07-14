Feature: Star Trek locale content
  Implements change add-startrek-locale.
  The Star Trek dialect locale is a minimal themed override of the Russian
  base locale: the app is the starship Enterprise and the user is its captain.
  One starship glossary, no redundant keys, no jokes where operability matters.

  Background:
    Given the "startrek" and "ru" locale files are flattened

  @add-startrek-locale @FR1
  Scenario: Locale carries only phrases that differ from the base
    Then no startrek override has a value identical to its base value

  @add-startrek-locale @FR1
  Scenario: Every override exists in the base locale
    Then every startrek override key exists in the base locale

  @add-startrek-locale @FR2
  Scenario: Entity pages follow the starship glossary
    Then the startrek locale values are:
      | key              | value           |
      | goal.pageName    | Миссии          |
      | idea.pageName    | Новые миры      |
      | memo.pageName    | Журнал капитана |
      | deleted.pageName | За бортом       |

  @add-startrek-locale @FR3
  Scenario: Deletion verbs follow the verb system
    Then the startrek locale values are:
      | key                  | value          |
      | common.delete        | За борт        |
      | taskDetail.delete    | За борт        |
      | category.deleteLabel | Задраить отсек |
      | idea.deleteLabel     | Покинуть орбиту |

  @add-startrek-locale @FR4
  Scenario: Accessibility strings keep their base wording
    Then no accessibility-only key is overridden

  @add-startrek-locale @FR5
  Scenario: Data-repair and configuration instructions keep their base wording
    Then no data-repair or configuration key is overridden

  @add-startrek-locale @FR6
  Scenario: Overrides keep the placeholders of their base phrases
    Then every override contains exactly the placeholders of its base value

  @add-startrek-locale @FR7
  Scenario: Locale metadata identifies the dialect
    Then startrek locale metadata declares code "startrek" with base language "ru" and emoji "🖖"

  @add-startrek-locale @FR8
  Scenario: The user is addressed with capitalized Вы
    Then no override contains a lowercase direct-address pronoun

  @add-startrek-locale @FR8
  Scenario: The captain address stays lowercase mid-sentence
    Then every override addressing «капитан» mid-sentence writes it in lowercase

  @add-startrek-locale @FR9
  Scenario: Sync status strings stay within the length budget
    Then no themed sync string exceeds its base value by more than 10 characters

  @add-startrek-locale @FR1 @FR2 @FR3
  Scenario: Locale content equals the normative inventory
    Then the startrek overrides equal the normative phrase inventory exactly
