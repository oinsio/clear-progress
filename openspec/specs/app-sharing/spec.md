# App Sharing Specification

## Purpose

Capability for sharing the app with friends via a copy-link action on the Settings page.

## Requirements

### Requirement: Share button placement
The Settings page SHALL display a "Share app" section after "Interface Scale" section and before "Language" section.

#### Scenario: Section is visible in Settings
- **WHEN** user navigates to Settings page
- **THEN** "Share app" section is displayed after "Interface Scale" and before "Language"

#### Scenario: Section follows existing styling
- **WHEN** user views the "Share app" section
- **THEN** section matches typography, spacing, and borders of other settings sections

### Requirement: Copy link button
The "Share app" section SHALL contain a "Copy link" button that copies invite message with app URL to clipboard.

#### Scenario: Button is labeled correctly
- **WHEN** user views the copy link button in Russian locale
- **THEN** button displays "Скопировать ссылку"

#### Scenario: Button is labeled correctly in English
- **WHEN** user views the copy link button in English locale
- **THEN** button displays "Copy link"

#### Scenario: Button has proper accessibility
- **WHEN** screen reader user focuses the copy link button
- **THEN** button announces its label via `aria-label` from i18n

### Requirement: Clipboard copy with invite message
The system SHALL copy invite message and app URL to clipboard when copy link button is clicked.

#### Scenario: Copy invite message with link
- **WHEN** user clicks copy link button
- **THEN** clipboard contains invite message text followed by `window.location.origin`

#### Scenario: Confirmation dialog after clipboard copy
- **WHEN** text is successfully copied to clipboard
- **THEN** confirmation dialog appears with message from i18n

#### Scenario: Clipboard copy failure
- **WHEN** clipboard write fails (blocked by permissions)
- **THEN** error dialog appears with error message from i18n

### Requirement: Confirmation dialog behavior
The system SHALL display a single-button confirmation dialog after clipboard operations.

#### Scenario: Dialog has single dismiss button
- **WHEN** confirmation dialog is shown
- **THEN** dialog contains single "OK" button in accent color that closes the dialog

#### Scenario: Dialog is keyboard navigable
- **WHEN** confirmation dialog is open
- **THEN** user can dismiss with Enter or Escape key

#### Scenario: Dialog backdrop dismisses dialog
- **WHEN** user clicks backdrop behind confirmation dialog
- **THEN** dialog closes

#### Scenario: Dialog has proper ARIA attributes
- **WHEN** confirmation dialog is rendered
- **THEN** dialog has `role="alertdialog"`, `aria-labelledby`, and `aria-describedby` attributes

### Requirement: Localized share messages
The system SHALL provide localized share messages for Russian and English.

#### Scenario: Russian share message
- **WHEN** user copies app link with Russian locale active
- **THEN** copied text contains "Попробуй Clear Progress — приложение для работы с задачами, целями и идеями!"

#### Scenario: English share message
- **WHEN** user copies app link with English locale active
- **THEN** copied text contains "Try Clear Progress — an app for managing tasks, goals, and ideas!"

#### Scenario: Russian confirmation message
- **WHEN** link is copied with Russian locale
- **THEN** confirmation dialog shows "Ссылка скопирована в буфер обмена"

#### Scenario: English confirmation message
- **WHEN** link is copied with English locale
- **THEN** confirmation dialog shows "Link copied to clipboard"

### Requirement: Copy action performance
The copy action SHALL complete within 100ms.

#### Scenario: Copy link button responds quickly
- **WHEN** user clicks copy link button
- **THEN** clipboard copy completes within 100ms

### Requirement: Responsive layout
The share section SHALL render correctly on all screen sizes from 320px to 2560px.

#### Scenario: Mobile viewport
- **WHEN** page is rendered on 320px viewport
- **THEN** share section is fully visible and button is tappable

#### Scenario: Desktop viewport
- **WHEN** page is rendered on 2560px viewport
- **THEN** share section matches existing settings section max-width
