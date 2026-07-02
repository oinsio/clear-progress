# Capability: Ideas

## Purpose

Lightweight capture and management of ideas with drag-and-drop ordering, inline search, and cross-device sync. Ideas are a flat list (no hierarchy) with manual sort order.

## Requirements

### Requirement: User can create an idea

User SHALL be able to create an idea by providing a name. System MUST generate a UUID v4 client-side, set `revision` to 0, `needsSync` to true, `is_deleted` to false, and `description` to empty string. The `sort_order` MUST be generated via `generateTopKey()` — a fractional index key above the current maximum. Timestamps `created_at` and `updated_at` MUST be set to current time in ISO 8601 with Z suffix. Implements FR2, FR5 of desc-sort-order.

#### Scenario: Create idea with name only
- **WHEN** user creates an idea with name "Voice UI for calendar"
- **THEN** idea is created with the provided name, UUID v4 id, revision=0, needsSync=true, is_deleted=false

#### Scenario: Create idea with name and description
- **WHEN** user creates an idea with name "Learn Rust" and description "Systems programming"
- **THEN** idea is persisted with both name and description preserved

#### Scenario: New idea sort_order above maximum
- **GIVEN** 3 active ideas exist with sort keys "a0", "a1", "a2"
- **WHEN** user creates a new idea
- **THEN** new idea has sort_order above "a2"

#### Scenario: UUID generated client-side
- **WHEN** user creates an idea
- **THEN** id is a valid UUID v4 generated via crypto.randomUUID()

#### Scenario: Timestamps set on creation
- **WHEN** user creates an idea
- **THEN** created_at and updated_at are equal and in ISO 8601 format with Z suffix

### Requirement: User can view active ideas

User SHALL be able to view a list of active (non-deleted) ideas sorted by `sort_order` descending (highest key first). Soft-deleted ideas MUST NOT appear in the active list. Idea description in the list item SHALL preserve newline characters by applying `white-space: pre-line` CSS property. Implements FR3 of fix-newline-display, FR2 of desc-sort-order.

#### Scenario: List sorted by sort_order descending
- **GIVEN** ideas exist with sort_order "a0", "a1", "a2"
- **WHEN** user views the ideas list
- **THEN** ideas are returned in order: sort_order "a2", "a1", "a0"

#### Scenario: Empty list
- **GIVEN** no ideas exist
- **WHEN** user views the ideas list
- **THEN** an empty array is returned

#### Scenario: Soft-deleted ideas excluded
- **GIVEN** 2 active ideas and 1 soft-deleted idea exist
- **WHEN** user views the ideas list
- **THEN** only 2 active ideas are returned

#### Scenario: Description preserves newlines in list view
- **GIVEN** idea with description "Line one\nLine two" exists
- **WHEN** user views the ideas list
- **THEN** the description element has CSS class `whitespace-pre-line`

### Requirement: User can update an idea

User SHALL be able to update idea name and description. System MUST use smart dirty flag: if the update contains identical data to the current state, `needsSync` MUST NOT be set and `updated_at` MUST NOT change. If data actually changed, `needsSync` MUST be set to true and `updated_at` MUST be refreshed. The `id` field MUST never change.

#### Scenario: Update idea name
- **GIVEN** idea "Learn Rust" exists
- **WHEN** user updates name to "Learn Go"
- **THEN** idea name is "Learn Go", needsSync is true, updated_at is refreshed

#### Scenario: Update idea description
- **GIVEN** idea with description "Old" exists
- **WHEN** user updates description to "New"
- **THEN** description is "New", needsSync is true

#### Scenario: No-op update does not trigger sync
- **GIVEN** idea "Learn Rust" exists with needsSync false
- **WHEN** user updates name to "Learn Rust" (same value)
- **THEN** needsSync remains false, updated_at is unchanged

#### Scenario: Update nonexistent idea throws error
- **WHEN** user attempts to update an idea with a nonexistent ID
- **THEN** system throws error "Idea not found"

### Requirement: User can soft-delete and restore an idea

User SHALL be able to soft-delete an idea (sets `is_deleted` to true) and restore it (sets `is_deleted` to false). Both operations MUST mark the idea for sync.

