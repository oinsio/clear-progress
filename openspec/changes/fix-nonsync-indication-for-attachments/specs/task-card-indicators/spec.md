## MODIFIED Requirements

### Requirement: Lightweight attachment count hook

`useAttachmentCount(entityType, entityId)` SHALL return the count of non-deleted attachments using an IndexedDB `.count()` query instead of loading full records. Additionally, it SHALL return a `hasUnsyncedAttachments` boolean indicating whether any non-deleted attachment for the given entity has `needsSync=true`, computed via a parallel `.count()` query within the same liveQuery subscription. Implements FR11, NFR-P1 of task-detail-page-ui-improvements. Implements FR1, NFR-P1 of fix-nonsync-indication-for-attachments.

#### Scenario: Hook returns correct count

- **WHEN** a task has 3 non-deleted attachments and 1 deleted attachment
- **THEN** `useAttachmentCount("task", taskId)` returns `attachmentCount: 3`

#### Scenario: Hook returns zero for no attachments

- **WHEN** a task has no attachments
- **THEN** `useAttachmentCount("task", taskId)` returns `attachmentCount: 0`

#### Scenario: Hook returns hasUnsyncedAttachments true when unsynced attachments exist

- **WHEN** a task has 2 non-deleted attachments and one of them has `needsSync=true`
- **THEN** `useAttachmentCount("task", taskId)` returns `hasUnsyncedAttachments: true`

#### Scenario: Hook returns hasUnsyncedAttachments false when all attachments are synced

- **WHEN** a task has 2 non-deleted attachments and both have `needsSync=false`
- **THEN** `useAttachmentCount("task", taskId)` returns `hasUnsyncedAttachments: false`

#### Scenario: Hook returns hasUnsyncedAttachments false when no attachments exist

- **WHEN** a task has no attachments
- **THEN** `useAttachmentCount("task", taskId)` returns `hasUnsyncedAttachments: false`
