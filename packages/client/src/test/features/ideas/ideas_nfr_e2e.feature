Feature: Ideas — Non-Functional Requirements (E2E)
  Accessibility, responsive design, and UX polish for Ideas.
  Tests that require real browser behavior.

  @add-ideas-specs @UX1
  Scenario: Empty state message when no ideas exist
    Given user is on the ideas page with no ideas
    Then empty state message is displayed

  @add-ideas-specs @NFR-A2
  Scenario: Add idea button has aria-label
    Given user is on the ideas page
    Then add idea button has a non-empty aria-label

  @add-ideas-specs @NFR-A2
  Scenario: Idea list item buttons have aria-labels
    Given an idea "Learn Rust" exists
    Then edit button has a non-empty aria-label
    And drag button has a non-empty aria-label

  @add-ideas-specs @NFR-A1
  Scenario: Keyboard navigation through idea list item actions
    Given an idea "Learn Rust" exists
    When user focuses the edit button via keyboard
    Then edit button receives keyboard focus
    When user presses Tab to next action
    Then drag button receives keyboard focus

  @add-ideas-specs @NFR-A2
  Scenario: Detail panel buttons have aria-labels
    Given an idea "Learn Rust" exists
    When user opens idea detail panel
    Then delete button has a non-empty aria-label
    And close button has a non-empty aria-label

  @add-ideas-specs @NFR-A3
  Scenario: Delete confirmation dialog keyboard accessibility
    Given an idea "Learn Rust" exists
    And user opens idea detail panel
    When user clicks delete button
    Then delete confirmation dialog is displayed
    And cancel button has a non-empty aria-label
    And confirm delete button has a non-empty aria-label
    When user presses Escape on dialog
    Then delete confirmation dialog closes

  @add-ideas-specs @NFR-R1
  Scenario: Detail panel displayed as side panel on desktop
    Given an idea "Learn Rust" exists
    And viewport is desktop size
    When user opens idea detail panel
    Then idea list and detail panel are both visible

  @add-ideas-specs @NFR-R1
  Scenario: Detail panel displayed as full-screen overlay on mobile
    Given an idea "Learn Rust" exists
    And viewport is mobile size
    When user opens idea detail panel
    Then detail panel is visible as full-screen overlay
    And idea list is hidden
