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
