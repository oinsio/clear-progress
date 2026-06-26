# Improve Sidebar UX

## Why

Current sidebar has UX issues: closing happens via toggle buttons (`‹`/`›`) that feel disconnected from the sidebar itself, there's no "expand on hover" mode for power users who want quick access without permanent sidebar, and behavior doesn't adapt intelligently to screen width and input capabilities. The sidebar should offer three clear modes (Expanded, Collapsed, Expand on hover) controlled via an intuitive popover — similar to Supabase dashboard — and adapt behavior based on two independent factors: screen width and hover capability.

## What Changes

- **ADDED**: Sidebar control popover with three modes (Expanded, Collapsed, Expand on hover) — icon in bottom of sidebar
- **ADDED**: "Expand on hover" mode — sidebar collapsed by default, expands as overlay on mouse hover with debounce
- **ADDED**: Hover capability detection via `@media (hover: hover)` as independent factor from screen width
- **ADDED**: Smart state resolution matrix: width x hover x setting → sidebar state
- **MODIFIED**: Sidebar behavior adapts to two factors (screen width + hover capability) instead of one breakpoint
- **MODIFIED**: Settings page "Workspace" section includes sidebar control setting
- **REMOVED**: Toggle buttons (`‹`/`›`) from sidebar header
- **REMOVED**: `isTemporarilyOpen` modal drawer logic on desktop (replaced by three-mode system)

Retained from previous iteration:
- Backdrop overlay on mobile when drawer is open
- Swipe gestures on mobile (edge swipe to open, swipe-back to close)
- Auto-collapse on navigation in drawer mode
- Platform-aware defaults
- "Always open" removal and migration (already implemented)
- Pin icon button in settings (already implemented)
- Settings accordion all-collapsed + deep-link (already implemented)

## Goals

- G1: Sidebar offers three intuitive modes that cover all use cases (always visible, minimal, quick-access on hover)
- G2: Sidebar adapts intelligently to screen width AND input capabilities — no information lost when resizing
- G3: Mobile sidebar interactions feel native (swipe, backdrop, auto-collapse)
- G4: Sidebar control is discoverable and consistent (same popover in sidebar + settings page)

## Non-Goals

- NG1: Slide animation for sidebar open/close (can be added later)
- NG2: Resizable sidebar width
- NG3: Changing sidebar visual design (colors, spacing, icons)
- NG4: Bottom sheet navigation on mobile

## Users & Scenarios

- U1: Desktop user with wide screen — uses Expanded mode, sees sidebar with icons and labels permanently
- U2: Desktop power user — uses "Expand on hover", sidebar stays collapsed until mouse hovers, then expands as overlay
- U3: Desktop user who resizes browser to narrow width — if hover available, gets hover-ready mode instead of losing text labels; if no hover, falls back to collapsed
- U4: Mobile user — sidebar always collapsed with icons, opens as drawer via swipe, auto-collapses after navigation
- U5: User who prefers minimal UI — uses Collapsed mode, navigates by icons only

## Requirements

### Functional

