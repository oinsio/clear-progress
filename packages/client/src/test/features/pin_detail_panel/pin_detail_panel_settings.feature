Feature: Detail panel pinned settings toggle
  Implements FR7 of pin-task-detail-panel, task-page-layout spec.

  @pin-task-detail-panel @FR7
  Scenario: Settings toggle reflects pinned state
    Given detail panel is pinned
    When SettingsPage is rendered
    Then the detail panel pinned toggle is on

  @pin-task-detail-panel @FR7
  Scenario: Settings toggle reflects unpinned state
    Given detail panel is not pinned
    When SettingsPage is rendered
    Then the detail panel pinned toggle is off

  @pin-task-detail-panel @FR7
  Scenario: Settings toggle changes preference
    Given detail panel is not pinned
    When user toggles the detail panel pinned switch
    Then setDetailPanelPinned is called with true
