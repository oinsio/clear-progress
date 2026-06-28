## ADDED Requirements

### Requirement: Rejected records show red border indicator
Records with `syncStatus: "rejected"` SHALL display a red left border (`border-l-red-500`) in list views. Records with `syncStatus: "pending"` SHALL display an amber left border (`border-l-amber-400`). Records with `syncStatus: "synced"` SHALL have no border indicator.

#### Scenario: Rejected task shows red border
- **WHEN** a task has `syncStatus: "rejected"`
- **THEN** the task card displays a red left border

#### Scenario: Pending task shows amber border
- **WHEN** a task has `syncStatus: "pending"`
- **THEN** the task card displays an amber left border

#### Scenario: Synced task shows no border
- **WHEN** a task has `syncStatus: "synced"`
- **THEN** the task card displays no sync indicator border

### Requirement: SyncAlertDialog shows healable corrections with data loss
When self-healing corrections result in data loss (stale FK in batch, lost name, corrupted repeat rule), the system SHALL show a `SyncAlertDialog` with a description of the problem and a recommendation for the user.

#### Scenario: Dialog shown when FK cleared due to batch rejection
- **WHEN** a task's `goal_id` is cleared because the referenced goal was rejected in the same batch
- **THEN** a dialog is shown with the problem description and recommendation to re-link

#### Scenario: Dialog shown when name replaced with untitled
- **WHEN** a record's empty `name` is replaced with "(untitled)"
- **THEN** a dialog is shown recommending the user enter a name

### Requirement: SyncAlertQueue shows multiple dialogs sequentially
When multiple sync problems occur in one cycle, the system SHALL queue dialogs and show them one at a time. Each dialog SHALL have a single "Understood" button.

#### Scenario: Two problems show two sequential dialogs
- **WHEN** sync cycle produces 2 healable corrections with data loss
- **THEN** first dialog is shown, after dismissal second dialog is shown

#### Scenario: Single problem shows single dialog
- **WHEN** sync cycle produces 1 healable correction with data loss
- **THEN** one dialog is shown, no queue needed
