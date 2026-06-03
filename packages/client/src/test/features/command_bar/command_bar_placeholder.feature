Feature: CommandBar placeholder text
  Implements FR19 of command-bar.

  @command-bar @FR19
  Scenario: Specific filter box reflects that box in placeholder
    Given CommandBar is on a task page
    When filter is set to a specific box
    Then placeholder reflects the selected box
      | box   | placeholder               |
      | today | New task for today...     |
      | week  | New task for week...      |
      | later | New task for later...     |
      | inbox | New task to inbox...      |

  @command-bar @FR19
  Scenario: Filter "all" with default box shows default box placeholder
    Given CommandBar is on a task page
    And filter is set to "all"
    And user default box is "today"
    Then placeholder shows "New task for today..."

  @command-bar @FR19
  Scenario: Non-task page shows entity type placeholder
    When CommandBar is on a non-task page
    Then placeholder reflects the entity type
      | page       | placeholder        |
      | goals      | New goal...        |
      | ideas      | New idea...        |
      | categories | New category...    |
      | contexts   | New context...     |

  @command-bar @FR19
  Scenario: Placeholder updates when filter changes
    Given CommandBar is on a task page
    And filter is set to "today"
    When user changes filter to "week"
    Then placeholder updates to "New task for week..."
