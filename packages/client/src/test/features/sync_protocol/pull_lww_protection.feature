Feature: Pull LWW Protection
  Implements FR5 of fix-stale-sync-overwrites.

  @fix-stale-sync-overwrites @FR5
  Scenario: A locally-pending edit is overwritten when another device's edit is newer
    Given a task edited locally and pending sync, with a locally-pending goal edited the same way
    When the same records are pulled from the server with a strictly newer edit from another device
    Then both records show the other device's edit and are marked as synced

  @fix-stale-sync-overwrites @FR5
  Scenario: A locally-pending edit survives a pull of an equally old server record
    Given a task edited locally and pending sync, with a locally-pending goal edited the same way
    When the same records are pulled from the server with no newer edit from another device, timestamps tied
    Then both records still show the local edit and remain pending sync

  @fix-stale-sync-overwrites @FR5
  Scenario: A locally-pending edit survives a pull of an older server record
    Given a task edited locally and pending sync, with a locally-pending goal edited the same way
    When the same records are pulled from the server with an older, stale edit from another device
    Then both records still show the local edit and remain pending sync

  @fix-stale-sync-overwrites @FR5
  Scenario: A synced record always reflects the latest pull
    Given a task already in sync with the server, with a goal already in sync the same way
    When the same records are pulled from the server with a newer edit from another device
    Then both records show the other device's edit and are marked as synced

  @fix-stale-sync-overwrites @FR5
  Scenario: A new record from another device appears after its first pull
    Given no local copy of a task or a goal exists yet
    When the same records are pulled from the server for the first time
    Then both records appear locally and are marked as synced

  @fix-stale-sync-overwrites @FR5
  Scenario: An overwritten pending edit is logged as a sync conflict for debugging
    Given a task edited locally and pending sync
    When the task is pulled from the server with a strictly newer edit from another device
    Then a sync conflict is logged with the task's id and both devices' timestamps
