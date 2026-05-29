# fix-newline-display

## Why

In view mode, task/goal/idea descriptions collapse newline characters (`\n`) into spaces. The cause is default HTML behavior: `<span>` and `<p>` elements ignore newline characters in text content (`white-space: normal`). Meanwhile, in edit mode (`<textarea>`) newlines render correctly, creating a mismatch between what the user types and what they see after saving.

## What Changes

- MODIFIED: `LinkedText` component — add `whitespace-pre-line` CSS class to preserve newlines
- MODIFIED: `IdeaItem` component — add `whitespace-pre-line` CSS class to the `<p>` element displaying idea description in list view

## Goals

- G1: Newline characters in task, goal, and idea descriptions are correctly displayed in view mode

## Non-Goals

- NG1: Changing edit mode behavior (already works correctly)
- NG2: Supporting Markdown formatting in descriptions
- NG3: Modifying `EditableDescription` component — it delegates rendering to `LinkedText`

## Users & Scenarios

- U1: User enters a multi-line description for a task/goal/idea and expects to see line breaks preserved after saving

## Requirements

### Functional

- FR1: Newline characters (`\n`) in task descriptions are preserved in view mode (`TaskDetailPanel` → `EditableDescription` → `LinkedText`)
- FR2: Newline characters in goal descriptions are preserved in the goal card (`GoalDetailPage`) and in the edit panel (`GoalPage` → `EditableDescription` → `LinkedText`)
- FR3: Newline characters in idea descriptions are preserved in the detail panel (`IdeaDetailPanel` → `EditableDescription` → `LinkedText`) and in the ideas list (`IdeaItem`)

### Non-Functional

#### Accessibility

- NFR-A1: Change does not affect accessibility — uses a standard CSS property

## UX Acceptance Criteria

- UX1: Text with line breaks in view mode visually matches what the user entered in textarea
- UX2: Multiple spaces within a line are still collapsed (`pre-line` behavior, not `pre`)

## Behavior

Behavior is trivial and covered by existing `LinkedText` and `IdeaItem` unit tests with the addition of CSS class verification.

## Affected IA

No changes.

## Success Metrics

- M1: All descriptions with newline characters correctly display line breaks in view mode
- M2: Existing tests pass without modifications

## Capabilities

### New Capabilities

No new capabilities.

### Modified Capabilities

- `linkify`: `LinkedText` component receives a CSS class to preserve newline characters
- `ideas`: `IdeaItem` component receives a CSS class to preserve newline characters in list view

## Impact

- `packages/client/src/components/ui/LinkedText.tsx` — add `whitespace-pre-line`
- `packages/client/src/components/ideas/IdeaItem.tsx` — add `whitespace-pre-line`
- Indirectly affects all components using `LinkedText`: `EditableDescription`, `GoalDetailPage`

## Open Questions

None.