- FR1: Sidebar SHALL support three modes stored in localStorage: `expanded`, `collapsed`, `expand-on-hover`.
- FR2: A sidebar control icon SHALL render in the bottom area of the sidebar (above search, above the divider line). Clicking it SHALL open a popover with three options: Expanded, Collapsed, Expand on hover. The active mode SHALL be visually indicated.
- FR3: The same three-mode setting SHALL be available on the Settings page in the "Workspace" section.
- FR4: Toggle buttons (`‹`/`›`) SHALL be removed from the sidebar.
- FR5: In "Expand on hover" mode, hovering the mouse over the collapsed sidebar SHALL expand it as an overlay (over content, not pushing it) after a ~250ms debounce delay. Moving the mouse out SHALL collapse it after a ~150ms debounce delay.
- FR6: In "Expand on hover" mode, clicking a navigation item while hover-expanded SHALL navigate without closing the sidebar (sidebar stays expanded while cursor is inside).
- FR7: In "Collapsed" mode on desktop, clicking a navigation icon SHALL navigate immediately without expanding the sidebar.
- FR8: The effective sidebar state SHALL be resolved from three independent factors: screen width (wide/narrow), hover capability (yes/no), and user setting (expanded/collapsed/hover). Resolution follows the state matrix defined in this proposal.
- FR9: On narrow screen without hover (mobile), sidebar SHALL always be collapsed. Opening is only via swipe gesture → drawer with backdrop.
- FR10: On narrow screen without hover, tapping a navigation icon in collapsed sidebar SHALL navigate immediately (no drawer opening).
- FR11: On narrow screen without hover, drawer auto-collapses after navigation item click.
- FR12: Backdrop overlay SHALL render when drawer is open (narrow + no hover only). Tapping backdrop SHALL close the drawer.
- FR13: Swipe from screen edge SHALL open drawer. Swipe-back SHALL close drawer. Swipe gestures active only when hover is NOT available.
- FR14: When screen width crosses the breakpoint (resize), sidebar state SHALL be recalculated from the matrix. User setting in localStorage SHALL NOT change on resize.
- FR15: When resizing from wide to narrow while hover-expanded, the overlay SHALL close and sidebar SHALL transition to hover-ready (if hover available) or collapsed (if no hover).
- FR16: When resizing from narrow to wide, sidebar SHALL restore the state matching the saved setting.
- FR17: When drawer is open during resize from narrow to wide, drawer and backdrop SHALL close, and saved setting SHALL be applied.
- FR18: The sidebar control popover SHALL be hidden on narrow screens without hover capability (setting does not apply in mobile mode).

### Non-Functional

#### Accessibility — NFR-A

- NFR-A1: Sidebar control button SHALL have `aria-label` (localized), `role="button"`, keyboard accessible (Enter/Space).
- NFR-A2: Popover SHALL be keyboard navigable (arrow keys, Enter to select, Escape to close).
- NFR-A3: Backdrop SHALL have `aria-label` (localized "Close sidebar") for screen readers.

#### Responsive — NFR-R

- NFR-R1: Backdrop renders only on narrow screen without hover. On wide screen or with hover — no backdrop.
- NFR-R2: Swipe gestures activate only on narrow screen without hover.
- NFR-R3: Hover-expand activates only when `@media (hover: hover)` matches.

## UX Acceptance Criteria

- UX1: User can switch sidebar mode via a small icon at the bottom of the sidebar — popover appears with three clearly labeled options.
- UX2: In "Expand on hover" mode, sidebar feels responsive but not twitchy — no accidental expansions from passing the mouse through.
- UX3: User who resizes desktop browser to phone width retains access to navigation text via hover — no information is lost if mouse is available.
- UX4: On mobile, sidebar drawer opens with backdrop, closes on backdrop tap or swipe — standard mobile pattern.
- UX5: Tapping an icon in collapsed sidebar on mobile navigates immediately — no extra step needed.
- UX6: The sidebar control setting in sidebar popover and in settings page are always in sync.
- UX7: First-time desktop user sees sidebar expanded — ready to use without configuration.

## State Resolution Matrix

| Width  | Hover | Setting   | Effective State                                           |
|--------|-------|-----------|-----------------------------------------------------------|
| Wide   | Yes   | Expanded  | **Expanded** — icons + text, pushes content               |
| Wide   | Yes   | Collapsed | **Collapsed** — icons only, pushes content                |
| Wide   | Yes   | Hover     | **Hover-ready** — icons only, expands on hover as overlay |
| Wide   | No    | Expanded  | **Expanded** — icons + text, pushes content               |
| Wide   | No    | Collapsed | **Collapsed** — icons only, pushes content                |
| Wide   | No    | Hover     | **Collapsed** — hover unavailable, fallback               |
| Narrow | Yes   | Expanded  | **Hover-ready** — expanded won't fit, hover as compromise |
| Narrow | Yes   | Collapsed | **Collapsed** — icons only                                |
| Narrow | Yes   | Hover     | **Hover-ready** — direct match                            |
| Narrow | No    | Expanded  | **Collapsed** — neither expanded nor hover possible       |
| Narrow | No    | Collapsed | **Collapsed** — direct match                              |
| Narrow | No    | Hover     | **Collapsed** — hover unavailable, fallback               |

