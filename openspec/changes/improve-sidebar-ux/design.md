## Context

The sidebar currently uses a single `isPanelOpen` boolean in localStorage and a separate `isPanelAlwaysOpen` boolean. The expanded sidebar container itself acts as a close button (`onClick={onToggle}` on the entire `div`), with inner elements using `stopPropagation`. This causes accidental closes and lacks standard UX patterns (toggle button, backdrop, swipe). Defaults are static constants, not platform-aware.

Material Design 3 defines two drawer types: **modal** (temporary, closes on selection, has scrim) and **standard** (persistent, stays open on selection). Our current implementation doesn't distinguish between these.

Driven by FR1-FR10, G1-G3 from proposal.

## Goals / Non-Goals

**Goals:**
- Implement modal/standard drawer distinction using existing `isPanelOpen` localStorage value
- Add explicit toggle button, backdrop, swipe gestures
- Make defaults platform-aware without breaking existing user preferences
- Cleanly remove always-open feature with migration

**Non-Goals:**
- Slide animation (NG1 from proposal)
- Changing sidebar visual design (NG3)
- Server-side preference sync (preferences remain in localStorage only)

## Decisions

### Decision 1: Modal drawer via transient React state (FR4, FR5, FR6)

**Choice**: Introduce `isTemporarilyOpen` React state (not persisted) alongside persistent `isPanelOpen` in localStorage.

**Alternatives considered**:
- A) Track `wasCollapsedBeforeOpen` ref — simpler but `isPanelOpen` still toggles in localStorage on every click, causing wrong state if user closes browser while temporarily open.
- B) Always auto-collapse on mobile, never on desktop — too rigid, doesn't respect user intent.

**Rationale**: Option chosen cleanly separates user preference (localStorage) from transient UI state (React). Matches Material Design 3: modal drawer = temporary overlay, standard drawer = persistent panel. The `isPanelOpen` value in localStorage represents the user's deliberate choice.

**Implementation in `usePanelOpen`**:
```
isPanelOpen (localStorage)  +  isTemporarilyOpen (useState)
─────────────────────────      ──────────────────────────
false                          false  →  sidebar collapsed
false                          true   →  sidebar open (MODAL — closes on nav)
true                           -      →  sidebar open (STANDARD — stays open)
```

The hook returns: `{ isPanelOpen, isTemporarilyOpen, openTemporarily, closeTemporary, togglePanelOpen }`.

### Decision 2: Platform-aware defaults via hooks (FR7)

**Choice**: Move default resolution from static constants to hooks. Each preference hook (`usePanelSide`, `usePanelOpen`, `useFilterBarPosition`) calls `useIsDesktop()` to determine the default when no localStorage value exists.

**Alternatives considered**:
- A) Set defaults on app startup via an initialization effect — creates timing issues, may flash wrong layout.
- B) Use CSS media queries only — doesn't work for localStorage defaults.

**Rationale**: Hooks already call `usePreference` which accepts a `defaultValue`. Making this dynamic is minimal change. The default is used only when localStorage key is absent, so existing users are unaffected.

**Defaults matrix**:
| Preference | Desktop default | Mobile default |
|---|---|---|
| `panelSide` | `"left"` | `"right"` |
| `isPanelOpen` | `true` | `false` |
| `filterBarPosition` | `"top"` | `"bottom"` |

### Decision 3: Swipe via new dedicated hook (FR8, FR9)

**Choice**: Create `useSidebarSwipe` hook, separate from existing `useSwipeAction`.

**Rationale**: `useSwipeAction` is designed for list item swipe actions (right-swipe on TaskItem). Sidebar swipe has different mechanics:
- Edge detection (touch starts near screen edge)
- Bidirectional (open = toward center, close = toward edge)
- Translates the entire sidebar panel, not a list item
- Must not conflict with `useSwipeAction` on task items

The hook listens on `document` for edge-swipe-to-open, and on sidebar `ref` for swipe-to-close. Returns `sidebarTranslateX` for CSS transform. Only active when `!isDesktop`.

