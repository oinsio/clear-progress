Feature: Purge count grammatical agreement
  Implements FR9 of rework-house-locale.
  The purge confirmation counts entity names with correct grammatical number
  in every locale, via per-entity plural keys composed into one message.

  @rework-house-locale @FR9
  Scenario: Russian purge counts agree with numbers
    Given locale is "ru"
    Then purge counts render as:
      | key                              | count | text              |
      | deleted.purgeCountTasks          | 1     | 1 задача          |
      | deleted.purgeCountTasks          | 2     | 2 задачи          |
      | deleted.purgeCountTasks          | 5     | 5 задач           |
      | deleted.purgeCountGoals          | 21    | 21 цель           |
      | deleted.purgeCountContexts       | 0     | 0 контекстов      |
      | deleted.purgeCountCategories     | 3     | 3 категории       |
      | deleted.purgeCountChecklistItems | 1     | 1 пункт чек-листа |
      | deleted.purgeCountIdeas          | 11    | 11 идей           |

  @rework-house-locale @FR9
  Scenario: House locale purge counts agree with numbers
    Given locale is "house"
    Then purge counts render as:
      | key                              | count | text         |
      | deleted.purgeCountTasks          | 21    | 21 пациент   |
      | deleted.purgeCountTasks          | 5     | 5 пациентов  |
      | deleted.purgeCountGoals          | 2     | 2 диагноза   |
      | deleted.purgeCountCategories     | 5     | 5 отделений  |
      | deleted.purgeCountChecklistItems | 2     | 2 назначения |
      | deleted.purgeCountIdeas          | 1     | 1 озарение   |
      | deleted.purgeCountContexts       | 4     | 4 контекста  |

  @rework-house-locale @FR9
  Scenario: English purge counts agree with numbers
    Given locale is "en"
    Then purge counts render as:
      | key                     | count | text    |
      | deleted.purgeCountTasks | 1     | 1 task  |
      | deleted.purgeCountTasks | 5     | 5 tasks |
      | deleted.purgeCountGoals | 2     | 2 goals |
      | deleted.purgeCountIdeas | 1     | 1 idea  |

  @rework-house-locale @FR10
  Scenario: House locale inherits Russian plural rules for fallback keys
    Given locale is "house"
    Then purge counts render as:
      | key                        | count | text            |
      | repeat.intervalDays        | 3     | Интервал: 3 дня |
      | deleted.purgeCountContexts | 1     | 1 контекст      |

  @rework-house-locale @FR9
  Scenario: Composed purge message interpolates the items list
    Given locale is "house"
    Then the purge confirmation message for items "1 озарение" is "Будет кремировано: 1 озарение"
