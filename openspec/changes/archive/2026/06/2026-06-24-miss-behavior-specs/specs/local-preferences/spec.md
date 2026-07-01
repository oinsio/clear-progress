## ADDED Requirements

### Requirement: FocusMode dimming activates when task is selected or expanded

When focus mode is enabled and a task is either selected or expanded, all other tasks in the same TaskList SHALL be visually dimmed with the configured focus opacity. The selected task and the expanded task SHALL NOT be dimmed. Implements FR4, FR5 of miss-behavior-specs.

#### Scenario: No dimming when focus mode is off
- **WHEN** focus mode is disabled
- **AND** a task is selected
- **THEN** no tasks are dimmed

#### Scenario: No dimming when no task is selected or expanded
- **WHEN** focus mode is enabled
- **AND** no task is selected or expanded
- **THEN** no tasks are dimmed

#### Scenario: Non-selected tasks are dimmed when a task is selected
- **WHEN** focus mode is enabled
- **AND** a task is selected
- **THEN** all other tasks in the list are dimmed
- **AND** the selected task is not dimmed

#### Scenario: Expanded task is not dimmed
- **WHEN** focus mode is enabled
- **AND** a task is expanded
- **THEN** all other tasks in the list are dimmed
- **AND** the expanded task is not dimmed

#### Scenario: Both selected and expanded tasks are not dimmed
- **WHEN** focus mode is enabled
- **AND** one task is selected and another task is expanded
- **THEN** both the selected task and the expanded task are not dimmed
- **AND** all other tasks are dimmed

### Requirement: FocusMode dimming is deactivated when focus mode is off

When focus mode is disabled, no tasks SHALL be dimmed regardless of selection or expansion state. Implements FR6 of miss-behavior-specs.

#### Scenario: Disabling focus mode removes all dimming
- **WHEN** focus mode is toggled from enabled to disabled
- **AND** a task is selected
- **THEN** no tasks are dimmed
