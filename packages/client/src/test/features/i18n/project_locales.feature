Feature: Project locales content
  Implements change add-project-locales.
  The project dialects are terminology-only overrides of their base locales:
  "en-project" over "en" and "ru-project" over "ru", replacing goal → project
  and «цель» → «проект» and nothing else. No theming, no voice, no glossary
  beyond the single term.

  Background:
    Given the project dialect files and their base locales are flattened

  @add-project-locales @FR1
  Scenario Outline: Dialect carries only phrases that differ from the base
    Then no <dialect> override has a value identical to its base value

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR1
  Scenario Outline: Every override exists in the base locale
    Then every <dialect> override key exists in the base locale

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR2
  Scenario Outline: Override set is derived from the term-mentioning base keys
    When the term regex is applied to every value of the base locale
    Then the set of matching keys equals the normative inventory of <dialect>

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR2 @FR3
  Scenario Outline: Dialect content equals the normative inventory exactly
    Then the <dialect> overrides equal the normative inventory exactly

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR3
  Scenario Outline: No goal terminology survives in overrides
    Then no <dialect> override value matches the base-language term regex

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR3
  Scenario: Russian overrides use masculine gender agreement
    Then the ru-project dialect values are:
      | key                         | value                |
      | goal.notFound               | Проект не найден     |
      | goal.empty                  | Нет ни одного проекта |
      | commandBar.placeholder.goal | Новый проект...      |

  @add-project-locales @FR4
  Scenario Outline: Overrides keep the placeholders of their base phrases
    Then every <dialect> override contains exactly the placeholders of its base value

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR4
  Scenario Outline: Overrides keep the plural-suffix structure of their base phrases
    Then every overridden plural group of <dialect> contains exactly the base suffix set

    Examples:
      | dialect    |
      | en-project |
      | ru-project |

  @add-project-locales @FR5
  Scenario: English dialect metadata identifies the terminology variant
    Then en-project locale metadata is:
      | field        | value             |
      | code         | en-project        |
      | name         | English (project) |
      | nativeName   | English (project) |
      | baseLanguage | en                |
      | emoji        | 🇺🇸                |

  @add-project-locales @FR5
  Scenario: Russian dialect metadata identifies the terminology variant
    Then ru-project locale metadata is:
      | field        | value             |
      | code         | ru-project        |
      | name         | Russian (project) |
      | nativeName   | Русский (проект)  |
      | baseLanguage | ru                |
      | emoji        | 🇷🇺                |

  @add-project-locales @FR7
  Scenario: English accessible names follow the terminology substitution
    Then the en-project dialect values are:
      | key           | value        |
      | goal.drag     | Drag project |
      | goal.editName | Edit project |

  @add-project-locales @FR7
  Scenario: Russian accessible names follow the terminology substitution
    Then the ru-project dialect values are:
      | key           | value                |
      | goal.drag     | Перетащить проект    |
      | goal.editName | Редактировать проект |

  @add-project-locales @FR6
  Scenario: Base sync status names Supabase unambiguously
    Then the base sync-paused wording is:
      | locale | value                 |
      | en     | Supabase paused       |
      | ru     | Supabase приостановлен |
