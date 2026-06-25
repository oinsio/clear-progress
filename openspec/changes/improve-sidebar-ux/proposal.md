# Improve Sidebar UX

## Why

Current sidebar has several UX issues: closing happens via click on empty area (unexpected, no visual affordance), no backdrop on mobile (no standard drawer-close pattern), defaults are not optimized per platform, and there's no swipe gesture support. These problems make the sidebar feel unfamiliar and error-prone, especially on mobile. The "always-open" setting is redundant once proper modal/standard drawer distinction is implemented. Additionally, the settings page has UX inconsistencies: the "pin detail panel" toggle uses a generic switch instead of the pin icon used on the panel itself, settings accordion always has one section expanded (can't collapse all), and the "Configure server" button doesn't deep-link to the relevant settings section.

## What Changes

- **ADDED**: Toggle button (`‹`/`›`) in expanded sidebar header for explicit close action
- **ADDED**: Backdrop overlay on mobile when sidebar is expanded
- **ADDED**: Modal drawer behavior — temporary open auto-collapses on navigation
- **ADDED**: Swipe gestures on mobile — edge swipe to open, swipe-back to close
- **MODIFIED**: Expanded sidebar container no longer acts as a close button (remove onClick, cursor-pointer, role, tabIndex)
- **MODIFIED**: Platform-aware defaults — desktop: sidebar left + expanded + command bar top; mobile: sidebar right + collapsed + command bar bottom
- **REMOVED**: "Always open" setting (`usePanelAlwaysOpen`, `isPanelAlwaysOpen`, `PANEL_ALWAYS_OPEN` localStorage key)
- **MODIFIED**: Settings "pin detail panel" toggle replaced with Pin icon button (matching TaskDetailPanel pin style)
- **MODIFIED**: Settings accordion allows all sections collapsed; all collapsed by default on page open
- **MODIFIED**: "Configure server" sidebar button deep-links to settings with "Account & Sync" section expanded

## Goals

- G1: Sidebar close/open interactions follow established UX patterns (Material Design 3 navigation drawer)
- G2: First-time experience is optimized per platform without requiring manual configuration
- G3: Mobile sidebar interactions feel native (swipe, backdrop, auto-collapse)

## Non-Goals

- NG1: Slide animation for sidebar open/close (can be added later)
- NG2: Resizable sidebar width
- NG3: Changing sidebar visual design (colors, spacing, icons)
- NG4: Bottom sheet navigation on mobile (alternative to sidebar)

## Users & Scenarios

- U1: Desktop user — sees sidebar expanded on left with labeled menu items on first launch, uses toggle button to collapse/expand
- U2: Mobile user — sees collapsed sidebar on right, swipes from edge to open, taps backdrop or swipes back to close, sidebar auto-collapses after selecting a menu item
- U3: Existing user with saved preferences — all saved settings preserved, only "always open" removed (replaced by `isPanelOpen=true`)

## Requirements

### Functional

- FR1: Expanded sidebar SHALL render a toggle button (`‹` when sidebar is on right, `›` when on left) in the header area. Clicking it SHALL collapse the sidebar and persist `isPanelOpen=false` to localStorage.
- FR2: Expanded sidebar container SHALL NOT have `onClick`, `cursor-pointer`, `role="button"`, `tabIndex`, or `onKeyDown` for toggling. Only the toggle button and collapsed strip handle open/close.
- FR3: On mobile (below `LG_BREAKPOINT_PX`), when sidebar is expanded, a backdrop overlay SHALL render behind the sidebar. Tapping the backdrop SHALL close the sidebar.
- FR4: When `isPanelOpen` is `false` in localStorage and user opens sidebar via collapsed strip click, the sidebar SHALL open in modal (temporary) mode. Modal mode is tracked via React state (`isTemporarilyOpen`), not persisted to localStorage.
- FR5: In modal mode, clicking a navigation item SHALL navigate to the selected route AND close the sidebar (set `isTemporarilyOpen=false`).
- FR6: When `isPanelOpen` is `true` in localStorage (standard drawer mode), clicking a navigation item SHALL navigate but NOT close the sidebar.
- FR7: On desktop, first launch defaults SHALL be: `panelSide=left`, `isPanelOpen=true`, `filterBarPosition=top`. On mobile: `panelSide=right`, `isPanelOpen=false`, `filterBarPosition=bottom`. Defaults apply only when no value exists in localStorage.
- FR8: On mobile, swiping from the sidebar edge (~20-30px zone) toward center SHALL open the sidebar. Swipe direction depends on `panelSide`.
- FR9: On mobile, swiping an open sidebar toward its edge SHALL close it. The sidebar SHALL follow the finger during swipe. If released before 30% threshold, sidebar snaps back open.
- FR10: The `usePanelAlwaysOpen` hook, `isPanelAlwaysOpen` state, `PANEL_ALWAYS_OPEN` storage key, and all references SHALL be removed. Existing users with `isPanelAlwaysOpen=true` SHALL be migrated: set `isPanelOpen=true` if not already set.
- FR11: In settings, the "pin detail panel" control SHALL use a Pin icon button (same as in TaskDetailPanel: `Pin` icon, `fill-current` when pinned, `rotate-45` when unpinned) instead of a switch toggle. The button SHALL be accompanied by a text label.
- FR12: Settings accordion SHALL allow all sections to be collapsed. Clicking the currently expanded section SHALL collapse it (resulting in no sections expanded). On settings page open, all sections SHALL be collapsed by default.
- FR13: Clicking "Configure server" button in sidebar SHALL navigate to settings page with the "Account & Sync" section automatically expanded.

