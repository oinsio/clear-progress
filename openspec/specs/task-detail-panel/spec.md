# Capability: Task Detail Panel

## Purpose

Form state management, label resolution, and entity name resolution for the task detail editing panel. Composes useTaskFormState (field initialization), useTaskEditLabels (display name resolution + checklist label), and resolveEntityName (pure utility for ID-to-name mapping).

## Requirements

### Requirement: Form state initialization (useTaskFormState)

useTaskFormState SHALL initialize all form fields from the provided Task entity: name, description, goal_id (as selectedGoalId), context_id (as selectedContextId), category_id (as selectedCategoryId), box (as selectedBox), and repeat_rule (parsed into RepeatRule object via parseRepeatRule). Implements FR1 of task-detail-panel-spec.

#### Scenario: All fields initialized from task

- **GIVEN** a task with name "Buy groceries", description "Milk and eggs", box "today", goal_id "g1", context_id "c1", category_id "cat1"
- **WHEN** useTaskFormState is initialized with this task
- **THEN** name is "Buy groceries", description is "Milk and eggs", selectedBox is "today", selectedGoalId is "g1", selectedContextId is "c1", selectedCategoryId is "cat1"

#### Scenario: Empty optional fields initialized as empty strings

- **GIVEN** a task with empty goal_id, context_id, and category_id
- **WHEN** useTaskFormState is initialized
- **THEN** selectedGoalId, selectedContextId, and selectedCategoryId are empty strings

### Requirement: Repeat rule parsing on initialization

useTaskFormState SHALL parse the task's repeat_rule string into a RepeatRule object. Empty repeat_rule SHALL result in null. Implements FR3 of task-detail-panel-spec.

#### Scenario: Repeat rule parsed from task

- **GIVEN** a task with repeat_rule "daily:1:after_completion:today"
- **WHEN** useTaskFormState is initialized
- **THEN** selectedRepeatRule is a RepeatRule object with frequency "daily" and interval 1

#### Scenario: Empty repeat rule results in null

- **GIVEN** a task with empty repeat_rule
- **WHEN** useTaskFormState is initialized
- **THEN** selectedRepeatRule is null

### Requirement: Form state setters

useTaskFormState SHALL expose setter functions for each field: setName, setDescription, setSelectedGoalId, setSelectedContextId, setSelectedCategoryId, setSelectedBox, setSelectedRepeatRule. Implements FR2 of task-detail-panel-spec.

#### Scenario: Setter functions are returned

- **WHEN** useTaskFormState is initialized
- **THEN** all setter functions are defined

### Requirement: Goal label resolution (useTaskEditLabels)

useTaskEditLabels SHALL resolve selectedGoalId to the matching goal's name from the goals array. When selectedGoalId is empty string, it SHALL return the fallback text. Implements FR4, FR7 of task-detail-panel-spec.

#### Scenario: Goal name resolved from ID

- **GIVEN** goals contain a goal with id "g1" and name "Learn piano"
- **WHEN** useTaskEditLabels is called with selectedGoalId "g1"
- **THEN** selectedGoalName is "Learn piano"

#### Scenario: No goal selected shows fallback

- **WHEN** useTaskEditLabels is called with selectedGoalId ""
- **THEN** selectedGoalName is the fallback text

### Requirement: Context label resolution (useTaskEditLabels)

useTaskEditLabels SHALL resolve selectedContextId to the matching context's name. When selectedContextId is empty, it SHALL return fallback text. Implements FR5, FR7 of task-detail-panel-spec.

#### Scenario: Context name resolved from ID

- **GIVEN** contexts contain a context with id "c1" and name "@Home"
- **WHEN** useTaskEditLabels is called with selectedContextId "c1"
- **THEN** selectedContextName is "@Home"

#### Scenario: No context selected shows fallback

- **WHEN** useTaskEditLabels is called with selectedContextId ""
- **THEN** selectedContextName is the fallback text

### Requirement: Category label resolution (useTaskEditLabels)

