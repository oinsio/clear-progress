## MODIFIED Requirements

### Requirement: Right panel login button navigates to Settings
When no backend is configured, the right panel SHALL display a "Configure server" button that navigates to `/settings`. The button SHALL NOT navigate to `/setup`.

#### Scenario: Configure server button visible when not connected
- **WHEN** right panel is rendered
- **AND** no backend is configured
- **THEN** a "Configure server" button is displayed

#### Scenario: Configure server button navigates to Settings
- **WHEN** user clicks the "Configure server" button
- **THEN** app navigates to `/settings`

## REMOVED Requirements

### Requirement: Right panel login button navigates to Setup
**Reason**: The `/setup` route is removed. Connection is now done via Settings page.
**Migration**: Button navigates to `/settings` with text "Configure server".
