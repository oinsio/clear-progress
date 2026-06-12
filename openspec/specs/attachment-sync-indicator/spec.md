# Capability: Attachment Sync Indicator

## Purpose

Amber left-border sync stripe on attachment list items, matching the existing sync indicator pattern used by all other entities (tasks, goals, ideas, checklist items, contexts, categories).

## Requirements

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

### Requirement: Amber stripe cascades to parent entity for unsynced attachments

When any non-deleted attachment of an entity has `needsSync=true`, the parent entity card (TaskItem, IdeaItem, GoalItem) SHALL display the amber left border stripe (`border-l-amber-400`), even if the entity itself has `needsSync=false`. Implements FR2, FR3, FR4 of fix-nonsync-indication-for-attachments.

#### Scenario: Task with unsynced attachment shows amber stripe

- **WHEN** a task has `needsSync=false` and one of its attachments has `needsSync=true`
- **THEN** the TaskItem displays the amber left border stripe

#### Scenario: Idea with unsynced attachment shows amber stripe

- **WHEN** an idea has `needsSync=false` and one of its attachments has `needsSync=true`
- **THEN** the IdeaItem displays the amber left border stripe

#### Scenario: Goal with unsynced attachment shows amber stripe

- **WHEN** a goal has `needsSync=false` and one of its attachments has `needsSync=true`
- **THEN** the GoalItem displays the amber left border stripe

#### Scenario: Entity with all attachments synced shows no amber stripe

- **WHEN** an entity has `needsSync=false` and all its attachments have `needsSync=false`
- **THEN** the entity card displays a transparent left border (no amber stripe)

#### Scenario: Entity with no attachments uses own needsSync

- **WHEN** an entity has `needsSync=true` and has no attachments
- **THEN** the entity card displays the amber stripe based on its own `needsSync` flag
