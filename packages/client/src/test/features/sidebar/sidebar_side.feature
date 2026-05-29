Feature: Sidebar Side Placement
  Sidebar renders on the left or right side of the screen.
  Left placement reverses element order and border direction.

  @add-sidebar-specs @FR4
  Scenario: Right placement renders default layout
    Given sidebar is expanded
    And sidebar side is "right"
    Then sidebar renders with left border
    And sync button appears before account button

  @add-sidebar-specs @FR4
  Scenario: Left placement reverses layout
    Given sidebar is expanded
    And sidebar side is "left"
    Then sidebar renders with right border
    And sidebar has order-first class
    And account button appears before sync button

  @add-sidebar-specs @FR4
  Scenario: Collapsed sidebar respects side placement
    Given sidebar is collapsed
    And sidebar side is "left"
    Then sidebar has order-first class
    And sidebar renders with right border
