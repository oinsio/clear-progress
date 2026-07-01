# Capability: Attachment Sync Indicator

## Purpose

Amber left-border sync stripe on attachment list items, matching the existing sync indicator pattern used by all other entities (tasks, goals, ideas, checklist items, contexts, categories).

## ADDED Requirements

### Requirement: Amber stripe on unsynced attachment

AttachmentListItem SHALL display a `border-l-2 border-l-amber-400` left border when the attachment's `needsSync` field is true. Implements FR12 of task-detail-page-ui-improvements.

#### Scenario: Unsynced attachment shows amber stripe

- **WHEN** an attachment has `needsSync` set to true
- **THEN** the attachment list item displays a 2px amber left border

### Requirement: Transparent stripe on synced attachment

AttachmentListItem SHALL display a `border-l-2 border-l-transparent` left border when the attachment's `needsSync` field is false. Implements FR13 of task-detail-page-ui-improvements.

#### Scenario: Synced attachment shows no visible stripe

- **WHEN** an attachment has `needsSync` set to false
- **THEN** the attachment list item displays a 2px transparent left border

### Requirement: Stripe matches existing entity pattern

The amber stripe on attachment items SHALL be visually identical to the amber stripes on TaskItem, GoalItem, and IdeaItem. Implements UX5 of task-detail-page-ui-improvements.

#### Scenario: Visual consistency with entity sync stripes

- **WHEN** an unsynced attachment and an unsynced task are viewed side by side
- **THEN** both amber stripes use the same border width (2px) and color (amber-400)
