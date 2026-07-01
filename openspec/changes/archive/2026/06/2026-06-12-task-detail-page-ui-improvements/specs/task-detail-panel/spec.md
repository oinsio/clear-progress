# Capability: Task Detail Panel (delta)

## MODIFIED Requirements

### Requirement: Checklist tab label (useTaskEditLabels)

useTaskEditLabels SHALL return `checklistTabLabel` containing the translated label with progress suffix when total > 0 (e.g. "Checklist (3/9)"). When used in an **active** tab, the full label SHALL be displayed. When used in an **inactive** tab, only the progress part (e.g. "3/9") SHALL be shown without the translated label prefix. Implements FR1, FR3 of task-detail-page-ui-improvements.

#### Scenario: Active checklist tab shows full label

- **WHEN** the Checklist tab is active
- **AND** the checklist has 3 completed out of 9 items
- **THEN** the tab displays "Checklist (3/9)" with the ListChecks icon

#### Scenario: Inactive checklist tab shows only progress

- **WHEN** the Checklist tab is inactive
- **AND** the checklist has 3 completed out of 9 items
- **THEN** the tab displays only the ListChecks icon and "3/9"
