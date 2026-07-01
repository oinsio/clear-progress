## Context

TaskDetailPanel currently renders conditionally: only when `selectedTask !== null`. This means the right column appears/disappears dynamically, causing layout shifts on desktop. The project already has an established pattern for local preferences via `LocalPreferencesService` + `usePreference` hook (FR1-FR7 of localstorage-refactor). Sidebar has a similar "always open" feature via `PanelSettingsProvider`.

## Goals / Non-Goals

**Goals:**
- Add a pinned mode for the detail panel column on desktop (FR3, FR4, FR5)
- Follow existing local preferences pattern without introducing new abstractions (G2)
- Provide two UI entry points: in-panel pin button + Settings toggle (FR6, FR7)

**Non-Goals:**
- No Provider/Context needed — simple hook is sufficient (unlike `isPanelAlwaysOpen` which needs Provider because Sidebar is rendered outside layout hierarchy). `useDetailPanelPinned` consumers (`TaskPageLayout`, `TaskDetailPanel`, `SettingsPage`) all call the hook directly.
- No changes to `EntityDetailLayout` in this change (NG3)

## Decisions

### Decision 1: Hook without Provider

**Choice**: Direct `usePreference` hook (`useDetailPanelPinned`) without React Context Provider.

**Why**: `usePanelSide`, `usePanelOpen`, `usePanelSplit` all work without providers. Provider was needed for `isPanelAlwaysOpen` because `Sidebar` lives outside the layout tree and needs shared state. For detail panel pinning, all consumers are within the same render tree — each reads localStorage independently, which is fine because the value only changes via explicit user action (click pin button or settings toggle), which triggers a re-render in the component that changed it.

**Alternative considered**: Adding to `PanelSettingsProvider`. Rejected because it would couple unrelated concerns (sidebar always-open vs detail panel pinned).

### Decision 2: Empty state as a simple component

**Choice**: A lightweight `DetailPanelEmptyState` inline in `TaskPageLayout` — an icon + one line of text, centered in the pinned column area.

**Why**: No need for a separate file — it's a few lines of JSX. If it grows later, it can be extracted.

### Decision 3: Pin button placement

**Choice**: Pin button in `TaskDetailPanel` header, between delete and close buttons.

**Why**: Header already has action buttons. Pin icon from lucide-react (`Pin` / `PinOff`). Only rendered when `useIsDesktop()` returns true (NFR-R1).

### Decision 4: Storage key naming

**Choice**: `STORAGE_KEYS.DETAIL_PANEL_PINNED = "detail_panel_pinned"`.

**Why**: Follows existing convention (`panel_side`, `panel_open`, `panel_split`, `panel_always_open`). Uses `detail_panel_` prefix to distinguish from sidebar panel settings.

## Risks / Trade-offs

- [Multiple localStorage reads] Each component using `useDetailPanelPinned` reads localStorage independently on mount. -> Acceptable: value is a single boolean, reads are cheap, and this is the established pattern in the project.
- [Layout complexity in TaskPageLayout] Adding conditional pinned rendering increases branching. -> Mitigated by keeping the logic minimal: `const showDetailColumn = isDesktop && (isDetailPanelPinned || isTaskSelected)`.
