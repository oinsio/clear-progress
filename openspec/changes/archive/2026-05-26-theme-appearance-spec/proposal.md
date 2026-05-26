# Theme Appearance Spec

## Why

The theme and appearance system (color scheme switching, accent colors, interface scaling) is fully implemented but lacks formal OpenSpec specifications and dedicated BDD tests. Other subsystems (settings, local-preferences) partially cover some aspects but do not document the provider-level behavior: DOM manipulation, media query handling, CSS variable injection, or the interplay between color scheme and accent colors in dark/light modes.

## What Changes

- **ADDED**: OpenSpec capability spec for theme appearance (ThemeProvider, InterfaceScaleProvider, color helpers)
- **ADDED**: BDD feature files covering color scheme switching, accent color selection, custom accent color DOM application, interface scale switching, and hex-to-RGB conversion
- No code changes — this is a documentation and test coverage initiative

## Goals

- G1: Every theme/appearance behavior has a formal specification in OpenSpec
- G2: BDD feature files cover all theme provider domain rules (color scheme, accent color, custom colors, interface scale)
- G3: BDD feature files cover the colorHelpers utility (hexToRgb validation and conversion)

## Non-Goals

- NG1: No changes to implementation code
- NG2: No E2E/Playwright tests (theme switching E2E is out of scope for this change)
- NG3: No changes to settings or local-preferences specs (they cover persistence, not provider behavior)
- NG4: No UI component tests for SettingsPage theme controls

## Users & Scenarios

- U1: Developer maintaining theme code — uses specs as reference for expected behavior
- U2: AI agent implementing theme-related features — uses specs to understand constraints and patterns

## Requirements

### Functional

- FR1: Spec documents color scheme switching behavior (light, dark, system modes) including DOM class manipulation
- FR2: Spec documents system theme preference detection via media query and automatic switching
- FR3: Spec documents accent color selection from 7 preset colors plus custom
- FR4: Spec documents custom accent color behavior: hex-to-RGB conversion, CSS variable injection, meta theme-color updates
- FR5: Spec documents accent color DOM application: `data-accent` attribute, light/dark color value maps
- FR6: Spec documents interface scale switching behavior (small, normal, large, xLarge) with `data-scale` attribute
- FR7: Spec documents hexToRgb utility: valid hex parsing, invalid hex rejection, hash prefix handling
- FR8: BDD scenarios cover color scheme initialization and switching
- FR9: BDD scenarios cover accent color selection and DOM effects
- FR10: BDD scenarios cover custom accent color persistence and application
- FR11: BDD scenarios cover interface scale initialization and switching
- FR12: BDD scenarios cover hexToRgb conversion and validation

### Non-Functional

#### Performance

- NFR-P1: BDD unit tests execute in <5s total

## UX Acceptance Criteria

- UX1: N/A (no UI changes)

## Behavior

- `features/theme_appearance/theme_color_scheme.feature` — @theme-appearance-spec @FR1 @FR2 @FR8
- `features/theme_appearance/theme_accent_color.feature` — @theme-appearance-spec @FR3 @FR5 @FR9
- `features/theme_appearance/theme_custom_accent.feature` — @theme-appearance-spec @FR4 @FR10
- `features/theme_appearance/theme_interface_scale.feature` — @theme-appearance-spec @FR6 @FR11
- `features/theme_appearance/theme_hex_to_rgb.feature` — @theme-appearance-spec @FR7 @FR12

## Affected IA

No changes.

## Success Metrics

- M1: 100% of theme/appearance behaviors have corresponding spec scenarios
- M2: 100% of BDD scenarios have passing step definitions
- M3: All BDD tests pass in <5s

## Open Questions

- Q1: Should meta theme-color update behavior be part of this spec or a separate PWA-related spec?

## Capabilities

### New Capabilities

- `theme-appearance`: Theme and appearance system — color scheme switching (light/dark/system), accent color selection (7 presets + custom), custom accent color CSS variable injection, interface scale switching, hexToRgb utility

### Modified Capabilities

(none)

## Impact

- New files: `openspec/specs/theme-appearance/spec.md`
- New feature files: 5 files under `packages/client/src/test/features/theme_appearance/`
- New step definitions: corresponding `.steps.ts` files in `steps/` subdirectory
- No changes to existing implementation code
