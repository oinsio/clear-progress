# Task Detail Panel Specs

## Why

The task detail panel (TaskDetailPanel, useTaskFormState, useTaskEditLabels) is fully implemented but lacks a formal specification and BDD unit tests. These hooks contain business logic for:
- Form state management (name, description, goal, context, category, box, repeat rule)
- Label resolution (resolving entity IDs to display names, checklist progress label)
- Entity name resolution with fallback behavior

Without specs and BDD tests, there is no executable documentation of expected behavior, and refactoring carries higher risk.

## What Changes

- ADDED: Specification for task detail panel form state management
- ADDED: Specification for task edit label resolution
- ADDED: Specification for entity name resolution utility
- ADDED: BDD unit tests for useTaskFormState, useTaskEditLabels, and resolveEntityName

## Goals

- G1: Document task detail panel form state behavior in executable specifications
- G2: Cover useTaskFormState, useTaskEditLabels, and resolveEntityName with BDD unit tests

## Non-Goals

- NG1: Do not modify existing implementation code
- NG2: Do not add E2E tests for TaskDetailPanel component (separate change)
- NG3: Do not test TaskDetailPanel rendering or UI interactions
- NG4: Do not test useTaskMutations (already has unit tests)

## Users & Scenarios

- U1: Developer opens task detail panel — form fields are initialized from task entity
- U2: Developer switches selected task — form state resets to new task values
- U3: Label hook resolves goal/context/category IDs to display names
- U4: Label hook shows fallback text when no entity is selected
- U5: Checklist tab label shows progress when items exist

## Requirements

### Functional

- FR1: useTaskFormState SHALL initialize all fields from the provided task entity (name, description, goal_id, context_id, category_id, box, repeat_rule)
- FR2: useTaskFormState SHALL expose setter functions for each field
- FR3: useTaskFormState SHALL parse repeat_rule string into a RepeatRule object on initialization
- FR4: useTaskEditLabels SHALL resolve selected goal ID to goal name from the goals array
- FR5: useTaskEditLabels SHALL resolve selected context ID to context name from the contexts array
- FR6: useTaskEditLabels SHALL resolve selected category ID to category name from the categories array
- FR7: useTaskEditLabels SHALL return fallback text when no entity is selected (empty string ID)
- FR8: useTaskEditLabels SHALL return checklist tab label with progress when total items > 0
- FR9: useTaskEditLabels SHALL return plain checklist tab label when total items is 0
- FR10: resolveEntityName SHALL return entity name when ID matches an entity in the array
- FR11: resolveEntityName SHALL return fallback when ID is empty string
- FR12: resolveEntityName SHALL return fallback when ID does not match any entity

## UX Acceptance Criteria

- UX1: Form fields display current task values immediately on panel open
- UX2: Entity selector rows show "No goal" / "No context" / "No category" when unassigned
- UX3: Checklist tab shows "Checklist (2/5)" format when items exist

## Success Metrics

- M1: Spec covers FR1-FR12 with executable scenarios
- M2: BDD unit tests pass for all scenarios
- M3: Mutation score >= 95% on useTaskFormState, useTaskEditLabels, resolveEntityName

## Capabilities

### New Capabilities
- `task-detail-panel`: Task detail panel form state, label resolution, and entity name resolution

### Modified Capabilities

None.

## Behavior

Reference to feature files:
- `features/task_detail_panel/task_detail_panel_form_state.feature` (@task-detail-panel-spec tags)
- `features/task_detail_panel/task_detail_panel_labels.feature` (@task-detail-panel-spec tags)
- `features/task_detail_panel/task_detail_panel_entity_name.feature` (@task-detail-panel-spec tags)

## Affected IA

No changes.

## Impact

- New files: `openspec/specs/task-detail-panel/spec.md`, BDD features + steps
- Existing code is not modified
