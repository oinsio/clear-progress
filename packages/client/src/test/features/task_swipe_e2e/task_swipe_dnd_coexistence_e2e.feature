Feature: Task swipe and DnD coexistence (E2E)
  Implements FR16 of swipeable-item.
  Tests that drag-and-drop reorder works without accidental swipes.

  @swipeable-item @FR16
  Scenario: Drag handle initiates reorder without triggering swipe
    Given user has two tasks in the inbox
    And user navigates to the inbox page
    When user drags the first task via drag handle to the second position
    Then the task order changes without any swipe action firing
