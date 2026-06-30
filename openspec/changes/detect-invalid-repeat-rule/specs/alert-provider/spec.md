## ADDED Requirements

### Requirement: AlertProvider manages a typed alert queue
The system SHALL provide an `AlertProvider` React context that holds an array of typed alerts (`AppAlert[]`). The provider SHALL expose `addAlerts(alerts: AppAlert[])` to append alerts and `dismissAlerts()` to clear all alerts. Alert types SHALL be defined as a discriminated union on the `type` field.

#### Scenario: Add alerts to empty queue
- **WHEN** `addAlerts` is called with 2 alerts and the queue is empty
- **THEN** the queue contains 2 alerts in the order they were added

#### Scenario: Add alerts to existing queue
- **WHEN** the queue already has 1 sync alert and `addAlerts` is called with 1 repeat rule alert
- **THEN** the queue contains 2 alerts: the sync alert first, then the repeat rule alert

#### Scenario: Dismiss all alerts
- **WHEN** the queue has 3 alerts and `dismissAlerts` is called
- **THEN** the queue is empty

### Requirement: AlertOverlay renders one alert at a time with paginated navigation
The system SHALL render a single alert dialog at a time from the alert queue. The dialog SHALL display a positional counter (`1/N`). Navigation buttons SHALL follow these rules: "Next" button appears when there are more alerts after the current one; "Back" button appears when there are alerts before the current one; "Understood" button appears on the last alert (or when there is only one alert). Pressing "Understood" SHALL call `dismissAlerts()`.

#### Scenario: Single alert shows counter 1/1 and Understood button
- **WHEN** the queue has 1 alert
- **THEN** the dialog shows counter "1/1" and an "Understood" button
- **AND** no "Back" or "Next" buttons are shown

#### Scenario: First of two alerts shows Next button
- **WHEN** the queue has 2 alerts and current index is 0
- **THEN** the dialog shows counter "1/2", a "Next" button, and no "Back" button
- **AND** no "Understood" button is shown

#### Scenario: Last of two alerts shows Back and Understood buttons
- **WHEN** the queue has 2 alerts and current index is 1
- **THEN** the dialog shows counter "2/2", a "Back" button, and an "Understood" button
- **AND** no "Next" button is shown

#### Scenario: Middle alert shows Back and Next buttons
- **WHEN** the queue has 3 alerts and current index is 1
- **THEN** the dialog shows counter "2/3", "Back" and "Next" buttons
- **AND** no "Understood" button is shown

#### Scenario: Pressing Understood dismisses all alerts
- **WHEN** user presses "Understood" on the last alert
- **THEN** all alerts are dismissed and the overlay is hidden

#### Scenario: Pressing Next advances to next alert
- **WHEN** user presses "Next" on alert 1/2
- **THEN** alert 2/2 is displayed

#### Scenario: Pressing Back returns to previous alert
- **WHEN** user presses "Back" on alert 2/2
- **THEN** alert 1/2 is displayed

### Requirement: Alert ordering by type priority
The system SHALL display alerts ordered by type priority: `sync` alerts first, then `repeat_rule_invalid` alerts. Within the same type, alerts SHALL maintain insertion order.

#### Scenario: Sync alerts shown before repeat rule alerts
- **WHEN** the queue contains 1 repeat_rule_invalid alert added first, then 1 sync alert added second
- **THEN** the sync alert is displayed first (index 0), repeat rule alert second (index 1)

### Requirement: AlertOverlay renders type-specific content
The system SHALL render different content based on alert type. For `sync` alerts, the system SHALL render the existing sync alert content (title, localized message). For `repeat_rule_invalid` alerts, the system SHALL render: problem description, how to fix, and a list of affected task names.

#### Scenario: Sync alert renders with sync title and message
- **WHEN** the current alert has type "sync" with messageKey "sync.healedName"
- **THEN** the dialog renders the sync alert title and the localized message

#### Scenario: Repeat rule alert renders with task list
- **WHEN** the current alert has type "repeat_rule_invalid" with taskNames ["Buy groceries", "Water plants"]
- **THEN** the dialog renders the problem description, fix instructions, and a list with both task names

### Requirement: Alert dialog accessibility
The alert dialog SHALL trap focus within the dialog, handle Escape key to dismiss, support `aria-labelledby` for the title and `aria-describedby` for the message, and use `role="alertdialog"` with `aria-modal="true"`. Navigation buttons SHALL have descriptive `aria-label` attributes including the position (e.g., "Alert 1 of 2, go to next").

#### Scenario: Focus trapped in dialog
- **WHEN** the alert dialog is shown
- **THEN** focus is trapped within the dialog and cannot move to elements behind the backdrop

#### Scenario: Escape dismisses all alerts
- **WHEN** user presses Escape while alert dialog is open
- **THEN** all alerts are dismissed

#### Scenario: Navigation button has descriptive aria-label
- **WHEN** alert 1/2 is shown with a "Next" button
- **THEN** the "Next" button has an aria-label describing the position