### Non-Functional

#### Accessibility — NFR-A1

- NFR-A1: Toggle button SHALL have `aria-label` (localized "Close sidebar" / "Open sidebar"), `role="button"`, and be keyboard accessible (Enter/Space).
- NFR-A2: Backdrop SHALL have `aria-label` (localized "Close sidebar") for screen readers.

#### Responsive — NFR-R1

- NFR-R1: Backdrop renders only on mobile (below `LG_BREAKPOINT_PX`). On desktop, no backdrop.
- NFR-R2: Swipe gestures activate only on mobile. On desktop, no swipe handling.
- NFR-R3: Platform-aware defaults use `useIsDesktop()` hook to determine platform at first render.

## UX Acceptance Criteria

- UX1: User can close expanded sidebar ONLY via toggle button (desktop) or toggle button / backdrop tap / swipe-back (mobile). Clicking empty space inside sidebar does nothing.
- UX2: On mobile, expanded sidebar shows darkened backdrop behind it. Tapping backdrop closes sidebar.
- UX3: When user opens collapsed sidebar and picks a menu item, sidebar auto-collapses and app navigates. No extra tap needed to dismiss.
- UX4: Swipe from screen edge on mobile opens sidebar with finger-following animation. Swipe-back closes with finger-following.
- UX5: First-time desktop user sees sidebar expanded on left with all labels visible and command bar at top — ready to use without configuration.
- UX6: First-time mobile user sees compact collapsed sidebar on right and command bar at bottom — optimized for thumb reach.
- UX7: Pin detail panel control in settings visually matches the pin button on the task detail panel itself — consistent iconography.
- UX8: Settings page opens with all sections collapsed — user sees all section headers at a glance and opens only the one they need.
- UX9: Clicking "Configure server" in sidebar takes user directly to the relevant settings section, already expanded — no hunting.

## Behavior

Scenarios defined in:
- `features/sidebar/sidebar_toggle.feature` — updated for toggle button, remove always-open scenarios
- `features/sidebar/sidebar_modal.feature` — new: modal vs standard drawer behavior
- `features/sidebar/sidebar_swipe.feature` — new: swipe gestures on mobile
- `features/sidebar/sidebar_backdrop.feature` — new: backdrop behavior
- `features/sidebar/sidebar_defaults.feature` — new: platform-aware defaults

All scenarios tagged `@improve-sidebar-ux`.

## Affected IA

No IA changes — sidebar navigation structure remains the same.

## Success Metrics

- M1: Zero accidental sidebar closes from clicking empty space (eliminated by design)
- M2: All sidebar interactions (open, close, navigate) achievable within 1 tap/gesture on mobile
- M3: Mutation test score >= 95% on new/modified hooks and components

## Open Questions

- ~~Q1~~: **Resolved.** iOS back-swipe conflict when sidebar is on the left: use a wider activation zone (~30-40px from edge) so our swipe starts where iOS gesture no longer intercepts. Left-side sidebar is essential for left-handed users, so disabling edge swipe is not an option.
- ~~Q2~~: **Resolved.** No migration toast needed — app is not yet in production. Silent migration of `isPanelAlwaysOpen` to `isPanelOpen` is sufficient.

## Capabilities

### New Capabilities

- `sidebar-modal-drawer`: Modal (temporary) vs standard (persistent) drawer behavior with auto-collapse on navigation
- `sidebar-swipe`: Swipe gestures for opening/closing sidebar on mobile
- `sidebar-backdrop`: Backdrop overlay behind expanded sidebar on mobile

### Modified Capabilities

- `sidebar-navigation`: Toggle button in header, remove onClick from container, remove always-open mode, accessible markup updates
- `local-preferences`: Platform-aware defaults for panel side, panel open, and filter bar position; remove panel-always-open preference; migration from always-open to panel-open
- `settings-page-sections`: Accordion allows all-collapsed state, default to all-collapsed, deep-link to specific section
- `settings-page-reordering`: Pin icon button replaces toggle for detail panel pinned setting

## Impact

- `Sidebar.tsx` — toggle button, remove container onClick, backdrop rendering
- `SidebarFilterNav.tsx` — auto-collapse callback on navigation click
- `SidebarSyncBlock.tsx` — remove stopPropagation (no longer needed)
- `TaskPageLayout.tsx` — modal drawer logic, backdrop, swipe integration
- `usePanelOpen.ts` — temporary open state logic
- `usePanelSide.ts` — platform-aware default
- `useFilterBarPosition.ts` — platform-aware default
- `usePanelAlwaysOpen.ts` — DELETE
- `PanelSettingsProvider.tsx` — remove always-open context
- `constants/index.ts` — remove PANEL_ALWAYS_OPEN, update defaults
- `WorkspaceSection.tsx` — remove always-open toggle, replace pin toggle with Pin icon button
- `SettingsAccordion.tsx` — allow all-collapsed state, default to collapsed, support external section override
- `SettingsPage.tsx` — accept section query param/state for deep-linking
- `SidebarSyncBlock.tsx` — navigate to settings with section param when "Configure server" clicked
- New hook: `useSidebarSwipe.ts` — swipe gesture handling
- BDD features: update existing sidebar features, add new ones
- Tests: update all tests referencing always-open behavior, accordion behavior, pin toggle
