# Goal Detail Card Refactor

## Why

The goal detail card in view mode has a cramped layout: cover image, name, description, status badge, and action buttons all compete for space in a single row. Long descriptions push content down without any way to collapse them, and the cover image cannot be previewed full-size. This refactor improves information hierarchy and adds two missing micro-interactions: image lightbox and collapsible description.

## What Changes

- **ADDED**: Lightbox overlay for goal cover — click the cover circle to view the full image, close with X / backdrop click / Escape. Only available when a real cover exists (default SVG is not clickable).
- **ADDED**: Collapsible description — descriptions longer than 2 lines are truncated with a toggle icon (expand/collapse).
- **MODIFIED**: View mode layout recomposition — three-row structure replaces the current single-row layout:
  - Row 1: cover circle + status badge + action buttons (focus, completed toggle, edit)
  - Row 2: goal name
  - Row 3+: collapsible description
- Edit mode remains unchanged.

## Goals

- G1: Improve visual hierarchy of the goal detail card by separating cover/status, name, and description into distinct rows
- G2: Allow users to preview goal cover images at full size without leaving the page

## Non-Goals

- NG1: Redesigning the edit mode of the goal card
- NG2: Adding image zoom/pan/gallery functionality
- NG3: Changing the task list area below the goal card

## Users & Scenarios

- U1: User with a goal that has a long description — sees a clean 2-line preview, can expand to read full text
- U2: User with a custom cover image — can tap the circle to see the image in a lightbox overlay
- U3: User with default SVG cover — tapping the circle does nothing (no lightbox for placeholder)

## Requirements

### Functional

- FR1: Cover circle in view mode SHALL open a lightbox overlay when clicked, ONLY if the goal has a real cover image (non-empty `cover_hash`)
- FR2: Lightbox SHALL display the cover image centered on a dimmed backdrop. User SHALL be able to close it by clicking the X button, clicking the backdrop, or pressing Escape
- FR3: Goal description in view mode SHALL be truncated to 2 lines (CSS `line-clamp-2`) when it exceeds 2 lines of text
- FR4: A toggle icon SHALL appear next to truncated descriptions. Clicking it SHALL expand the full description; clicking again SHALL collapse it back to 2 lines
- FR5: View mode layout SHALL be recomposed into three rows: (1) cover + status + actions, (2) name, (3) description with collapse

### Non-Functional

#### Accessibility — NFR-A1

- FR1 lightbox MUST trap focus while open and return focus to the cover circle on close
- FR2 lightbox close button MUST have `aria-label`
- FR4 toggle icon MUST have `aria-expanded` and `aria-label` reflecting current state

#### Responsive — NFR-R1

- Layout MUST work on viewports from 320px to 2560px without horizontal overflow

## UX Acceptance Criteria

- UX1: Cover circle shows a subtle visual cue (e.g., slight scale on hover) indicating clickability, only when a real cover exists
- UX2: Lightbox opens with a smooth fade-in, image is centered and scaled to fit viewport with padding
- UX3: Collapse toggle icon rotates (chevron down/up) to indicate expand/collapse state
- UX4: Description collapse/expand transition is smooth (not instant)

## UI States Matrix

| State | Cover | Description | UI |
|-------|-------|-------------|----|
| No cover, short description | Default SVG, not clickable | Full text, no toggle | Standard 3-row layout |
| Has cover, short description | Clickable circle with hover cue | Full text, no toggle | Standard 3-row layout |
| Has cover, long description | Clickable circle with hover cue | Truncated 2 lines + toggle icon | Toggle expands/collapses |
| No cover, long description | Default SVG, not clickable | Truncated 2 lines + toggle icon | Toggle expands/collapses |
| No cover, no description | Default SVG, not clickable | No description row | 2-row layout (cover+status, name) |
| Has cover, no description | Clickable circle with hover cue | No description row | 2-row layout (cover+status, name) |

## Behavior

Behavior scenarios will be defined in BDD specs during implementation (unit vitest-cucumber for collapse logic, E2E playwright-bdd for lightbox interaction).

## Visual Reference

No Figma — layout described in proposal. Design tokens from existing TailwindCSS theme.

## Affected IA

No changes to information architecture.

## Success Metrics

- M1: All 6 UI states from the matrix render correctly (verified by automated tests)
- M2: Lightbox opens/closes without layout shifts or scroll position changes
- M3: Mutation testing score >= 95% on new/changed code

## Open Questions

- Q1: Should the lightbox support swipe-to-dismiss on mobile? (Decision: defer to future enhancement)
