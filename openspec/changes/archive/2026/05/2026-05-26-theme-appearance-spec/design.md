## Context

The theme and appearance system is fully implemented across three providers and a utility:
- **ThemeProvider** — manages color scheme (light/dark/system) and accent color (7 presets + custom) with DOM manipulation, media query listeners, and CSS variable injection
- **InterfaceScaleProvider** — manages interface scale (small/normal/large/xLarge) with `data-scale` attribute on `<html>`
- **hexToRgb** utility — converts hex colors to RGB space-separated format for CSS variables

Existing specs cover persistence (`settings`, `local-preferences`) but not provider-level behavior: DOM effects, media query handling, or CSS variable injection. This change fills that gap with a dedicated `theme-appearance` capability spec and BDD tests.

Driven by FR1-FR12 from proposal.

## Goals / Non-Goals

**Goals:**
- Document provider-level behavior (DOM manipulation, media queries, CSS variables) that persistence specs do not cover
- Add BDD feature files testing domain logic without React rendering (pure function testing for color scheme application, accent color application, interface scale application, hexToRgb)

**Non-Goals:**
- No refactoring of existing providers
- No React component-level testing (providers are tested via existing unit tests)
- No E2E tests

## Decisions

### Decision 1: Test pure functions extracted from providers, not React components

BDD tests will exercise the domain logic functions (`applyColorScheme`, `applyAccentColor`, `applyInterfaceScale`, `getInitialColorScheme`, `getInitialAccentColor`, `getInitialInterfaceScale`, `hexToRgb`) directly against jsdom DOM. This avoids React rendering complexity while still verifying the core behavior.

Alternative considered: rendering ThemeProvider/InterfaceScaleProvider in BDD steps — rejected because vitest-cucumber is designed for domain logic, not React component lifecycle. Existing `.test.tsx` files already cover React integration.

### Decision 2: Single capability spec covering all three subsystems

Color scheme, accent color, and interface scale are tightly related (all modify `document.documentElement` attributes/classes) and are used together in the same settings page. A single `theme-appearance` spec keeps the documentation cohesive.

Alternative considered: three separate specs (`color-scheme`, `accent-color`, `interface-scale`) — rejected because they share the same DOM target and are conceptually one "appearance" system. Total content fits well under 400 lines.

## Risks / Trade-offs

- [Risk] BDD tests duplicate existing unit test coverage for hexToRgb and provider init functions -> Mitigation: BDD tests focus on behavior specification (Given-When-Then) as executable documentation; existing tests can coexist as complementary low-level coverage
- [Risk] Testing DOM manipulation in jsdom may not catch all browser-specific behaviors -> Mitigation: DOM attribute/class operations are well-supported in jsdom; browser-specific issues belong in E2E tests
