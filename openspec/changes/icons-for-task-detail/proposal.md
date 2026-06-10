# icons-for-task-detail

## Why

Task detail panel fields and tabs currently have no visual icons, making the interface text-heavy and harder to scan.
Adding icons that are already used elsewhere in the app (TaskItem indicators, QuickActions, entity pages) will create
visual consistency and improve scannability.

## What Changes

- **ADDED**: Icons for DrillDownRow fields (Goal, Category, Context, Repeat, Hide until)
- **ADDED**: Icon for the Description/Notes field label
- **ADDED**: Icon for the Duplicate task button
- **ADDED**: Icons for tab switcher buttons (Details, Checklist, Attachments)
- **MODIFIED**: DrillDownRow component to accept an optional icon prop

## Capabilities

### New Capabilities

_(none — this is a UI enhancement to existing capability)_

### Modified Capabilities

- `task-detail-panel`: DrillDownRow fields gain leading icons; tab buttons gain leading icons; description label and
  duplicate button gain icons

## Goals

- G1: Improve visual scannability of task detail panel
- G2: Reuse existing icon conventions from other parts of the app

## Non-Goals

- NG1: Changing icon library or adding custom SVG icons
- NG2: Changing layout, spacing, or interaction behavior of fields/tabs
- NG3: Adding icons to other panels (IdeaDetailPanel, GoalDetail, etc.)

## Users & Scenarios

- U1: User opens task detail panel and can quickly identify fields by their icons without reading labels

## Requirements

### Functional

- FR1: DrillDownRow SHALL accept an optional `icon` prop of type LucideIcon and render it to the left of the label
- FR2: Goal DrillDownRow SHALL display `Target` icon
- FR3: Context DrillDownRow SHALL display `MapPin` icon
- FR4: Category DrillDownRow SHALL display `Tag` icon
- FR5: Repeat DrillDownRow SHALL display `Repeat` icon
- FR6: Hide until DrillDownRow SHALL display `EyeOff` icon
- FR7: Description field label SHALL display `FileText` icon to the left of the label text
- FR8: Duplicate button SHALL display `Copy` icon to the left of the button text
- FR9: Details tab button SHALL display `AlignLeft` icon to the left of the tab text
- FR10: Checklist tab button SHALL display `ListChecks` icon to the left of the tab text
- FR11: Attachments tab button SHALL display `Paperclip` icon to the left of the tab text

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

## Behavior

No new Gherkin scenarios — this is a purely visual/decorative change with no behavior impact.

## Visual Reference

Icon mapping (all from lucide-react):

| Element          | Icon         | Already used in                  |
|------------------|--------------|----------------------------------|
| Goal field       | `Target`     | TaskQuickActions, GoalsPage      |
| Context field    | `MapPin`     | TaskQuickActions, ContextsPage   |
| Category field   | `Tag`        | TaskQuickActions, CategoriesPage |
| Repeat field     | `Repeat`     | TaskItem, TaskQuickActions       |
| Hide until field | `EyeOff`     | TaskItem, TaskQuickActions       |
| Notes label      | `FileText`   | TaskItem, TaskQuickActions       |
| Duplicate button | `Copy`       | new (standard lucide icon)       |
| Details tab      | `AlignLeft`  | new (standard lucide icon)       |
| Checklist tab    | `ListChecks` | TaskItem                         |
| Attachments tab  | `Paperclip`  | AttachFileButton                 |

## Affected IA

No changes.

## Success Metrics

- M1: All 11 icon placements (FR1-FR11) rendered correctly in the UI
- M2: No visual regressions in existing task detail panel layout

## Open Questions

_(none)_
