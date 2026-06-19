## Context

The settings page (`SettingsPage.tsx`, 752 lines) is a monolithic component rendering 16 settings as a flat scrollable list. Settings come from different storage mechanisms (IndexedDB+sync vs localStorage) but nothing distinguishes them visually. The page needs to be reorganized into semantic groups with collapsible sections and a sync indicator. Driven by FR1-FR11 from proposal.

## Goals / Non-Goals

**Goals:**
- Split SettingsPage into composable section components, each under 200 lines
- Accordion pattern with single-expand behavior and persistent state
- Cloud icon indicator for synced settings

**Non-Goals:**
- No changes to settings storage, hooks, or sync logic
- No new settings added or removed
- No search/filter for settings

## Decisions

### Decision 1: Accordion component with single-expand mode

**Choice**: Custom `SettingsAccordion` component using `useSectionCollapse` hook (already exists for section collapse in localStorage).

**Alternatives considered**:
- Headless UI Disclosure — adds dependency for a simple pattern
- Radix Accordion — same, unnecessary dependency
- Custom from scratch — chosen, minimal code, full control over behavior and ARIA

**Rationale**: The app already has `useSectionCollapse` for persisting collapse state in localStorage (via `STORAGE_KEYS.SECTION_COLLAPSE`). We reuse this mechanism for accordion state. Single-expand mode: when opening a section, close others. FR7 persistence comes for free.

### Decision 2: Section component architecture

**Choice**: Four section components + a thin `SettingsPage` orchestrator.

```
SettingsPage.tsx (orchestrator, <200 lines)
├── LookAndFeelSection.tsx (<200 lines)
├── WorkspaceSection.tsx (<200 lines)
├── TasksSection.tsx (<200 lines)
├── AccountSyncSection.tsx (wrapper around existing ServerSection)
└── ShareAppSection.tsx (existing, rendered outside accordion)
```

**Rationale**: Each section owns its settings and hooks. SettingsPage only handles accordion state and layout. This aligns with the 200-line file limit and keeps concerns separated.

### Decision 3: Sync indicator approach

**Choice**: Inline cloud icon (`Cloud` from lucide-react) next to the setting label, with `aria-label` for accessibility.

**Alternatives considered**:
- Badge on section header — too coarse, not all settings in a section are synced
- Tooltip only — not discoverable
- Text label "Synced" — too verbose

**Rationale**: Per-setting icon is the most precise indicator. Cloud icon is universally understood. `aria-label` satisfies NFR-A2 without adding visual clutter. Legend at page bottom explains the icon for first-time users (FR9).

### Decision 4: Synced settings list as constant

**Choice**: Define `SYNCED_SETTING_KEYS` constant (set of setting keys that sync with server) in constants. A `SyncIndicator` component renders the cloud icon when a setting key is in this set.

**Rationale**: Single source of truth. If a new synced setting is added later, only the constant needs updating. Avoids scattering sync knowledge across section components.

### Decision 5: Accordion section collapse key namespace

**Choice**: Use section IDs prefixed with `settings-accordion-` for localStorage collapse state keys (e.g., `settings-accordion-look-and-feel`). This avoids collision with existing section collapse keys used elsewhere in the app.

**Rationale**: The existing `useSectionCollapse` hook stores all section states in a single JSON object. Prefixing prevents key collisions.

## Risks / Trade-offs

- **[Large Workspace section]**: 5 settings + MenuOrder drag-n-drop = longest section. A visual separator between simple settings and MenuOrder mitigates perceived length. -> Mitigation: horizontal divider before MenuOrder.
- **[Single-expand may frustrate]**: Users comparing settings across sections must re-expand. -> Mitigation: acceptable trade-off for reduced visual clutter; settings are not typically compared cross-section.
- **[FR11 single-expand vs FR7 persistence interaction]**: If user collapses all sections and leaves, next visit shows all collapsed. -> Mitigation: if no section is expanded, default to first section (Look & Feel) per FR6.
