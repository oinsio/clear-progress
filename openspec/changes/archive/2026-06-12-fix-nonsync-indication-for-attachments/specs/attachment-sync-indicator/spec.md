## ADDED Requirements

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
