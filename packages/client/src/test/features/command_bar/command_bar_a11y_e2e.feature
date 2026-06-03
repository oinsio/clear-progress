Feature: Command Bar — Accessibility (E2E)
  Implements NFR-A1–A5 of command-bar.
  Tests that require a real browser for aria attributes and keyboard interaction.

  Background:
    Given user is on a page with full CommandBar configuration

  @command-bar @NFR-A1
  Scenario: All interactive elements have aria-labels
    Then filter toggle has a non-empty aria-label
    And box buttons have non-empty aria-labels
    And eye toggle has a non-empty aria-label
    And create button has a non-empty aria-label
    And textarea has a non-empty aria-label

  @command-bar @NFR-A2
  Scenario: Filter toggle has aria-expanded attribute
    Then filter toggle has aria-expanded set to "false"
    When user expands the filter
    Then filter toggle has aria-expanded set to "true"

  @command-bar @NFR-A3
  Scenario: Eye toggle has aria-pressed attribute
    Then eye toggle has aria-pressed set to "false"
    When user toggles hidden task visibility
    Then eye toggle has aria-pressed set to "true"

  @command-bar @NFR-A4
  Scenario: All buttons are keyboard focusable and activatable
    When user navigates to filter toggle via keyboard
    Then filter toggle receives keyboard focus
    When user activates filter toggle via keyboard
    Then filter is expanded
    When user navigates to create button via keyboard
    Then create button receives keyboard focus

  @command-bar @NFR-A5
  Scenario: Textarea has appropriate placeholder and role
    Then textarea has a visible placeholder text
    And textarea has role "textbox"
