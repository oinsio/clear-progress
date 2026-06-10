## MODIFIED Requirements

### Requirement: Clipboard copy with invite message
The system SHALL copy invite message and full app URL (including base path) to clipboard when copy link button is clicked.

#### Scenario: Copy invite message with full app link
- **WHEN** user clicks copy link button
- **THEN** clipboard contains invite message text followed by `window.location.origin` + `import.meta.env.BASE_URL`

#### Scenario: Copy link in dev environment
- **WHEN** user clicks copy link button in dev environment where BASE_URL is "/"
- **THEN** clipboard URL equals `window.location.origin` + "/" (no duplicate slashes, trailing slash is acceptable)

#### Scenario: Confirmation dialog after clipboard copy
- **WHEN** text is successfully copied to clipboard
- **THEN** confirmation dialog appears with message from i18n

#### Scenario: Clipboard copy failure
- **WHEN** clipboard write fails (blocked by permissions)
- **THEN** error dialog appears with error message from i18n
