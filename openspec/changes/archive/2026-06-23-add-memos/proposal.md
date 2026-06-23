# Add Memos

## Why

New users struggle to adopt GTD/Jedi Techniques habits because reference materials aren't readily accessible. Having concise, always-available cheat sheets inside the app — offline, in the user's language — lowers the barrier to building productive habits. This is especially important for a productivity app: the methodology guide should live next to the tools that implement it.

## What Changes

- **ADDED**: New "Memos" section in the sidebar menu (BookOpen icon, before Deleted)
- **ADDED**: Memos list page (`/memos`) showing all available memos as cards
- **ADDED**: Memo detail page (`/memos/:slug`) rendering full markdown content with mermaid diagrams
- **ADDED**: Static markdown content files with frontmatter, organized by language (`content/memos/ru/`, `content/memos/en/`)
- **ADDED**: Auto-discovery of memo files via `import.meta.glob` — adding a new `.md` file is sufficient
- **ADDED**: Mermaid diagram rendering with automatic dark/light theme switching
- **ADDED**: `mermaid` npm dependency (~348 KB gzipped, bundled for offline-first)
- **MODIFIED**: `MenuMode` type — new `"memos"` value
- **MODIFIED**: `ROUTES` — new `MEMOS` and `MEMO` entries
- **MODIFIED**: Sidebar `FILTER_ITEMS` — new memos entry
- **MODIFIED**: `DEFAULT_MENU_ORDER` — memos added before deleted, visible by default

## Capabilities

### New Capabilities
- `memos`: Static read-only reference pages with markdown+mermaid content, language-aware file loading, auto-discovery, and responsive list/detail UI

### Modified Capabilities
- `sidebar-navigation`: New "memos" filter item with route navigation
- `menu-order`: New "memos" mode in MenuMode enum and default order

## Goals

- **G1**: Users can access GTD/Jedi Techniques reference materials without leaving the app
- **G2**: Content works fully offline (PWA, no CDN dependencies)
- **G3**: Adding a new memo requires only adding a markdown file — no code changes
- **G4**: Content is translatable by adding language-specific folders

## Non-Goals

- **NG1**: User-created memos or notes — this is app-provided static content only
- **NG2**: Interactive checklists or step-by-step wizards within memos
- **NG3**: Search within memo content
- **NG4**: Memo bookmarking or favorites
- **NG5**: Content editing or CMS — files are part of the codebase

## Users & Scenarios

- **U1**: New user exploring GTD methodology — opens Memos to understand task review process
- **U2**: Experienced user doing weekly review — quickly references the review checklist diagram
- **U3**: English-speaking user — sees memos in English automatically based on app language
- **U4**: User with "Dr. House" locale — sees Russian memos (baseLanguage = "ru")
- **U5**: User who doesn't need memos — hides the menu item via Settings > Menu items

## Requirements

### Functional

- **FR1**: App SHALL display a "Memos" item in the sidebar menu with BookOpen icon, positioned before "Deleted" in default order
- **FR2**: Clicking "Memos" in sidebar SHALL navigate to `/memos`
- **FR3**: Memos list page SHALL display all available memos as cards showing title, description, and icon from frontmatter
- **FR4**: Cards SHALL be ordered by the `order` field from frontmatter (ascending)
- **FR5**: Clicking a memo card SHALL navigate to `/memos/:slug` showing the full memo content
- **FR6**: Memo detail page SHALL render markdown content with mermaid diagrams as inline SVG
- **FR7**: Memo detail page SHALL have a back navigation to return to the memos list
- **FR8**: System SHALL auto-discover memo files via `import.meta.glob` from `content/memos/{lang}/*.md`
- **FR9**: System SHALL select the memo language folder based on the current locale's `baseLanguage` from `_meta`
- **FR10**: Each memo file SHALL contain YAML frontmatter with required fields: `title`, `description`, `icon` (Lucide icon name), `order` (integer)
- **FR11**: Mermaid diagrams SHALL switch between light and dark themes matching the app's current color scheme
- **FR12**: Memos menu item SHALL be visible by default and hideable via existing menu order settings
- **FR13**: If no memo files exist for the current baseLanguage, the system SHALL fall back to the default language folder

### Non-Functional

#### Performance
- **NFR-P1**: Memo list page SHALL render within 100ms (static content, no async loading)
- **NFR-P2**: Mermaid diagrams SHALL render within 500ms per diagram

#### Accessibility
- **NFR-A1**: Memo cards SHALL be keyboard-navigable with Enter/Space to open
- **NFR-A2**: Mermaid SVG diagrams SHALL have `role="img"` and `aria-label` with diagram description
- **NFR-A3**: Back navigation SHALL be accessible via keyboard

#### Responsive
- **NFR-R1**: Memo cards SHALL display in a single column on mobile (<1024px) and adapt to wider screens
- **NFR-R2**: Memo detail page SHALL be full-screen on mobile with a top back button
- **NFR-R3**: Markdown content SHALL use `prose` typography classes for comfortable reading on all screen sizes

## UX Acceptance Criteria

- **UX1**: Memo list feels like a natural section of the app — same visual style as Ideas/Goals pages
- **UX2**: Memo content is comfortable to read on phone screens (proper font size, spacing, no horizontal scroll)
- **UX3**: Mermaid diagrams are readable without zooming on mobile (horizontal scroll for wide diagrams if needed)
- **UX4**: Dark mode diagrams have sufficient contrast and match the app's dark theme
- **UX5**: Navigation between list and detail is instant (no loading spinners for bundled content)

## UI States Matrix

| State    | Network | Data                                   | UI                                      |
|----------|---------|----------------------------------------|-----------------------------------------|
| Normal   | any     | memos exist for language               | Card list with title, description, icon |
| Fallback | any     | no memos for language, fallback exists | Show fallback language memos            |
| Empty    | any     | no memos at all                        | Empty state with message                |
| Detail   | any     | memo content loaded                    | Full markdown + mermaid rendering       |

## Behavior

Reference scenarios in `features/memos.feature` (`@add-memos` tags).

## Visual Reference

No Figma. Follow existing page patterns (IdeasPage, GoalsPage). Design tokens are source of truth for colors. Mermaid theme derived from CSS custom properties.

## Affected IA

Requires IA update: new top-level section "Memos" added to main navigation between Ideas/Completed group and Deleted.

## Success Metrics

- **M1**: All 4 initial memos render correctly in both ru and en languages
- **M2**: Mermaid diagrams render in both light and dark themes without visual artifacts
- **M3**: Adding a new memo file (without code changes) results in it appearing in the list after rebuild
- **M4**: Bundle size increase from mermaid is under 400 KB gzipped
- **M5**: Memos section is fully usable offline (after initial PWA cache)

## Open Questions

- **Q1**: ~~Should mermaid be bundled or loaded lazily?~~ Resolved: bundled (offline-first requirement)
- **Q2**: ~~SVG files vs mermaid runtime?~~ Resolved: mermaid runtime in bundle
- **Q3**: ~~Should wide mermaid diagrams on mobile use horizontal scroll or be scaled down to fit?~~ Resolved: horizontal scroll with visual fade indicator (scaling makes text unreadable)

## Initial Memo Content

Four memos will be created for the initial release:

1. **inbox-processing** (order: 1) — Inbox processing: decision flowchart for sorting incoming items
2. **natural-planning** (order: 2) — Natural Planning Model: 5-step planning process diagram
3. **tasks** (order: 3) — Tasks: criteria for proper task formulation
4. **procrastination** (order: 4) — Procrastination: techniques to overcome it