useTaskEditLabels SHALL resolve selectedCategoryId to the matching category's name. When selectedCategoryId is empty, it SHALL return fallback text. Implements FR6, FR7 of task-detail-panel-spec.

#### Scenario: Category name resolved from ID

- **GIVEN** categories contain a category with id "cat1" and name "Work"
- **WHEN** useTaskEditLabels is called with selectedCategoryId "cat1"
- **THEN** selectedCategoryName is "Work"

#### Scenario: No category selected shows fallback

- **WHEN** useTaskEditLabels is called with selectedCategoryId ""
- **THEN** selectedCategoryName is the fallback text

### Requirement: Checklist tab label with progress

useTaskEditLabels SHALL return checklistTabLabel with progress format when checklist total > 0. Implements FR8, FR9 of task-detail-panel-spec.

#### Scenario: Checklist label shows progress

- **GIVEN** checklist progress is 2 completed out of 5 total
- **WHEN** useTaskEditLabels is called
- **THEN** checklistTabLabel includes progress information

#### Scenario: Checklist label without progress

- **GIVEN** checklist progress is 0 total
- **WHEN** useTaskEditLabels is called
- **THEN** checklistTabLabel is the plain checklist label

### Requirement: Entity name resolution (resolveEntityName)

resolveEntityName SHALL return the entity name when the ID matches an entity in the array. It SHALL return the fallback string when the ID is empty or does not match any entity. Implements FR10, FR11, FR12 of task-detail-panel-spec.

#### Scenario: ID matches an entity

- **GIVEN** entities contain {id: "a1", name: "Alpha"}
- **WHEN** resolveEntityName is called with id "a1"
- **THEN** the result is "Alpha"

#### Scenario: Empty ID returns fallback

- **WHEN** resolveEntityName is called with id ""
- **THEN** the result is the fallback string

#### Scenario: Non-matching ID returns fallback

- **GIVEN** entities contain {id: "a1", name: "Alpha"}
- **WHEN** resolveEntityName is called with id "unknown"
- **THEN** the result is the fallback string

### Requirement: Completed tasks can be selected for detail view

useTaskSelection SHALL allow selecting completed tasks regardless of Focus Mode state. The detail panel SHALL open for completed tasks with the same capabilities as for active tasks. Implements FR1, FR2 of fix-completed-task-detail.

#### Scenario: Completed task selected in Focus Mode

- **WHEN** Focus Mode is enabled and user selects a completed task
- **THEN** the task is selected and detail panel opens with full editing capabilities

#### Scenario: Completed task selected without Focus Mode

- **WHEN** Focus Mode is disabled and user selects a completed task
- **THEN** the task is selected and detail panel opens with full editing capabilities

### Requirement: Attachments tab in task detail panel

The task detail panel SHALL have three tab buttons: Details, Checklist, Attachments. The Attachments tab SHALL show the attachment list for the current task with an attached file button. Tab switching SHALL follow the existing pill button pattern. Implements UX1 of add-file-attachments.

#### Scenario: Three tabs visible in task detail panel

- **WHEN** user opens the task detail panel
- **THEN** three tab buttons are visible: Details, Checklist, Attachments

#### Scenario: Switch to Attachments tab

- **WHEN** user clicks the Attachments tab button
- **THEN** the attachments list for the current task is displayed
- **AND** the Details and Checklist content is hidden

#### Scenario: Attachment count shown in tab label

- **GIVEN** task has 3 active attachments
- **WHEN** user views the task detail panel
- **THEN** the Attachments tab label shows the count (e.g., "Attachments (3)")

#### Scenario: Empty attachments tab

- **GIVEN** task has no attachments
- **WHEN** user switches to the Attachments tab
- **THEN** an empty state message is shown with an attached file button

### Requirement: TaskDetailPanel refactoring

TaskDetailPanel.tsx SHALL be split into smaller components before adding the Attachments tab: TaskDetailPanel (orchestrator), TaskDetailsTab, TaskChecklistTab, TaskAttachmentsTab. Each component SHALL be under 300 lines. Implements process invariant (file size limit).

