Feature: Menu order cross-instance reactivity
  Menu order changes must be immediately visible to all consumers
  without page navigation. Implements fix-menu-order-reactivity.

  @fix-menu-order-reactivity @FR1
  Scenario: Menu order changed in one instance reflected in another
    Given two independent consumers of menu order
    When the first consumer changes the menu order
    Then the second consumer receives the updated menu order

  @fix-menu-order-reactivity @FR1
  Scenario: Menu item visibility toggled reflected across instances
    Given two independent consumers of menu order
    When the first consumer hides a menu item
    Then the second consumer sees the item as hidden

  @fix-menu-order-reactivity @FR1
  Scenario: Multiple rapid changes all reflected
    Given two independent consumers of menu order
    When the first consumer makes three rapid order changes
    Then the second consumer reflects the final order
