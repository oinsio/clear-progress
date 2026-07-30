Feature: Sync timing settings UX
  Implements UX1, UX2, UX3, UX4, UX5 of configurable-sync-timing.

  @configurable-sync-timing @UX1
  Scenario: Reverts to last valid value when an out-of-range sync_interval is entered
    Given sync_interval is set to 5
    When the sync interval input is changed to "99999" and blurred
    Then the sync interval input shows "5"
    And onSyncIntervalChange was not called

  @configurable-sync-timing @UX1
  Scenario: Reverts to last valid value when a non-numeric auto_sync_delay is entered
    Given auto_sync_delay is set to 15
    When the auto sync delay input is changed to "abc" and blurred
    Then the auto sync delay input shows "15"
    And onAutoSyncDelayChange was not called

  @configurable-sync-timing @UX1
  Scenario: Preserves an intentionally cleared sync_interval as disabled
    Given sync_interval is set to 5
    When the sync interval input is changed to "" and blurred
    Then onSyncIntervalChange was called with the value null

  @configurable-sync-timing @UX2
  Scenario: Displays sync_interval in minutes with a unit label, never milliseconds
    Given sync_interval is set to 5
    When the sync timing section is rendered
    Then the sync interval unit label is shown
    And the sync interval unit label does not mention milliseconds

  @configurable-sync-timing @UX2
  Scenario: Displays auto_sync_delay in seconds with a unit label, never milliseconds
    Given auto_sync_delay is set to 15
    When the sync timing section is rendered
    Then the auto sync delay unit label is shown
    And the auto sync delay unit label does not mention milliseconds

  @configurable-sync-timing @UX3
  Scenario: Shows disabled help text when sync_interval is empty
    Given sync_interval is set to null
    When the sync timing section is rendered
    Then the sync interval disabled hint is shown

  @configurable-sync-timing @UX3
  Scenario: Shows immediate help text when auto_sync_delay is zero
    Given auto_sync_delay is set to 0
    When the sync timing section is rendered
    Then the auto sync delay immediate hint is shown

  @configurable-sync-timing @UX4
  Scenario: Shows a sync indicator next to the sync_interval control
    When the sync timing section is rendered
    Then a sync indicator is shown near the sync interval label

  @configurable-sync-timing @UX4
  Scenario: Shows a sync indicator next to the auto_sync_delay control
    When the sync timing section is rendered
    Then a sync indicator is shown near the auto sync delay label

  @configurable-sync-timing @UX5
  Scenario: Reverts and shows an error when persisting sync_interval fails
    Given sync_interval is set to 5
    And onSyncIntervalChange will fail
    When the sync interval input is changed to "20" and blurred
    Then the sync interval input shows "5"
    And a sync timing write error is shown
