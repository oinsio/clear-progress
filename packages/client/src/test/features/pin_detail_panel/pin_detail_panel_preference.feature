Feature: Detail panel pinned preference
  Implements FR1, FR2, FR8 of pin-task-detail-panel, local-preferences spec.

  @pin-task-detail-panel @FR1 @FR2
  Scenario: Default detail panel pinned is false
    Given no detail panel pinned preference has been saved
    When the system reads the detail panel pinned setting
    Then detail panel pinned is false

  @pin-task-detail-panel @FR1 @FR2
  Scenario: Setting detail panel pinned persists in localStorage
    When user sets detail panel pinned to true
    Then localStorage contains "true" under the detail panel pinned key

  @pin-task-detail-panel @FR8
  Scenario: Corrupted detail panel pinned self-heals
    Given localStorage contains "maybe" under the detail panel pinned key
    When the system reads the detail panel pinned setting
    Then detail panel pinned is false
    And the detail panel pinned key is removed from localStorage

  @pin-task-detail-panel @FR1 @FR2
  Scenario: Stored true value is read correctly
    Given localStorage contains "true" under the detail panel pinned key
    When the system reads the detail panel pinned setting
    Then detail panel pinned is true

  @pin-task-detail-panel @FR2
  Scenario: useDetailPanelPinned returns tuple with stable setter
    When the hook is called
    Then it returns isDetailPanelPinned and setDetailPanelPinned