#### Scenario: Soft-delete an idea
- **GIVEN** active idea "Learn Rust" exists
- **WHEN** user soft-deletes the idea
- **THEN** is_deleted is true, needsSync is true

#### Scenario: Restore a soft-deleted idea
- **GIVEN** soft-deleted idea "Learn Rust" exists
- **WHEN** user restores the idea
- **THEN** is_deleted is false, needsSync is true

#### Scenario: Soft-deleted idea excluded from active list
- **GIVEN** idea "Learn Rust" is soft-deleted
- **WHEN** user views the ideas list
- **THEN** "Learn Rust" does not appear

### Requirement: User can reorder ideas

User SHALL be able to reorder ideas via drag-and-drop. System MUST use fractional indexing to generate a new `sort_order` key between neighbors. Only the dragged idea MUST be updated. The moved idea MUST be marked for sync (`needsSync` = true). Drag-and-drop neighbor logic MUST use DESC semantics: index 0 = highest key, last index = lowest key. Implements FR6, FR7 of desc-sort-order.

#### Scenario: Reorder updates only dragged item
- **GIVEN** ideas A, B, C sorted DESC
- **WHEN** user drags C to position between A and B
- **THEN** only C gets a new sort_order between A and B, A and B are unchanged

#### Scenario: Reorder marks moved item for sync
- **GIVEN** ideas A, B, C sorted DESC
- **WHEN** user drags C to a new position
- **THEN** C has needsSync=true, A and B have unchanged needsSync

#### Scenario: Rebalancing with DESC sort
- **GIVEN** ideas sorted DESC with a sort key exceeding rebalance threshold
- **WHEN** rebalancing is triggered
- **THEN** all ideas receive new evenly-distributed keys maintaining DESC visual order

### Requirement: User can search ideas

User SHALL be able to search ideas by name and description. Search MUST be case-insensitive and match partial strings. Results MUST be sorted by `updated_at` descending (most recently updated first). Only active ideas are searched.

#### Scenario: Search by name
- **GIVEN** ideas "Learn Rust", "Learn Go", "Write book" exist
- **WHEN** user searches for "learn"
- **THEN** "Learn Rust" and "Learn Go" are returned

#### Scenario: Search by description
- **GIVEN** idea with name "Project" and description "Learn new frameworks" exists
- **WHEN** user searches for "framework"
- **THEN** "Project" is returned

#### Scenario: Case-insensitive search
- **GIVEN** idea "Learn RUST" exists
- **WHEN** user searches for "rust"
- **THEN** "Learn RUST" is returned

#### Scenario: Results sorted by updated_at descending
- **GIVEN** idea "A" updated at 10:00 and idea "B" updated at 11:00, both matching query
- **WHEN** user searches
- **THEN** "B" appears before "A"

#### Scenario: No matches returns empty
- **GIVEN** idea "Learn Rust" exists
- **WHEN** user searches for "python"
- **THEN** empty array is returned

### Requirement: Attachments section in idea detail panel

The idea detail panel SHALL show an attachments section below the description field. The section SHALL contain an attachment list and an attached file button. Users SHALL be able to attach, preview, download, and delete files from this section. Implements UX4 of add-file-attachments.

#### Scenario: Attachments section visible in idea detail panel

- **WHEN** user opens the idea detail panel
- **THEN** an attachments section is visible below the description field
- **AND** an attached file button is available

#### Scenario: Attach file to idea

- **WHEN** user clicks the attached file button in the idea detail panel
- **THEN** a native file picker opens filtered to allowed MIME types
- **AND** on file selection, the file is validated and attached to the idea

#### Scenario: View attachment list for idea

- **GIVEN** idea I1 has 2 attachments
- **WHEN** user opens the idea detail panel for I1
- **THEN** the attachment list shows 2 items with file type icon, filename, size, download and delete buttons

#### Scenario: Preview attachment from idea panel

- **WHEN** user clicks on an attachment item in the idea detail panel
- **THEN** the file lightbox opens for preview

#### Scenario: Empty attachments state

- **GIVEN** idea I1 has no attachments
- **WHEN** user opens the idea detail panel for I1
- **THEN** an empty state message is shown with an attached file button
