Feature: Sync timing controls — Responsive layout (E2E)
  Implements NFR-R1 of configurable-sync-timing.
  Tests that require a real browser for viewport and layout behavior.

  Background:
    Given user is on the settings page with the sync timing controls visible

  @configurable-sync-timing @NFR-R1
  Scenario Outline: Sync timing inputs render without clipping at <width>px
    Given viewport is <width>px wide
    Then sync interval input is fully visible within the sync timing section
    And auto sync delay input is fully visible within the sync timing section

    Examples:
      | width |
      | 320   |
      | 768   |
      | 1440  |
      | 2560  |

  @configurable-sync-timing @NFR-R1
  Scenario Outline: Sync timing fields do not overlap at <width>px
    Given viewport is <width>px wide
    Then the sync interval field and the auto sync delay field do not overlap

    Examples:
      | width |
      | 320   |
      | 768   |
      | 1440  |
      | 2560  |

  @configurable-sync-timing @NFR-R1
  Scenario: Sync timing controls do not cause horizontal overflow on the narrowest viewport
    Given viewport is 320px wide
    Then the page does not overflow horizontally
