Feature: DnD Sensor Configuration
  Implements FR1, FR2, FR3 of drag-and-drop-spec.

  @drag-and-drop-spec @FR1
  Scenario: Pointer sensor uses distance constraint
    When useDndSensors is called
    Then the pointer sensor has a distance constraint of 8 pixels

  @drag-and-drop-spec @FR2
  Scenario: Touch sensor uses delay and tolerance constraints
    When useDndSensors is called
    Then the touch sensor has a delay of 250 milliseconds
    And the touch sensor has a tolerance of 5 pixels

  @drag-and-drop-spec @FR3
  Scenario: Hook returns two sensors
    When useDndSensors is called
    Then the result contains exactly 2 sensor entries
