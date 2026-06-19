# Settings Page Reordering

## Why

The settings page is a flat list of 16 unrelated settings in a single 752-line component. Users must scroll through everything to find what they need. Grouping settings by purpose with collapsible sections reduces cognitive load and keeps every setting within 3 interactions (open Settings -> expand section -> change value). Additionally, some settings sync across devices while others are local-only; there is no visual distinction between them.

## What Changes

- **ADDED**: Settings are grouped into 4 collapsible accordion sections: Look & Feel, Workspace, Tasks, Account & Sync
- **ADDED**: Cloud sync indicator (cloud icon) next to settings that sync with the server (accent_color, custom accent colors, default_box, day_boundary)
- **ADDED**: Legend at the bottom of the page explaining the sync indicator
- **MODIFIED**: ShareAppSection moved outside accordion groups as a standalone banner at the bottom of the page
- **MODIFIED**: SettingsPage refactored from monolithic component into composable section components

## Capabilities

### New Capabilities

- `settings-page-sections`: Accordion-based grouping of settings into 4 semantic sections with sync indicator

### Modified Capabilities

_None. No spec-level behavior changes — this is a UI reorganization of existing settings._

## Impact

- `packages/client/src/pages/SettingsPage.tsx` — major refactor (split into section components)
- `packages/client/src/components/settings/` — new section components, reuse existing SettingsAccordion and SettingsSection
- `packages/client/src/locales/en.json`, `ru.json` — new i18n keys for section headings, sync legend
- `packages/client/src/constants/index.ts` — new constants for section configuration

## Goals

- **G1**: Reduce cognitive load — settings grouped by purpose, not listed randomly
- **G2**: Every setting reachable in 3 or fewer steps from Settings page
- **G3**: User can distinguish synced vs local-only settings at a glance

## Non-Goals

- **NG1**: No new settings are added or removed
- **NG2**: No changes to settings storage, sync logic, or defaults
- **NG3**: No search/filter functionality for settings
- **NG4**: No drag-and-drop reordering of sections

## Users & Scenarios

- **U1**: User wants to change app appearance — opens "Look & Feel" section, finds theme/color/scale/language together
- **U2**: User wants to rearrange workspace layout — opens "Workspace" section, finds panel/handedness/menu settings together
- **U3**: User wonders which settings are shared across devices — sees cloud icon next to synced settings
- **U4**: User wants to share the app with a friend — scrolls to bottom banner, clicks share

## Requirements

### Functional

- **FR1**: Settings page displays 4 collapsible accordion sections: Look & Feel, Workspace, Tasks, Account & Sync
- **FR2**: Look & Feel section contains: Theme, Accent color, Interface scale, Language
- **FR3**: Workspace section contains: Panel side, Always expanded, Pin detail panel, Handedness, Filter position, Menu items
- **FR4**: Tasks section contains: Default box, Day start time, Focus mode, Focus strength
- **FR5**: Account & Sync section contains: Server connection (existing ServerSection component)
- **FR6**: First section (Look & Feel) is expanded by default on initial visit
- **FR7**: Accordion expand/collapse state persists in localStorage
- **FR8**: Cloud icon displayed next to label of synced settings: accent_color, custom accent colors, default_box, day_boundary
- **FR9**: Legend "syncs across devices" displayed at the bottom of the page
- **FR10**: ShareAppSection rendered as a standalone banner below all accordion sections
- **FR11**: Only one accordion section can be open at a time (single-expand mode)

### Non-Functional

#### Accessibility

- **NFR-A1**: Accordion sections use proper ARIA attributes (role, aria-expanded, aria-controls)
- **NFR-A2**: Sync indicator icon has accessible label (aria-label or tooltip)
- **NFR-A3**: Accordion sections are keyboard navigable (Enter/Space to toggle)

#### Responsive

- **NFR-R1**: Accordion layout works on all supported viewports (375px - 2560px)

## UX Acceptance Criteria

- **UX1**: Expanding a section smoothly reveals its content (no layout jumps)
- **UX2**: Section headers show expand/collapse chevron indicator
- **UX3**: Cloud icon is subtle and does not distract from the setting label
- **UX4**: ShareAppSection banner is visually distinct from accordion sections

## Behavior

Reference to `features/settings-page-sections.feature` with tags `@settings-page-reordering @FR1-FR11`.

## Affected IA

Requires update to settings page structure — settings are reorganized into sections but all settings remain on the same page. No new routes.

## Success Metrics

- **M1**: Settings page component reduced from 752 lines to <200 lines (main page) + section components <200 lines each
- **M2**: Every setting reachable in <= 3 clicks/taps from Settings page
- **M3**: Mutation testing score >= 95% on new accordion/section components

## Open Questions

_None — design decisions resolved during exploration phase._
