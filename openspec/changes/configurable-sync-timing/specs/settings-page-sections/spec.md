## MODIFIED Requirements

### Requirement: Account & Sync section contents

The Account & Sync section SHALL contain the sync-timing controls (periodic sync interval, then auto sync delay) followed by the server connection UI (existing ServerSection component). The sync-timing controls SHALL appear above the server connection UI. # implements FR8 of configurable-sync-timing

#### Scenario: Account & Sync section displays server connection
- **WHEN** the Account & Sync section is expanded
- **THEN** it displays the server connection interface

#### Scenario: Sync-timing controls appear above server connection
- **WHEN** the Account & Sync section is expanded
- **THEN** the periodic sync interval control and the auto sync delay control are displayed above the server connection interface
- **AND** the periodic sync interval control appears before the auto sync delay control
