# Fix Interface Scale

## Why

Interface scale setting changes element sizes via non-standard CSS `zoom` property, but font sizes remain unchanged. All Tailwind text classes use `rem` units relative to `html` element font-size (browser default 16px), which is never modified by the scale setting. The `zoom` property is non-standard, poorly supported on iOS Safari, and its text scaling effect is perceived as weak. Users expect all UI elements including text to scale uniformly.

## What Changes

- **MODIFIED**: Replace `zoom` with `font-size` percentage on `html[data-scale]` selectors in `globals.css`
- **REMOVED**: Redundant `font-size: calc(1rem * var(--scale-factor))` from `body` (would cause double scaling)
- **MODIFIED**: E2E test assertions to verify `font-size` instead of `zoom`

## Goals

- G1: All UI elements including text scale uniformly when interface scale is changed
- G2: Use only standard CSS properties for scaling (no `zoom`)

## Non-Goals

- NG1: Changing available scale values or adding new ones
- NG2: Changing the scale UI in settings

## Requirements

### Functional

- FR1: `html[data-scale="small"]` SHALL set `font-size: 87.5%` (equivalent to 14px base)
- FR2: `html[data-scale="normal"]` SHALL set `font-size: 100%` (equivalent to 16px base)
- FR3: `html[data-scale="large"]` SHALL set `font-size: 112.5%` (equivalent to 18px base)
- FR4: `html[data-scale="xLarge"]` SHALL set `font-size: 125%` (equivalent to 20px base)
- FR5: `body` SHALL NOT have an explicit `font-size` override — it inherits from `html`
- FR6: `--scale-factor` CSS variable SHALL be preserved for backward compatibility

## Capabilities

### New Capabilities

(none)

### Modified Capabilities

- `theme-appearance`: Interface scale CSS mechanism changes from `zoom` to `font-size` on `html`. Requirement "Interface scale switching" behavior unchanged (data-scale attribute, localStorage persistence), only CSS implementation changes.

## Impact

- `packages/client/src/styles/globals.css` — CSS scale rules
- `packages/client/src/test/e2e/interface-scale.spec.ts` — E2E test assertions
- BDD unit tests (`theme_interface_scale.feature`) — no changes needed (test data-scale attribute, not CSS)
- `InterfaceScaleProvider.tsx` — no changes needed (sets data-scale attribute only)

## Success Metrics

- M1: All four scale settings produce visually distinct font sizes in the browser
- M2: E2E tests pass with updated assertions
- M3: `pnpm run build` succeeds without errors
