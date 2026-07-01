## ADDED Requirements

### Requirement: Entity sheets with typed column headers
The Google Sheets spreadsheet SHALL contain 7 entity sheets plus 1 meta sheet. Each sheet SHALL have a header row defining column order. The sheets and their columns SHALL be:

- **Tasks**: id, name, description, box, goal_id, context_id, category_id, is_completed, completed_at, repeat_rule, is_hidden, next_date, appear_date, original_task_id, sort_order, is_deleted, created_at, updated_at, revision
- **Goals**: id, name, description, cover_hash, status, sort_order, is_deleted, created_at, updated_at, revision
- **Contexts**: id, name, sort_order, is_deleted, created_at, updated_at, revision
- **Categories**: id, name, sort_order, is_deleted, created_at, updated_at, revision
- **Checklist_Items**: id, task_id, name, is_completed, sort_order, is_deleted, created_at, updated_at, revision
- **Ideas**: id, name, description, sort_order, is_deleted, created_at, updated_at, revision
- **Settings**: key, value, updated_at
- **Meta**: key, value (no header row defined in `SHEET_HEADERS`; initialized separately)

#### Scenario: All sheets created on init
- **WHEN** `init()` is called for the first time
- **THEN** all 8 sheets are created in the spreadsheet
- **AND** each entity sheet has its header row matching `SHEET_HEADERS`

#### Scenario: Sheet names match constants
- **WHEN** code references a sheet
- **THEN** it uses `SHEET_NAMES` constants: Tasks, Goals, Contexts, Categories, Checklist_Items, Ideas, Settings, Meta

### Requirement: Boolean coercion from Google Sheets
Google Sheets stores boolean values as strings `"TRUE"`/`"FALSE"` or native booleans. The system SHALL coerce cell values to JavaScript booleans using `coerceSheetBool()`: value `true` or string `"TRUE"` SHALL return `true`, all other values SHALL return `false`.

#### Scenario: Native boolean true
- **WHEN** cell value is `true` (JavaScript boolean)
- **THEN** `coerceSheetBool()` returns `true`

#### Scenario: String TRUE
- **WHEN** cell value is `"TRUE"` (string)
- **THEN** `coerceSheetBool()` returns `true`

#### Scenario: String FALSE
- **WHEN** cell value is `"FALSE"` (string)
- **THEN** `coerceSheetBool()` returns `false`

#### Scenario: Empty or null value
- **WHEN** cell value is `""`, `null`, or `undefined`
- **THEN** `coerceSheetBool()` returns `false`

### Requirement: Timestamp conversion to ISO 8601
Google Sheets `getValues()` returns `Date` objects for date/time cells. The system SHALL convert these to ISO 8601 strings with `Z` suffix and exactly 3 fractional digits using `toISOStringValue()`.

#### Scenario: Date object to ISO string
- **WHEN** cell value is a JavaScript `Date` object
- **THEN** `toISOStringValue()` returns `Date.toISOString()` result

#### Scenario: ISO string without fractional seconds
- **WHEN** cell value is string `"2025-01-15T10:30:00Z"`
- **THEN** `toISOStringValue()` returns `"2025-01-15T10:30:00.000Z"`

#### Scenario: ISO string with 1 fractional digit
- **WHEN** cell value is string `"2025-01-15T10:30:00.1Z"`
- **THEN** `toISOStringValue()` returns `"2025-01-15T10:30:00.100Z"`

#### Scenario: ISO string already normalized
- **WHEN** cell value is string `"2025-01-15T10:30:00.123Z"`
- **THEN** `toISOStringValue()` returns `"2025-01-15T10:30:00.123Z"` (unchanged)

#### Scenario: Empty value
- **WHEN** cell value is `""` or `null`
- **THEN** `toISOStringValue()` returns `""`

### Requirement: Date-only field storage with apostrophe prefix
Date-only fields (`next_date`, `appear_date` in Tasks sheet) SHALL be stored with a leading apostrophe (`'2025-01-15`) to prevent Google Sheets from auto-converting them to `Date` objects. The system SHALL use `normalizeToSheetDate()` for writing and `toISODateValue()` for reading.

#### Scenario: ISO date stored with apostrophe
- **WHEN** writing `next_date = "2025-01-15"` to Tasks sheet
- **THEN** cell value is `'2025-01-15` (apostrophe prefix forces text storage)