**Edge zone**: 24px from screen edge (constant `SIDEBAR_SWIPE_EDGE_ZONE_PX`). Snap-back threshold: 30% of sidebar width (constant `SIDEBAR_SWIPE_THRESHOLD_PERCENT`).

### Decision 4: Always-open removal and migration (FR10)

**Choice**: Remove `usePanelAlwaysOpen`, `PanelSettingsProvider` always-open logic, `PANEL_ALWAYS_OPEN` storage key, and settings UI toggle. Migrate on app startup.

**Migration logic** (one-time, in `usePanelOpen` initialization):
1. Check if `PANEL_ALWAYS_OPEN` key exists in localStorage
2. If value is `"true"`, set `PANEL_OPEN` to `"true"` in localStorage
3. Remove `PANEL_ALWAYS_OPEN` key
4. This runs once — key absence means migration is complete

No toast notification for removal (answering Q2 from proposal) — the behavior is preserved, just the explicit toggle is gone.

### Decision 5: Toggle button placement (FR1)

**Choice**: Add toggle button as first child in `SidebarSyncBlock` (expanded mode only), before the sync area. Button renders chevron: `ChevronLeft` when `side="right"`, `ChevronRight` when `side="left"` (pointing toward the edge = "close toward edge").

**Rationale**: Placing in the header row keeps it always visible without scrolling. Using Lucide `ChevronLeft`/`ChevronRight` icons is consistent with the existing icon system.

### Decision 6: Backdrop implementation (FR3)

**Choice**: Render backdrop as a sibling `div` inside `TaskPageLayout`, not inside `Sidebar` component. Backdrop is conditionally rendered when `!isDesktop && effectiveIsOpen`.

**Rationale**: Backdrop needs to cover the main content area (behind sidebar, in front of content). Placing it in `TaskPageLayout` gives correct z-index stacking without complex CSS.

### Decision 7: Pin icon button instead of toggle for detail panel pinned (FR11)

**Choice**: Replace the switch toggle in `WorkspaceSection.tsx` with a `Pin` icon button + text label. The pin uses the same visual states as `TaskDetailPanel`: `fill-current` when pinned, `rotate-45` when unpinned.

**Rationale**: Consistent iconography — user sees the same visual language in settings as on the panel itself. A pin is more semantically meaningful than a generic toggle for this specific feature.

### Decision 8: Accordion all-collapsed state and deep-linking (FR12, FR13)

**Choice**: Modify `SettingsAccordion` to use `string | null` for `expandedSectionId` (where `null` = all collapsed). Default initial state = `null`. Clicking expanded section sets `null`. Support an `initialExpandedSection` prop that overrides the default when provided.

**Alternative considered**: Using URL hash (`#account-sync`) for deep-linking. Rejected because it's visible in the URL bar and unnecessary for an internal navigation action.

**Deep-link mechanism**: `SidebarSyncBlock` navigates to `/settings` with React Router state `{ expandSection: SETTINGS_SECTION_IDS.ACCOUNT_SYNC }`. `SettingsPage` reads `location.state?.expandSection` and passes it as `initialExpandedSection` to `SettingsAccordion`. This is a one-time effect — subsequent accordion interactions use normal state.

## Risks / Trade-offs

- **[Risk] iOS back-swipe conflict (Q1)**: Left-edge swipe on iOS triggers browser back navigation. **Mitigation**: Use wider activation zone (~30-40px from edge) where iOS gesture no longer intercepts. Left-side sidebar is essential for left-handed users so disabling is not an option.
- **[Risk] Existing tests break**: Many tests mock `usePanelAlwaysOpen` and test always-open scenarios. **Mitigation**: Remove these tests as part of the change; they test removed functionality.
- **[Risk] `useIsDesktop` SSR mismatch**: `useIsDesktop` returns `false` during SSR/initial render if `window` is undefined. **Mitigation**: App is a client-side PWA, no SSR. `useState` initializer calls `window.matchMedia` synchronously, so first render is correct.
- **[Trade-off] No slide animation**: Sidebar appears/disappears instantly. This is simpler but less polished. Can be added in a follow-up change.
