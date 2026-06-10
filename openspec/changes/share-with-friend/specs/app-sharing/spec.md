# App Sharing Specification

## ADDED Requirements

### Requirement: Share button placement
The Settings page SHALL display a "Share app" section after "Interface Scale" section and before "Language" section.

#### Scenario: Section is visible in Settings
- **WHEN** user navigates to Settings page
- **THEN** "Share app" section is displayed after "Interface Scale" and before "Language"

#### Scenario: Section follows existing styling
- **WHEN** user views the "Share app" section
- **THEN** section matches typography, spacing, and borders of other settings sections

### Requirement: Share button trigger
The "Share app" section SHALL contain a button that triggers the share action.

#### Scenario: Button is labeled correctly
- **WHEN** user views the share button in Russian locale
- **THEN** button displays "Поделиться"

#### Scenario: Button is labeled correctly in English
- **WHEN** user views the share button in English locale
- **THEN** button displays "Share"

#### Scenario: Button has proper accessibility
- **WHEN** screen reader user focuses the share button
- **THEN** button announces its label via `aria-label` from i18n

### Requirement: Web Share API integration
The system SHALL attempt to use Web Share API when share button is clicked, if available.

#### Scenario: Share via Web Share API on mobile
- **WHEN** user clicks share button on device supporting Web Share API
- **THEN** native share sheet appears with app title, message, and URL

#### Scenario: Share data contains correct information
- **WHEN** Web Share API is invoked
- **THEN** shared data includes `title: "Clear Progress"`, `text` from i18n, and `url: window.location.origin`

#### Scenario: User cancels native share sheet
- **WHEN** user opens share sheet and then cancels (AbortError)
- **THEN** no error feedback is shown to user

#### Scenario: Web Share API fails with real error
- **WHEN** Web Share API throws error other than AbortError
- **THEN** system falls back to clipboard copy

### Requirement: Clipboard fallback
The system SHALL copy app URL to clipboard when Web Share API is unavailable or fails.

#### Scenario: Fallback on desktop without Web Share API
- **WHEN** user clicks share button on browser without Web Share API support
- **THEN** `window.location.origin` is copied to clipboard

#### Scenario: Confirmation dialog after clipboard copy
- **WHEN** URL is successfully copied to clipboard
- **THEN** confirmation dialog appears with message from i18n

#### Scenario: Clipboard copy failure
- **WHEN** clipboard write fails (blocked by permissions)
- **THEN** error dialog appears with error message from i18n

### Requirement: Confirmation dialog behavior
The system SHALL display a confirmation dialog after clipboard operations.

#### Scenario: Dialog has single dismiss button
- **WHEN** confirmation dialog is shown
- **THEN** dialog contains single "OK" button that closes the dialog

#### Scenario: Dialog is keyboard navigable
- **WHEN** confirmation dialog is open
- **THEN** user can dismiss with Tab → Enter or Escape key

#### Scenario: Dialog backdrop dismisses dialog
- **WHEN** user clicks backdrop behind confirmation dialog
- **THEN** dialog closes

#### Scenario: Dialog has proper ARIA attributes
- **WHEN** confirmation dialog is rendered
- **THEN** dialog has `role="alertdialog"`, `aria-labelledby`, and `aria-describedby` attributes

### Requirement: Localized share messages
The system SHALL provide localized share messages for Russian and English.

#### Scenario: Russian share message
- **WHEN** user shares app with Russian locale active
- **THEN** share text is "Попробуй Clear Progress — приложение для работы с задачами, целями и идеями!"

#### Scenario: English share message
- **WHEN** user shares app with English locale active
- **THEN** share text is "Try Clear Progress — an app for managing tasks, goals, and ideas!"

#### Scenario: Russian confirmation message
- **WHEN** URL is copied to clipboard with Russian locale
- **THEN** confirmation dialog shows "Ссылка скопирована в буфер обмена"

#### Scenario: English confirmation message
- **WHEN** URL is copied to clipboard with English locale
- **THEN** confirmation dialog shows "Link copied to clipboard"

### Requirement: Share action performance
The share action SHALL complete within 100ms, excluding native OS dialogs.

#### Scenario: Share button responds quickly
- **WHEN** user clicks share button
- **THEN** either Web Share API opens or clipboard copy completes within 100ms

### Requirement: Responsive layout
The share section SHALL render correctly on all screen sizes from 320px to 2560px.

#### Scenario: Mobile viewport
- **WHEN** page is rendered on 320px viewport
- **THEN** share section is fully visible and button is tappable

#### Scenario: Desktop viewport
- **WHEN** page is rendered on 2560px viewport
- **THEN** share section matches existing settings section max-width
