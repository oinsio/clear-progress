# Capability: Task Card Indicators

## Purpose

Additional metadata indicators on task cards showing attachment count, goal, context, and category assignments. Allows users to see task metadata at a glance without opening the detail panel.

## Requirements

### Requirement: Attachment count indicator on task card

The task card SHALL display a Paperclip icon followed by the attachment count when the task has one or more attachments. The indicator SHALL NOT appear when the task has zero attachments. Implements FR6 of task-detail-page-ui-improvements.

#### Scenario: Task with attachments shows count

- **WHEN** a task has 3 attachments
- **THEN** the task card displays a Paperclip icon and "3" in the indicators row

#### Scenario: Task with no attachments hides indicator

- **WHEN** a task has 0 attachments
- **THEN** the task card does not display an attachment indicator

### Requirement: Goal indicator on task card

The task card SHALL display a Target icon when the task has a goal assigned (non-empty `goal_id`). Implements FR7 of task-detail-page-ui-improvements.

#### Scenario: Task with goal shows Target icon

- **WHEN** a task has a non-empty goal_id
- **THEN** the task card displays a Target icon in the indicators row

#### Scenario: Task without goal hides indicator

- **WHEN** a task has an empty goal_id
- **THEN** the task card does not display a Target icon

### Requirement: Context indicator on task card

The task card SHALL display a MapPin icon when the task has a context assigned (non-empty `context_id`). Implements FR8 of task-detail-page-ui-improvements.

#### Scenario: Task with context shows MapPin icon

- **WHEN** a task has a non-empty context_id
- **THEN** the task card displays a MapPin icon in the indicators row

#### Scenario: Task without context hides indicator

- **WHEN** a task has an empty context_id
- **THEN** the task card does not display a MapPin icon

### Requirement: Category indicator on task card

The task card SHALL display a Tag icon when the task has a category assigned (non-empty `category_id`). Implements FR9 of task-detail-page-ui-improvements.

#### Scenario: Task with category shows Tag icon

- **WHEN** a task has a non-empty category_id
- **THEN** the task card displays a Tag icon in the indicators row

#### Scenario: Task without category hides indicator

- **WHEN** a task has an empty category_id
- **THEN** the task card does not display a Tag icon

### Requirement: Indicator display order

Task card indicators SHALL follow this order: description, checklist (with count), attachments (with count), goal, context, category, repeat, hidden. Implements FR10 of task-detail-page-ui-improvements.

#### Scenario: All indicators present in correct order

- **WHEN** a task has description, 3/5 checklist, 2 attachments, a goal, a context, a category, a repeat rule, and is hidden
- **THEN** the indicators appear in order: FileText, ListChecks 3/5, Paperclip 2, Target, MapPin, Tag, Repeat, EyeOff

### Requirement: Indicator styling matches existing pattern

All new indicators SHALL use `text-gray-400` color and enlarged icon sizes (`w-3.5 h-3.5` for icons, `text-xs` for count text) for improved visibility. New icons SHALL have `aria-hidden="true"`. Implements UX3, UX4, NFR-A2 of task-detail-page-ui-improvements.

#### Scenario: New indicators use gray-400 color

- **WHEN** a task card renders with goal, context, and category indicators
- **THEN** all three icons use `text-gray-400` styling

### Requirement: Lightweight attachment count hook

`useAttachmentCount(entityType, entityId)` SHALL return the count of non-deleted attachments using an IndexedDB `.count()` query instead of loading full records. Implements FR11, NFR-P1 of task-detail-page-ui-improvements.

#### Scenario: Hook returns correct count

- **WHEN** a task has 3 non-deleted attachments and 1 deleted attachment
- **THEN** `useAttachmentCount("task", taskId)` returns 3

#### Scenario: Hook returns zero for no attachments

- **WHEN** a task has no attachments
- **THEN** `useAttachmentCount("task", taskId)` returns 0
