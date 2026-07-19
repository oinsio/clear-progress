Feature: Sort Order Rebalance Sync
  Implements FR4 of fix-stale-sync-overwrites.

  @fix-stale-sync-overwrites @FR4
  Scenario: A task swept into rebalancing keeps the timestamp of its last real edit
    Given a box "inbox" with tasks needing rebalance, where task "other" has updated_at "2025-01-01T00:00:00.000Z"
    When the user drags task "dragged" to trigger rebalancing
    Then task "other" has syncStatus "pending"
    And task "other"'s updated_at is still "2025-01-01T00:00:00.000Z"

  @fix-stale-sync-overwrites @FR4
  Scenario: The task the user actually reordered gets a fresh timestamp
    Given a box "inbox" with tasks needing rebalance, where task "dragged" has updated_at "2025-01-01T00:00:00.000Z"
    When the user drags task "dragged" to trigger rebalancing
    Then task "dragged" has syncStatus "pending"
    And task "dragged"'s updated_at is refreshed past "2025-01-01T00:00:00.000Z"
