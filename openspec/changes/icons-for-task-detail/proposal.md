# icons-for-task-detail

## Why

Entity detail panels (Task, Goal, Idea) have fields and tabs without visual icons, making the interface text-heavy and
harder to scan. Adding icons that are already used elsewhere in the app (TaskItem indicators, QuickActions, entity pages)
will create visual consistency and improve scannability across all entity types.

## What Changes

- **ADDED**: Icons for task DrillDownRow fields (Goal, Category, Context, Repeat, Hide until)
- **ADDED**: Icon for Description field labels in Task, Goal, and Idea detail panels
- **ADDED**: Icon for the Duplicate task button
- **ADDED**: Icons for tab switcher buttons in Task (Details, Checklist, Attachments) and Goal (Details, Attachments)
- **ADDED**: Icon for Status field label in Goal detail
- **MODIFIED**: DrillDownRow component to accept an optional icon prop

## Capabilities

### New Capabilities

_(none — this is a UI enhancement to existing capability)_

### Modified Capabilities

- `task-detail-panel`: DrillDownRow fields gain leading icons; tab buttons gain leading icons; description label and
  duplicate button gain icons
- `goal-edit-mode`: Tab buttons gain leading icons; description and status labels gain icons
- `idea-detail-panel`: Description label gains icon

## Goals

- G1: Improve visual scannability of entity detail panels (Task, Goal, Idea)
- G2: Reuse existing icon conventions from other parts of the app
- G3: Maintain visual consistency across all entity detail views

## Non-Goals

- NG1: Changing icon library or adding custom SVG icons
- NG2: Changing layout, spacing, or interaction behavior of fields/tabs
- NG3: Adding icons to Name fields (position and size already provide sufficient visual weight)
- NG4: Adding icons to Settings forms (different UI context)

## Users & Scenarios

- U1: User opens task detail panel and can quickly identify fields by their icons without reading labels
- U2: User edits a goal and sees consistent icon usage on tabs and field labels
- U3: User opens idea detail and sees description icon matching the same pattern as tasks and goals

## Requirements

### Functional

#### Task detail

- FR1: DrillDownRow SHALL accept an optional `icon` prop of type LucideIcon and render it to the left of the label
- FR2: Goal DrillDownRow SHALL display `Target` icon
- FR3: Context DrillDownRow SHALL display `MapPin` icon
- FR4: Category DrillDownRow SHALL display `Tag` icon
- FR5: Repeat DrillDownRow SHALL display `Repeat` icon
- FR6: Hide until DrillDownRow SHALL display `EyeOff` icon
- FR7: Task description field label SHALL display `FileText` icon to the left of the label text
- FR8: Duplicate button SHALL display `Copy` icon to the left of the button text
- FR9: Details tab button SHALL display `AlignLeft` icon to the left of the tab text
- FR10: Checklist tab button SHALL display `ListChecks` icon to the left of the tab text
- FR11: Attachments tab button SHALL display `Paperclip` icon to the left of the tab text

#### Goal detail

- FR12: Goal Details tab button SHALL display `AlignLeft` icon to the left of the tab text
- FR13: Goal Attachments tab button SHALL display `Paperclip` icon to the left of the tab text
- FR14: Goal description field label SHALL display `FileText` icon to the left of the label text
- FR15: Goal status field label SHALL display `Activity` icon to the left of the label text

#### Idea detail

- FR16: Idea description field label SHALL display `FileText` icon to the left of the label text

### Non-Functional

#### Accessibility

- NFR-A1: Icons SHALL have `aria-hidden="true"` since they are decorative (labels provide text)

#### Responsive

- NFR-R1: Icons SHALL not cause text truncation on small screens (320px viewport)

## UX Acceptance Criteria

- UX1: Icons SHALL be the same size as surrounding text (w-4 h-4 for DrillDownRow and tabs, matching existing patterns)
- UX2: Icon color SHALL follow the existing label color (text-gray-500 for labels, text-accent for active tab, inherit
  for buttons)
- UX3: Icons in DrillDownRow SHALL be left-aligned with 1-2 unit gap before the label text
- UX4: Icon style SHALL be consistent across Task, Goal, and Idea detail panels (same icon for same semantic field)

## Behavior

No new Gherkin scenarios — this is a purely visual/decorative change with no behavior impact.

## Visual Reference

Icon mapping (all from lucide-react):

| Element               | Icon         | Already used in                  |
|-----------------------|--------------|----------------------------------|
| Goal field            | `Target`     | TaskQuickActions, GoalsPage      |
| Context field         | `MapPin`     | TaskQuickActions, ContextsPage   |
| Category field        | `Tag`        | TaskQuickActions, CategoriesPage |
| Repeat field          | `Repeat`     | TaskItem, TaskQuickActions       |
| Hide until field      | `EyeOff`     | TaskItem, TaskQuickActions       |
| Description label     | `FileText`   | TaskItem, TaskQuickActions       |
| Status label (Goal)   | `Activity`   | new (standard lucide icon)       |
| Duplicate button      | `Copy`       | new (standard lucide icon)       |
| Details tab           | `AlignLeft`  | new (standard lucide icon)       |
| Checklist tab         | `ListChecks` | TaskItem                         |
| Attachments tab       | `Paperclip`  | AttachFileButton                 |

## Affected IA

No changes.

## Success Metrics

- M1: All 16 icon placements (FR1-FR16) rendered correctly in the UI
- M2: No visual regressions in existing entity detail panel layouts
- M3: Same semantic field uses the same icon across all entity types (e.g. FileText for all description labels)

## Open Questions

_(none)_
