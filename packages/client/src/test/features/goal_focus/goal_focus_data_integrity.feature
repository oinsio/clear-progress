Feature: Goal Focus — Data Integrity and Sync
  Self-healing for corrupted data and synchronization between devices.
  System automatically corrects invalid UUIDs and missing goals.

  Background:
    Given goals exist:
      | id                                   | name              | status      |
      | 11111111-1111-1111-1111-111111111111 | Write a book      | in_progress |
      | 22222222-2222-2222-2222-222222222222 | Learn Spanish     | in_progress |
      | 33333333-3333-3333-3333-333333333333 | Run a marathon    | in_progress |
      | 44444444-4444-4444-4444-444444444444 | Launch a startup  | planning    |

  @add-goal-focus @FR11
  Scenario: Self-healing — invalid UUID in focused_goal_1
    Given Settings has focused_goal_1 = "corrupted"
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — goal not found on client
    Given Settings has focused_goal_1 = "99999999-9999-9999-9999-999999999999"
    And goal with that ID does not exist in IndexedDB
    And Settings has focused_goal_2 = "22222222-2222-2222-2222-222222222222"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "22222222-2222-2222-2222-222222222222"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — both slots corrupted
    Given Settings has focused_goal_1 = "corrupted1"
    And Settings has focused_goal_2 = "corrupted2"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = ""
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR11
  Scenario: Self-healing — only second slot corrupted
    Given Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = "corrupted"
    When user opens the app
    Then system automatically corrects data
    And Settings has focused_goal_1 = "11111111-1111-1111-1111-111111111111"
    And Settings has focused_goal_2 = ""
    And corrected data is sent for sync

  @add-goal-focus @FR8
  Scenario: Sync focus between devices
    Given user is connected to backend on device A
    And 0 goals in focus
    When user adds goal "Write a book" to focus
    And sync occurs
    And user opens the app on device B with same backend connection
    Then on device B 1 goal in focus: "Write a book"
    And navigation on device B displays "Write a book"
