# Delta Spec: App Shell Navigation

Implements rename-right-panel-to-sidebar.

## RENAMED Requirements

### Requirement: Right panel login button navigates to Settings
- **FROM:** Right panel login button navigates to Settings
- **TO:** Sidebar login button navigates to Settings

## MODIFIED Requirements

### Requirement: Sidebar login button navigates to Settings

When no backend is configured, the sidebar SHALL display a "Configure server" button that navigates to `/settings`. The button SHALL NOT navigate to `/setup`.

#### Scenario: Configure server button visible when not connected
- **WHEN** sidebar is rendered
- **AND** no backend is configured
- **THEN** a "Configure server" button is displayed

#### Scenario: Configure server button navigates to Settings
- **WHEN** user clicks the "Configure server" button
- **THEN** app navigates to `/settings`