#### Scenario: Date object normalized to ISO date with apostrophe
- **WHEN** writing a JavaScript `Date` object to a date-only field
- **THEN** cell value is `'YYYY-MM-DD` extracted from the Date

#### Scenario: Already prefixed value is unchanged
- **WHEN** writing `'2025-01-15` (already has apostrophe)
- **THEN** cell value remains `'2025-01-15`

#### Scenario: Empty date-only value
- **WHEN** writing `""`, `null`, or `undefined` to a date-only field
- **THEN** cell value is `""`

#### Scenario: Reading date-only field strips apostrophe
- **WHEN** reading a cell with value `'2025-01-15`
- **THEN** `toISODateValue()` returns `"2025-01-15"`

#### Scenario: Date-only columns are configured per sheet
- **WHEN** checking which columns are date-only
- **THEN** only Tasks sheet columns `next_date` and `appear_date` are date-only
- **AND** all other sheets have no date-only columns

### Requirement: Box value coercion
The system SHALL coerce `box` field values using `coerceSheetBox()`. Valid values are: `"inbox"`, `"today"`, `"week"`, `"later"`. Invalid or missing values SHALL default to `"inbox"`.

#### Scenario: Valid box value
- **WHEN** cell value is `"today"`
- **THEN** `coerceSheetBox()` returns `"today"`

#### Scenario: Invalid box value
- **WHEN** cell value is `"invalid_box"`
- **THEN** `coerceSheetBox()` returns `"inbox"` (default)

#### Scenario: Missing box value
- **WHEN** cell value is `null` or `undefined`
- **THEN** `coerceSheetBox()` returns `"inbox"` (default)

### Requirement: Goal status coercion
The system SHALL coerce `status` field values using `coerceSheetGoalStatus()`. Valid values are: `"planning"`, `"in_progress"`, `"paused"`, `"completed"`, `"cancelled"`. Invalid or missing values SHALL default to `"planning"`.

#### Scenario: Valid goal status
- **WHEN** cell value is `"in_progress"`
- **THEN** `coerceSheetGoalStatus()` returns `"in_progress"`

#### Scenario: Invalid goal status
- **WHEN** cell value is `"unknown_status"`
- **THEN** `coerceSheetGoalStatus()` returns `"planning"` (default)

### Requirement: getAllRecords reads all non-empty rows
The `getAllRecords()` function SHALL read all rows from a sheet (excluding header row), filter out rows with empty first column (id), and map each row using the provided `rowMapper` function.

#### Scenario: Sheet with data rows
- **WHEN** sheet has header row and 3 data rows
- **THEN** `getAllRecords()` returns array of 3 mapped records

#### Scenario: Empty sheet (header only)
- **WHEN** sheet has only header row
- **THEN** `getAllRecords()` returns empty array

#### Scenario: Rows with empty id are skipped
- **WHEN** sheet has a row where first column (id) is empty
- **THEN** that row is excluded from results

### Requirement: upsertRecord creates or updates a single record
The `upsertRecord()` function SHALL find a row by matching the `id` field (first column). If found, it SHALL overwrite the row. If not found, it SHALL append a new row. Column values SHALL be ordered according to `SHEET_HEADERS`.

#### Scenario: Insert new record
- **WHEN** `upsertRecord()` is called with id "abc-123" and no matching row exists
- **THEN** a new row is appended to the sheet

#### Scenario: Update existing record
- **WHEN** `upsertRecord()` is called with id "abc-123" and a matching row exists at row 3
- **THEN** row 3 is overwritten with new values

### Requirement: upsertRecords batch creates or updates multiple records
The `upsertRecords()` function SHALL process multiple records in a single call. For each record, it SHALL find by id and update, or append if not found. An empty array SHALL be a no-op.

#### Scenario: Batch upsert with mix of new and existing
- **WHEN** `upsertRecords()` is called with 3 records: 1 existing, 2 new
- **THEN** 1 row is updated in place and 2 rows are appended

#### Scenario: Empty records array
- **WHEN** `upsertRecords()` is called with empty array
- **THEN** no sheet operations are performed

### Requirement: deleteRecordsByIds hard-deletes rows from sheet
The `deleteRecordsByIds()` function SHALL find rows by id (first column) and physically remove them from the sheet. Rows SHALL be deleted from bottom to top to preserve row indices. The function SHALL return the count of deleted rows.

