## MODIFIED Requirements

### Requirement: Push sends dirty records to server
The system SHALL collect all records with `needsSync = true` from IndexedDB and send them to the server via `push(PushRequest)`. The `needsSync` field SHALL be stripped before sending. Each entity type (tasks, goals, contexts, categories, ideas, checklist_items, attachments, settings) SHALL be sent in its corresponding field of PushRequest.

#### Scenario: Regular push collects only dirty records
- **WHEN** client has 5 tasks, 2 with `needsSync = true`
- **THEN** PushRequest contains only those 2 tasks

#### Scenario: Force push collects all records
- **WHEN** `push(force = true)` is called
- **THEN** PushRequest contains all 5 tasks regardless of `needsSync`

#### Scenario: needsSync is stripped from wire format
- **WHEN** PushRequest is sent to server
- **THEN** no record in the request contains the `needsSync` field

#### Scenario: Goals with local cover IDs are sanitized
- **WHEN** a goal has `cover_file_id` prefixed with `"local:"`
- **THEN** PushRequest sends `cover_file_id = ""` for that goal

#### Scenario: Dirty attachments included in push
- **WHEN** client has 3 attachments, 1 with `needsSync = true`
- **THEN** PushRequest.attachments contains only that 1 attachment

### Requirement: Chunked push fills attachments after parent entities
When push is split into chunks, attachments SHALL be filled after tasks, goals, and ideas in the chunk fill order: `contexts → categories → goals → ideas → tasks → checklist_items → attachments → settings`. This ensures parent entities land in the same or an earlier chunk than their attachments, preventing temporarily orphaned attachments on the server if a chunk fails mid-sequence. Implements FR6 of add-file-attachments, design decision D11.

#### Scenario: Attachment placed after its parent entity in chunks
- **GIVEN** client has 190 dirty tasks and 20 dirty attachments (all referencing those tasks)
- **WHEN** push is chunked (limit 200)
- **THEN** chunk 1 contains 190 tasks and 10 attachments
- **AND** chunk 2 contains the remaining 10 attachments

#### Scenario: New entity and its attachment in same offline session
- **GIVEN** user created task T1 and attached file to T1 while offline
- **WHEN** push is called
- **THEN** T1 appears before its attachment in chunk fill order

### Requirement: Pull fetches server changes by revision
The client SHALL send `PullRequest` with `since_revision` (the last known revision). The server SHALL return all records with `revision > since_revision`, including attachments.

#### Scenario: Incremental pull returns only new records
- **WHEN** client sends `since_revision = 5`
- **AND** server has records with revisions 1-10
- **THEN** response contains only records with revision 6-10

#### Scenario: Full pull with since_revision = 0
- **WHEN** client sends `since_revision = 0`
- **THEN** response contains all records on server

#### Scenario: Pull response includes current_revision
- **WHEN** pull completes
- **THEN** response contains `current_revision` = (`next_revision - 1` on server)
- **AND** client updates `last_known_revision` to this value

#### Scenario: Pull includes attachments
- **WHEN** server has attachment records with revision > since_revision
- **THEN** PullResponse.attachments contains those attachment records

### Requirement: Cascading soft-delete for attachments
When a task, goal, or idea is soft-deleted, the system SHALL also soft-delete all attachments belonging to that entity. Each cascaded attachment SHALL have `is_deleted = true`, `needsSync = true`, and `updated_at` set to the current timestamp.

#### Scenario: Soft-delete task cascades to its attachments
- **WHEN** user soft-deletes task T1 which has attachments A1 and A2
- **THEN** T1 has `is_deleted = true`, `needsSync = true`
- **AND** A1 has `is_deleted = true`, `needsSync = true`
- **AND** A2 has `is_deleted = true`, `needsSync = true`

#### Scenario: Soft-delete goal cascades to its attachments
- **WHEN** user soft-deletes goal G1 which has attachments A3
- **THEN** G1 has `is_deleted = true`, `needsSync = true`
- **AND** A3 has `is_deleted = true`, `needsSync = true`

#### Scenario: Soft-delete idea cascades to its attachments
- **WHEN** user soft-deletes idea I1 which has attachments A4
- **THEN** I1 has `is_deleted = true`, `needsSync = true`
- **AND** A4 has `is_deleted = true`, `needsSync = true`

#### Scenario: Soft-delete entity with no attachments
- **WHEN** user soft-deletes task T2 which has no attachments
- **THEN** only T2 has `is_deleted = true`
- **AND** no error occurs

### Requirement: Cascading restore for attachments
When a task, goal, or idea is restored, the system SHALL restore ALL attachments belonging to that entity, regardless of whether they were manually deleted before the entity was deleted.

#### Scenario: Restore task restores all attachments
- **WHEN** user restores task T1 which has attachments A1 and A2 (both `is_deleted = true`)
- **THEN** T1 has `is_deleted = false`, `needsSync = true`
- **AND** A1 has `is_deleted = false`, `needsSync = true`
- **AND** A2 has `is_deleted = false`, `needsSync = true`

#### Scenario: Restore goal restores all attachments
- **WHEN** user restores goal G1 which has attachment A3 (`is_deleted = true`)
- **THEN** G1 has `is_deleted = false`, `needsSync = true`
- **AND** A3 has `is_deleted = false`, `needsSync = true`