#### Scenario: Panel orchestrator delegates to tab components

- **WHEN** user switches between tabs
- **THEN** the orchestrator renders the appropriate tab component
- **AND** each tab component is a separate file under 300 lines

### Requirement: DrillDownRow icon support

DrillDownRow SHALL accept an optional `icon` prop of type LucideIcon. When provided, the icon SHALL be rendered to the left of the label text with `w-4 h-4` size and `text-gray-500` color. The icon SHALL have `aria-hidden="true"` since it is decorative. Implements FR1 of icons-for-task-detail.

#### Scenario: DrillDownRow renders icon when provided

- **WHEN** DrillDownRow is rendered with an icon prop
- **THEN** the icon is displayed to the left of the label text
- **AND** the icon has `aria-hidden="true"` attribute

#### Scenario: DrillDownRow renders without icon when not provided

- **WHEN** DrillDownRow is rendered without an icon prop
- **THEN** only the label text is displayed (no icon space reserved)

### Requirement: Goal field icon

Goal DrillDownRow SHALL display the `Target` icon. Implements FR2 of icons-for-task-detail.

#### Scenario: Goal field shows Target icon

- **WHEN** task detail panel is open with goals available
- **THEN** the Goal DrillDownRow displays the Target icon

### Requirement: Context field icon

Context DrillDownRow SHALL display the `MapPin` icon. Implements FR3 of icons-for-task-detail.

#### Scenario: Context field shows MapPin icon

- **WHEN** task detail panel is open with contexts available
- **THEN** the Context DrillDownRow displays the MapPin icon

### Requirement: Category field icon

Category DrillDownRow SHALL display the `Tag` icon. Implements FR4 of icons-for-task-detail.

#### Scenario: Category field shows Tag icon

- **WHEN** task detail panel is open with categories available
- **THEN** the Category DrillDownRow displays the Tag icon

### Requirement: Repeat field icon

Repeat DrillDownRow SHALL display the `Repeat` icon. Implements FR5 of icons-for-task-detail.

#### Scenario: Repeat field shows Repeat icon

- **WHEN** task detail panel is open
- **THEN** the Repeat DrillDownRow displays the Repeat icon

### Requirement: Hide until field icon

Hide until DrillDownRow SHALL display the `EyeOff` icon. Implements FR6 of icons-for-task-detail.

#### Scenario: Hide until field shows EyeOff icon

- **WHEN** task detail panel is open and task has no repeat rule
- **THEN** the Hide until DrillDownRow displays the EyeOff icon

### Requirement: Description field icon

Description field label SHALL display the `FileText` icon to the left of the label text with `w-4 h-4` size. Implements FR7 of icons-for-task-detail.

#### Scenario: Description label shows FileText icon

- **WHEN** task detail panel Details tab is open
- **THEN** the Description label displays the FileText icon to the left of the text

### Requirement: Duplicate button icon

Duplicate task button SHALL display the `Copy` icon to the left of the button text. Implements FR8 of icons-for-task-detail.

#### Scenario: Duplicate button shows Copy icon

- **WHEN** task detail panel Details tab is open
- **THEN** the Duplicate button displays the Copy icon to the left of the text

### Requirement: Tab button icons

Details tab button SHALL display `AlignLeft` icon, Checklist tab button SHALL display `ListChecks` icon, Attachments tab button SHALL display `Paperclip` icon. All icons SHALL be to the left of the tab text with `w-4 h-4` size. Implements FR9, FR10, FR11 of icons-for-task-detail.

#### Scenario: Details tab shows AlignLeft icon

- **WHEN** task detail panel is open
- **THEN** the Details tab button displays the AlignLeft icon

#### Scenario: Checklist tab shows ListChecks icon

- **WHEN** task detail panel is open
- **THEN** the Checklist tab button displays the ListChecks icon

#### Scenario: Attachments tab shows Paperclip icon

- **WHEN** task detail panel is open
- **THEN** the Attachments tab button displays the Paperclip icon
