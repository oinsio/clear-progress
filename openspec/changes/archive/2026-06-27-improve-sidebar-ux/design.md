# Design: Improve Sidebar UX

## Context

The sidebar needs three modes (Expanded, Collapsed, Expand on hover) with behavior adapting to two independent factors: screen width and hover capability. This replaces the previous toggle-button approach (FR1-FR18, G1-G4 from proposal).

Key insight from device detection research: determining device type is unreliable, but we don't need device type — we need **input capabilities**. CSS `@media (hover: hover)` reliably tells us if a precise pointer (mouse) is available, which is the only factor that matters for hover-expand behavior.

## Decision 1: Two-factor state resolution (FR8)

**Choice**: Resolve effective sidebar state from three inputs: screen width (wide/narrow via breakpoint), hover capability (`@media (hover: hover)`), and user setting (localStorage). A pure function maps these to one of four effective states.

**Alternatives considered**:
- A) Single breakpoint (mobile/desktop) — loses information when desktop user resizes to narrow. User with mouse can't access text labels.
- B) Device detection (UA, touch points) — unreliable per `device-detection-research.md`. iPad masquerades as Mac, laptops have touchscreens.

**Rationale**: Width and hover are orthogonal capabilities that can be detected reliably via standard browser APIs. The 12-cell matrix is deterministic and fully testable. No device guessing needed.

**Implementation** — `useSidebarState` hook:
```
inputs:  isNarrow (breakpoint), hasHover (media query), setting (localStorage)
output:  effectiveState: 'expanded' | 'collapsed' | 'hover-ready'
```

State resolution is a pure function — easily unit-tested with `it.each` for all 12 combinations.

## Decision 2: Sidebar mode as single enum preference (FR1)

**Choice**: Replace `isPanelOpen` (boolean) with `sidebarMode` enum: `'expanded' | 'collapsed' | 'expand-on-hover'`. Stored in localStorage under a new key.

**Alternatives considered**:
- A) Keep `isPanelOpen` boolean + add separate `hoverMode` boolean — two booleans create 4 combinations where only 3 are valid. Invalid state possible.
- B) Numeric mode (0/1/2) — less readable in localStorage debugging.

**Rationale**: Single enum prevents invalid states. Three values map directly to three UI options in the popover. Migration from `isPanelOpen`: `true` → `'expanded'`, `false` → `'collapsed'`.

**Migration logic** (in `useSidebarMode` initialization):
1. Check if `SIDEBAR_MODE` key exists in localStorage → use it
2. Else check if `PANEL_OPEN` key exists → migrate: `"true"` → `"expanded"`, `"false"` → `"collapsed"`, remove `PANEL_OPEN`
3. Else use platform default: `"expanded"`

## Decision 3: Hover capability via matchMedia (NFR-R3)

**Choice**: Create `useHoverCapability` hook that uses `window.matchMedia('(hover: hover)')` with a change listener.

**Rationale**: CSS media query `(hover: hover)` is the most reliable way to detect if a primary pointing device can hover. It's:
- Supported in all modern browsers (Safari 9+, Chrome 38+, Firefox 64+)
- Reactive — updates if input device changes (e.g., tablet connects/disconnects keyboard with trackpad)
- No user-agent parsing needed

The hook returns `hasHover: boolean` and updates reactively via `matchMedia.addEventListener('change', ...)`.

## Decision 4: Hover expand as overlay (FR5)

**Choice**: In hover-ready state, expanded sidebar renders as a fixed/absolute overlay with higher z-index, not pushing content. Same positioning as drawer but without backdrop.

**Alternatives considered**:
- A) Push content on hover — causes layout shift, content reflows, feels jarring for a temporary expansion.
- B) Use backdrop like drawer — too heavy for hover interaction, backdrop flash on every hover is distracting.

**Rationale**: Overlay without backdrop is lightweight and non-disruptive. Content stays stable. Sidebar appears on top, disappears when cursor leaves. Same mental model as a tooltip or dropdown menu.

## Decision 5: Debounce timing (FR5)

**Choice**: Open debounce ~250ms, close debounce ~150ms. Extracted as constants `SIDEBAR_HOVER_OPEN_DELAY_MS` and `SIDEBAR_HOVER_CLOSE_DELAY_MS`.

**Rationale**:
- **Open 250ms**: Prevents accidental expansion when cursor passes through sidebar area (e.g., moving to scrollbar). Long enough to filter drive-by, short enough to feel responsive on intentional hover.
- **Close 150ms**: Shorter than open — once expanded, we want to keep it stable. Gives user time to briefly overshoot the sidebar boundary and return without it collapsing. Standard pattern in hover menus (VS Code, macOS dock).

## Decision 6: Sidebar control popover placement (FR2)

**Choice**: Small icon button in the bottom area of the sidebar, above the search icon and above the divider line. Clicking opens a popover (not dropdown menu) with three labeled options and radio-style selection indicator.

**Visual reference**: Supabase dashboard sidebar control — compact icon, popover with clear labels and active state indicator.

**Rationale**: Bottom placement is discoverable but not intrusive. Popover (vs dropdown) allows richer content (labels + descriptions if needed later). Same component can be reused in settings page.

## Decision 7: Remove toggle buttons and isTemporarilyOpen (FR4)

**Choice**: Remove `‹`/`›` toggle buttons from `SidebarSyncBlock.tsx`. Remove `isTemporarilyOpen` state from `usePanelOpen`. The three-mode system replaces both:
- Toggle button function → sidebar control popover
- isTemporarilyOpen (modal drawer) → hover-ready/hover-expanded states on desktop; drawer state on mobile

**Rationale**: Toggle buttons are redundant with the three-mode popover. Modal drawer logic (`isTemporarilyOpen`) was a workaround for not having hover mode — with hover-expand available, there's no need for a separate "temporarily open" concept on desktop.

On mobile (narrow + no hover), drawer behavior remains but is triggered by swipe, not by clicking collapsed strip. Tapping collapsed icon = immediate navigation.

## Decision 8: Scoping backdrop and swipe to narrow + no hover (FR12, FR13)

**Choice**: Change the condition for backdrop and swipe from `!isDesktop` (breakpoint only) to `isNarrow && !hasHover`.

**Rationale**: On narrow screen WITH hover (desktop browser resized), the user has mouse — they don't need swipe gestures or backdrop. Hover-expand provides access to full navigation. Swipe and backdrop are mobile-specific patterns for touch input.

## Risks / Trade-offs

- **[Risk] `hover: hover` on Samsung Z Flip**: Some foldables report `hover: hover` inconsistently. **Mitigation**: This affects a tiny fraction of users. Fallback (collapsed + drawer) is always functional. User can switch mode via settings page if popover is hidden.
- **[Risk] Hover expand blocks content interaction**: Expanded overlay covers part of the content. **Mitigation**: Overlay only appears on intentional hover (250ms debounce). Moving cursor away dismisses it quickly (150ms). Users learn the pattern fast.
- **[Trade-off] No slide animation**: Sidebar appears/disappears instantly in all modes. Simpler but less polished. Can be added in follow-up.
- **[Trade-off] 12 matrix combinations to test**: More test cases than before. **Mitigation**: Pure function resolution — all 12 covered by `it.each` parameterized test in one test file. No complex mocking needed.
