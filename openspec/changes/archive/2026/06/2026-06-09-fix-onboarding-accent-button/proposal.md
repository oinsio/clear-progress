# fix-onboarding-accent-button

## Why

The Accept button in the onboarding dialog (`OnboardingDialog`) uses a hardcoded `bg-blue-600`, while the rest of the project uses the custom `bg-accent` color from the Tailwind config. This makes the button look inconsistent with the rest of the UI, especially when the user selects a different accent color in settings.

## What Changes

- **MODIFIED**: Accept button style in `OnboardingDialog` — replace `bg-blue-600`/`hover:bg-blue-700` with `bg-accent`/`hover:bg-accent/80`

## Goals

- G1: The Accept button in the onboarding dialog uses the accent color from the design system

## Non-Goals

- NG1: Changing dialog logic or structure
- NG2: Changing the Decline button style

## Users & Scenarios

- U1: New user — sees the onboarding dialog with the button styled in the current app accent color

## Requirements

### Functional

- FR1: The Accept button in OnboardingDialog must use the accent color (`bg-accent`) instead of `bg-blue-600`

### Non-Functional

#### Accessibility

- NFR-A1: Text contrast on the button remains sufficient (white text on accent background)

## UX Acceptance Criteria

- UX1: The Accept button visually matches the accent color selected in app settings

## Behavior

Dialog behavior is unchanged — only the button's visual style is affected.

## Visual Reference

Reference — existing buttons using `bg-accent` in the project: `CommandBar`, `UpdateNotification`, `SettingsPage`.

## Affected IA

No changes.

## Success Metrics

- M1: The Accept button uses `bg-accent` — verified visually and in code

## Capabilities

### New Capabilities

None.

### Modified Capabilities

No spec-level changes — purely a style fix.

## Impact

- `packages/client/src/components/onboarding/OnboardingDialog.tsx` — the only file being changed

## Open Questions

None.
