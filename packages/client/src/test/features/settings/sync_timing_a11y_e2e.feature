Feature: Sync timing controls — Accessibility (E2E)
  Implements NFR-A1 of configurable-sync-timing.
  Tests that require a real browser for aria attributes and axe-core checks.

  Background:
    Given user is on the settings page with the sync timing controls visible

  @configurable-sync-timing @NFR-A1
  Scenario: Sync interval input has an accessible label and description
    Then sync interval input has a non-empty aria-label
    And sync interval input has an aria-describedby pointing to visible help text

  @configurable-sync-timing @NFR-A1
  Scenario: Auto sync delay input has an accessible label and description
    Then auto sync delay input has a non-empty aria-label
    And auto sync delay input has an aria-describedby pointing to visible help text

  @configurable-sync-timing @NFR-A1
  Scenario: No axe-core violations in the sync timing controls
    Then sync timing controls pass axe-core accessibility checks