#### Scenario: Delete existing records
- **WHEN** `deleteRecordsByIds()` is called with ids ["id-1", "id-2"]
- **AND** both ids exist in the sheet
- **THEN** both rows are removed from the sheet
- **AND** function returns 2

#### Scenario: Delete non-existing ids
- **WHEN** `deleteRecordsByIds()` is called with ids that do not exist in the sheet
- **THEN** no rows are removed
- **AND** function returns 0

#### Scenario: Rows deleted bottom-to-top
- **WHEN** `deleteRecordsByIds()` deletes rows at indices 3 and 7
- **THEN** row 7 is deleted first, then row 3 (to preserve indices)

### Requirement: Meta sheet stores revision counters
The Meta sheet SHALL store key-value pairs for `next_revision` and `purge_revision`. Initial values SHALL be `1` and `0` respectively. The system SHALL provide `readNextRevision()`, `saveNextRevision()`, `readPurgeRevision()`, `savePurgeRevision()` functions.

#### Scenario: Initial meta values
- **WHEN** `initMetaSheet()` is called
- **THEN** Meta sheet is created with rows: `["next_revision", 1]`, `["purge_revision", 0]`

#### Scenario: Read next revision
- **WHEN** Meta sheet has `next_revision = 5`
- **THEN** `readNextRevision()` returns 5

#### Scenario: Read missing key returns default
- **WHEN** Meta sheet has no `next_revision` row
- **THEN** `readNextRevision()` returns 1 (default)

#### Scenario: Save revision updates existing row
- **WHEN** `saveNextRevision(10)` is called and `next_revision` row exists
- **THEN** the row's value is updated to 10

#### Scenario: initMetaSheet is idempotent
- **WHEN** `initMetaSheet()` is called and Meta sheet already exists
- **THEN** no changes are made

### Requirement: Init creates Drive folder structure and spreadsheet
The `init()` action SHALL create a Google Drive folder structure: root folder "Clear_Progress" containing a "Covers" subfolder and a "Clear_Progress_Data" spreadsheet. All entity sheets SHALL be created with headers. IDs SHALL be stored in `PropertiesService`. The operation SHALL be idempotent.

#### Scenario: First-time init
- **WHEN** `init()` is called and no `SPREADSHEET_ID` property exists
- **THEN** root folder, covers folder, and spreadsheet are created in Google Drive
- **AND** `SPREADSHEET_ID`, `FOLDER_ID`, `COVERS_FOLDER_ID` are saved in PropertiesService
- **AND** all entity sheets are created with headers
- **AND** Meta sheet is initialized with default revision values
- **AND** default settings are written
- **AND** response has `created: true`

#### Scenario: Idempotent init with existing spreadsheet
- **WHEN** `init()` is called and `SPREADSHEET_ID` points to an existing file
- **THEN** no new resources are created
- **AND** response has `created: false`

#### Scenario: Init recovery after Drive file deleted
- **WHEN** `init()` is called and `SPREADSHEET_ID` points to a non-existent file
- **THEN** all properties are cleared
- **AND** new resources are created from scratch

### Requirement: Column mapping via colMap utility
The `colMap()` function SHALL return a mapping from column name to column index for a given sheet name, based on `SHEET_HEADERS`. This mapping is used by entity-specific `rowToRecord` functions to extract field values from row arrays.

#### Scenario: colMap returns correct indices
- **WHEN** `colMap("Tasks")` is called
- **THEN** result maps `id → 0`, `name → 1`, `description → 2`, `box → 3`, etc.

### Requirement: recordToRow converts entity to sheet row array
The `recordToRow()` function SHALL convert an entity record to an array of cell values ordered according to `SHEET_HEADERS` for the given sheet. Date-only fields SHALL be converted via `normalizeToSheetDate()`.

#### Scenario: Entity converted to row array
- **WHEN** `recordToRow("Tasks", task)` is called
- **THEN** result is an array with values in `SHEET_HEADERS["Tasks"]` column order

#### Scenario: Date-only fields are normalized
- **WHEN** `recordToRow("Tasks", { next_date: "2025-01-15", ... })` is called
- **THEN** the `next_date` cell value is `'2025-01-15` (apostrophe-prefixed)
