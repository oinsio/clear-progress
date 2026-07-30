Feature: Sync timing controls — Keyboard operability (E2E)
  Implements NFR-A1 of configurable-sync-timing.
  Tests that require a real browser for focus, typing, and Enter/blur commit.

  Background:
    Given user is on the settings page with the sync timing controls visible

  @configurable-sync-timing @NFR-A1
  Scenario: Tab reaches the sync interval input
    When user tabs from the accordion header to the sync interval input
    Then sync interval input is focused

  @configurable-sync-timing @NFR-A1
  Scenario: Typing and blurring commits a new sync interval value
    When user types "10" into the sync interval input and blurs
    Then sync interval input displays "10"

  @configurable-sync-timing @NFR-A1
  Scenario: Pressing Enter commits a new auto sync delay value
    When user types "5" into the auto sync delay input and presses Enter
    Then auto sync delay input displays "5"

  @configurable-sync-timing @NFR-A1
  Scenario: Keyboard-only interaction reaches and operates both controls in sequence
    When user tabs from the accordion header to the sync interval input
    And user types "15" into the sync interval input and presses Enter
    And user tabs from the sync interval input to the auto sync delay input
    And user types "8" into the auto sync delay input and presses Enter
    Then sync interval input displays "15"
    And auto sync delay input displays "8"
