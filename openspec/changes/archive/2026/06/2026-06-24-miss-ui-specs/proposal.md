# miss-ui-specs

## Why

Two UI components are implemented in code but lack OpenSpec specifications: ErrorFallback (error boundary) and GoalCoverPicker (goal cover selection in edit mode). This breaks traceability — behavior exists in code but is not described in specs.

## What Changes

- **ADDED** `error-fallback` capability — spec for ErrorFallback and RouteErrorFallback
- **MODIFIED** `goal-detail-card` — added requirement for GoalCoverPicker UI (edit mode picker)

## Goals

- G1: Every UI component has an OpenSpec specification with traceable requirements
- G2: BDD unit tests cover behavior of both components

## Non-Goals

- NG1: Changing component implementation — specs and tests only
- NG2: E2E tests — scope limited to unit BDD
- NG3: Covering cover-sync-protocol — already specified

## Users & Scenarios

- U1: User encounters an application error — ErrorFallback shows a message and reload button
- U2: User edits a goal — GoalCoverPicker allows selecting/removing a cover image

## Requirements

### Functional

- FR1: ErrorFallback displays localized heading, description, and reload button
- FR2: ErrorFallback reloads the page when the button is clicked
- FR3: RouteErrorFallback logs the route error and renders ErrorFallback
- FR4: GoalCoverPicker shows cover preview or default SVG
- FR5: GoalCoverPicker opens file picker on button click
- FR6: GoalCoverPicker calls onFileSelect with the selected file
- FR7: GoalCoverPicker shows remove button only when a cover is present
- FR8: GoalCoverPicker resets input after file selection (to allow re-selecting the same file)

### Non-Functional

#### Accessibility

- NFR-A1: ErrorFallback — reload button is keyboard-accessible
- NFR-A2: GoalCoverPicker — buttons have aria-label, decorative elements have aria-hidden

## UX Acceptance Criteria

- UX1: ErrorFallback is centered vertically and horizontally on full screen
- UX2: GoalCoverPicker — circular button 48x48 with overflow hidden for image cropping
- UX3: GoalCoverPicker — remove button positioned at the top-right corner of the circle

## Success Metrics

- M1: Both components have OpenSpec specifications with traceable FR/NFR/UX
- M2: BDD unit feature files and step definitions cover all scenarios
- M3: All unit tests pass

## Capabilities

### New Capabilities

- `error-fallback`: Error boundary UI — error display and page reload

### Modified Capabilities

- `goal-detail-card`: Added requirement for GoalCoverPicker — cover selection/removal UI in edit mode

## Impact

- `packages/client/src/components/ErrorFallback.tsx` — covered by spec
- `packages/client/src/components/RouteErrorFallback.tsx` — covered by spec
- `packages/client/src/components/goals/GoalCoverPicker.tsx` — covered by spec
- New BDD feature files and step definitions

## Open Questions

No open questions.
