## 1. OpenSpec Stable Spec

- [x] 1.1 Create `openspec/specs/theme-appearance/spec.md` — theme appearance capability (color scheme switching, accent color selection, custom accent color CSS injection, interface scale, hexToRgb) — implements FR1-FR7

## 2. BDD Feature Files

- [x] 2.1 Create `features/theme_appearance/theme_color_scheme.feature` — scenarios for color scheme switching and initialization — @theme-appearance-spec @FR1 @FR2 @FR8
- [x] 2.2 Create `features/theme_appearance/theme_accent_color.feature` — scenarios for accent color selection, initialization, and meta theme-color — @theme-appearance-spec @FR3 @FR5 @FR9
- [x] 2.3 Create `features/theme_appearance/theme_custom_accent.feature` — scenarios for custom accent color DOM application — @theme-appearance-spec @FR4 @FR10
- [x] 2.4 Create `features/theme_appearance/theme_interface_scale.feature` — scenarios for interface scale switching and initialization — @theme-appearance-spec @FR6 @FR11
- [x] 2.5 Create `features/theme_appearance/theme_hex_to_rgb.feature` — scenarios for hexToRgb conversion and validation — @theme-appearance-spec @FR7 @FR12

## 3. BDD Step Definitions

- [x] 3.1 Create `steps/theme_color_scheme.steps.ts` — step definitions for color scheme scenarios using jsdom DOM manipulation
- [x] 3.2 Create `steps/theme_accent_color.steps.ts` — step definitions for accent color scenarios
- [x] 3.3 Create `steps/theme_custom_accent.steps.ts` — step definitions for custom accent color scenarios
- [x] 3.4 Create `steps/theme_interface_scale.steps.ts` — step definitions for interface scale scenarios
- [x] 3.5 Create `steps/theme_hex_to_rgb.steps.ts` — step definitions for hexToRgb scenarios

## 4. Verification

- [x] 4.1 Run all BDD tests and verify they pass: `pnpm test`
- [x] 4.2 Verify build: `pnpm run build`
