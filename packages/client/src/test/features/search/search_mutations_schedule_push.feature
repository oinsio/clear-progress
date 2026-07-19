Feature: Search page mutations schedule a sync push
  Implements FR1, FR2 of fix-search-page-sync-push.

  @fix-search-page-sync-push @FR1
  Scenario: Completing a task from search results schedules a push
    Given a task "Search Result Task" is found by search
    When the user completes the task from search results
    Then the task completion is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1
  Scenario: Uncompleting a task from search results schedules a push
    Given a completed task "Search Result Task" is found by search
    When the user uncompletes the task from search results
    Then the task uncompletion is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1
  Scenario: Editing a task from search results schedules a push
    Given a task "Search Result Task" is found by search
    When the user edits the task from search results
    Then the task edit is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1
  Scenario: Moving a task from search results schedules a push
    Given a task "Search Result Task" is found by search
    When the user moves the task to a different box from search results
    Then the task move is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1
  Scenario: Deleting a task from search results schedules a push
    Given a task "Search Result Task" is found by search
    When the user deletes the task from search results
    Then the task deletion is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1
  Scenario: Duplicating a task from the task detail panel opened from search schedules a push
    Given a task "Search Result Task" is found by search
    When the user duplicates the task from the task detail panel opened from search
    Then the task duplication is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR2
  Scenario: Editing an idea from the idea detail panel opened from search schedules a push
    Given an idea "Search Result Idea" is found by search
    When the user edits the idea from the idea detail panel opened from search
    Then the idea edit is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR2
  Scenario: Deleting an idea from the idea detail panel opened from search schedules a push
    Given an idea "Search Result Idea" is found by search
    When the user deletes the idea from the idea detail panel opened from search
    Then the idea deletion is written locally
    And schedulePush is called exactly once

  @fix-search-page-sync-push @FR1 @FR2
  Scenario: Running a search without any mutation does not schedule a push
    Given a task "Search Result Task" is found by search
    When the user types a search query and search executes
    Then schedulePush is not called