## Behavior

Scenarios defined in:
- `features/sidebar/sidebar_control.feature` — sidebar control popover, mode switching
- `features/sidebar/sidebar_hover.feature` — expand on hover behavior, debounce
- `features/sidebar/sidebar_state_matrix.feature` — state resolution from width x hover x setting
- `features/sidebar/sidebar_resize.feature` — transitions on breakpoint crossing
- `features/sidebar/sidebar_swipe.feature` — swipe gestures (retained)
- `features/sidebar/sidebar_backdrop.feature` — backdrop behavior (retained)

All scenarios tagged `@improve-sidebar-ux`.

## Affected IA

No IA changes — sidebar navigation structure remains the same.

## Success Metrics

- M1: All 12 matrix combinations resolve to correct state (automated test coverage)
- M2: Hover debounce prevents accidental expansion — no expansion on cursor pass-through under 250ms
- M3: All sidebar interactions (open, close, navigate, switch mode) achievable within 1 tap/gesture on mobile
- M4: Mutation test score >= 95% on new/modified hooks and components

## Open Questions

- ~~Q1~~: **Resolved.** iOS back-swipe conflict: use wider activation zone (~30-40px from edge).
- ~~Q2~~: **Resolved.** No migration toast — silent migration.
- ~~Q3~~: **Resolved.** Sidebar control icon: `PanelLeft` when sidebar is on left, `PanelRight` when on right. Matches sidebar position semantically.
- ~~Q4~~: **Resolved.** "Expand on hover" option always shown and selectable, even on devices without hover. Setting is declarative ("I want hover when possible"), state matrix handles fallback automatically. User on tablet can pre-select hover, connect keyboard with trackpad — works without reconfiguration.

## Capabilities

### New Capabilities

- `sidebar-control`: Popover with three modes (Expanded, Collapsed, Expand on hover) in sidebar bottom area
- `sidebar-hover-expand`: Expand on hover behavior with debounce, overlay mode
- `sidebar-state-matrix`: Smart state resolution from width x hover x setting

### Modified Capabilities

- `sidebar-navigation`: Remove toggle buttons, adapt to three-mode system
- `sidebar-backdrop`: Scoped to narrow + no hover (was: below breakpoint)
- `sidebar-swipe`: Scoped to narrow + no hover (was: below breakpoint)
- `local-preferences`: New `sidebarMode` preference (expanded/collapsed/expand-on-hover), remove `isPanelOpen`
- `settings-page-reordering`: Sidebar control setting in Workspace section

### Retained (already implemented)

- `sidebar-modal-drawer`: Auto-collapse on navigation in drawer mode
- `settings-page-sections`: Accordion all-collapsed, deep-link
- Pin icon button for detail panel setting

## Impact

- `Sidebar.tsx` — remove toggle button, add sidebar control icon + popover, hover expand logic
- `SidebarControlPopover.tsx` — NEW: popover component with three mode options
- `SidebarFilterNav.tsx` — adapt navigation click behavior per mode
- `TaskPageLayout.tsx` — state matrix resolution, backdrop scoping, hover integration
- `useSidebarMode.ts` — NEW: hook for three-mode preference (replaces `usePanelOpen` open/close logic)
- `useSidebarState.ts` — NEW: hook resolving effective state from width x hover x setting
- `useSidebarHover.ts` — NEW: hover expand/collapse with debounce
- `useHoverCapability.ts` — NEW: hook wrapping `@media (hover: hover)` match
- `useSidebarSwipe.ts` — update guards (narrow + no hover instead of !isDesktop)
- `usePanelOpen.ts` — remove `isTemporarilyOpen` logic (replaced by mode system)
- `WorkspaceSection.tsx` — add sidebar control setting
- `constants/index.ts` — sidebar mode values, debounce timing constants
- BDD features: new and updated sidebar features
- Tests: update all tests for new mode system
