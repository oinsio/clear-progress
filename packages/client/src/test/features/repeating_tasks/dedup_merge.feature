Feature: Dedup Merge After Two-Device Double Completion
  Implements FR3, FR6 of fix-stale-sync-overwrites.

  @fix-stale-sync-overwrites @FR3
  Scenario: Fixed schedule — earlier device's schedule wins with the later device's fresh content
    Given device A completed and edited the occurrence, producing a copy with next_date "2026-07-10" and description "v2" as the freshest update
    And device B completed the same occurrence offline, producing a copy with next_date "2026-07-09" and description "v1" as a staler update
    When deduplication runs after device B pulls both copies
    Then the surviving copy has next_date "2026-07-09"
    And the surviving copy has description "v2"
    And the surviving copy's updated_at equals device A's update time
    And device A's copy is soft-deleted with syncStatus "pending"

  @fix-stale-sync-overwrites @FR6
  Scenario: After-completion schedule — the same merge rules apply regardless of the recurrence model
    Given device A completed the occurrence under an after_completion repeat_rule, producing a copy with next_date "2026-07-04" as the freshest update
    And device B completed the same occurrence offline, producing a copy with next_date "2026-07-05" as a staler update
    When deduplication runs after device B pulls both copies
    Then the surviving copy has next_date "2026-07-04"
    And the surviving copy's repeat_rule is unchanged from before the merge
    And the surviving copy's appear_date is consistent with its own next_date

  @fix-stale-sync-overwrites @FR3
  Scenario: Merge is not a verbatim keep-earliest — schedule and content are combined from different copies
    Given device A completed and edited the occurrence, producing a copy with next_date "2026-07-10" and description "v2" as the freshest update
    And device B completed the same occurrence offline, producing a copy with next_date "2026-07-09" and description "v1" as a staler update
    When deduplication runs after device B pulls both copies
    Then the surviving copy does not equal device B's copy verbatim
    And the surviving copy does not equal device A's copy verbatim
