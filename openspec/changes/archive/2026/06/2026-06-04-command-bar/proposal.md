# Command Bar

## Why

Entity creation UI is fragmented across pages: `BoxFilterBar` + `AddTaskInput` for task pages, inline buttons + textarea for goals/ideas/categories/contexts. Each page has its own layout and interaction patterns, making the experience inconsistent and hard to maintain. A unified CommandBar component will provide a single, consistent entry point for creating any entity, filtering tasks, and toggling hidden task visibility — across all pages.

## What Changes

- **ADDED**: Unified `CommandBar` React component — configurable via props for any page
- **ADDED**: Telegram-style auto-grow textarea with stacking behavior (eye/+ buttons stack vertically when text wraps)
- **ADDED**: Handedness setting (left-handed layout mirrors controls via `flex-direction: row-reverse`)
- **ADDED**: Dynamic `--command-bar-height` CSS variable via ResizeObserver for content padding
- **MODIFIED**: All entity pages (tasks, inbox, goals, ideas, categories, contexts) — use CommandBar instead of per-page creation UI
- **REMOVED**: `BoxFilterBar`, `AddTaskInput`, `HiddenTasksToggle` as standalone components (absorbed into CommandBar)
- **REMOVED**: Inline add buttons on goals/ideas/categories/contexts pages

## Capabilities

### New Capabilities

- `command-bar`: Unified command bar component with configurable filter, entity icon, textarea, eye toggle, and create button. Supports position top/bottom, handedness, Telegram-style auto-grow, and stacking.

### Modified Capabilities

- `task-page-layout`: Toolbar slots replaced by CommandBar with `position: fixed` and dynamic padding
- `local-preferences`: New `handedness` setting added ("right" | "left")

## Goals

- **G1**: Single reusable component for entity creation on all pages
- **G2**: Consistent interaction patterns across all entity types
- **G3**: Comfortable one-handed mobile use with handedness support

## Non-Goals

- **NG1**: Search functionality in CommandBar (search stays on its dedicated page)
- **NG2**: Batch entity creation (multi-line input creating multiple entities)
- **NG3**: Entity type switching within CommandBar (each page determines entity type)
- **NG4**: Keyboard shortcuts for CommandBar actions

## Users & Scenarios

### Per-page scenarios

- **U1**: **ActiveTasksPage** — user sees CommandBar with filter (today/week/later/all), eye toggle, CheckSquare icon. Filter defaults to last selected box. Typing "Buy groceries" and pressing Enter creates a task in the filtered box. If filter is "all", task goes to user's default box.
- **U2**: **ActiveTasksPage** — user selects "week" in filter, placeholder changes to "New task for week...", creates task — task appears in week section.
- **U3**: **ActiveTasksPage** — user toggles eye to show hidden (future-dated) tasks, hidden tasks appear in the list with reduced opacity.
- **U4**: **InboxPage** — user sees CommandBar with CheckSquare icon, eye toggle, NO filter. Placeholder says "New task to inbox...". Typing and pressing Enter creates task in inbox box.
- **U5**: **GoalsPage** — user sees CommandBar with Target icon, NO filter, NO eye toggle. Placeholder says "New goal...". Typing "Learn Spanish" and pressing Enter creates a new goal.
- **U6**: **IdeasPage** — user sees CommandBar with Lightbulb icon, NO filter, NO eye toggle. Placeholder says "New idea...". Typing and pressing Enter creates a new idea.
- **U7**: **CategoriesPage** — user sees CommandBar with Tag icon, NO filter, NO eye toggle. Placeholder says "New category...". Creates a new category on submit.
- **U8**: **ContextsPage** — user sees CommandBar with MapPin icon, NO filter, NO eye toggle. Placeholder says "New context...". Creates a new context on submit.
- **U9**: **GoalDetailPage** — user sees CommandBar with filter (inbox/today/week/later/all, default: all), eye toggle, CheckSquare icon. Typing "Research tools" and pressing Enter creates a task auto-linked to this goal via goal_id, in the target box.
- **U10**: **CategoryDetailPage** — same as GoalDetailPage but task auto-linked via category_id.
- **U11**: **ContextDetailPage** — same as GoalDetailPage but task auto-linked via context_id.

### Cross-cutting scenarios

- **U12**: Left-handed user configures handedness in settings — on all pages, filter moves right, buttons move left, entity icon stays on the left inside textarea.
- **U13**: User writes a long entity name — textarea grows upward (bottom position) or downward (top position), eye and + stack vertically when text wraps.
- **U14**: User expands filter to change box — then taps textarea, filter collapses applying current selection.
- **U15**: Desktop user with detail panel open — CommandBar width matches task list width, not full viewport.
- **U16**: User switches CommandBar position to top in settings — on all pages, CommandBar moves to top with border-bottom, content gets top padding.
- **U17**: User presses Enter with empty textarea — nothing happens, no entity created.
- **U18**: User on ActiveTasksPage with filter "all" and default box "today" — placeholder shows "New task for today...", task created in today box.

## Requirements

### Functional

- **FR1**: CommandBar is a single React component accepting configuration props: filter, eyeToggle, entityIcon, placeholder, onSubmit, position
- **FR2**: Textarea is always visible, with rounded messenger-style shape (`rounded-2xl`)
- **FR3**: Entity icon (Lucide) is displayed inside textarea on the left (position: absolute)
- **FR4**: Create button (+) is circular with accent background and white icon, always visible
- **FR5**: Filter section is optional — shown only on pages with task box filtering
- **FR6**: Filter collapsed state shows active box icon + chevron; expanded shows all box icons
- **FR7**: Eye toggle is optional — shown only on pages with hidden tasks concept
- **FR8**: When textarea receives focus, expanded filter collapses and applies current selection
- **FR9**: Selecting a box in filter collapses filter and applies the value
- **FR10**: Textarea auto-grows vertically as long names wrap visually, up to max-h-40 (scales with interface scale), then scrolls internally. Enter submits — no literal newlines.
- **FR11**: When textarea content wraps to multiple visual lines, eye and + buttons stack vertically (eye above +)
- **FR12**: Anti-oscillation: stacking threshold measured in row-mode to prevent layout flickering
- **FR13**: Handedness setting mirrors layout via `flex-direction: row-reverse` on the bar and actions container
- **FR14**: Entity icon inside textarea does NOT mirror (always left-aligned for LTR)
- **FR15**: Button order in stack does NOT change with handedness (+ always at bottom)
- **FR16**: CommandBar height is published as CSS variable `--command-bar-height` via ResizeObserver
- **FR17**: Content area uses `--command-bar-height` for padding to prevent overlap
- **FR18**: Position (top/bottom) is read from existing `filter_bar_position` user setting
- **FR19**: Placeholder text reflects the target box for task creation. When filter is a specific box (today/week/later/inbox) — placeholder shows that box and task is created in it. When filter is "all" — placeholder shows user's default box setting and task is created in it. For non-task pages, placeholder shows entity type ("New goal...", etc.).
- **FR20**: On submit, textarea clears and CommandBar returns to single-line state
- **FR21**: Submitting empty textarea does nothing

### Non-Functional

#### Performance

- **NFR-P1**: Textarea resize must not cause layout thrashing — single reflow per input event
- **NFR-P2**: ResizeObserver callback must be throttled (no more than 1 update per animation frame)

#### Accessibility

- **NFR-A1**: All interactive elements have aria-labels
- **NFR-A2**: Filter toggle has aria-expanded state
- **NFR-A3**: Eye toggle has aria-pressed state
- **NFR-A4**: Create button is focusable and activatable via keyboard
- **NFR-A5**: Textarea has appropriate placeholder and role

#### Responsive

- **NFR-R1**: CommandBar spans full width on mobile (<640px)
- **NFR-R2**: On desktop (>=640px), CommandBar respects page max-width and centering
- **NFR-R3**: With detail panel open, CommandBar width matches task list width
- **NFR-R4**: Position (top/bottom) works correctly on all viewports

## UX Acceptance Criteria

- **UX1**: Textarea feels like a messenger input — rounded, compact, grows smoothly
- **UX2**: Stacking transition (row → column for eye/+) is instant, no animation
- **UX3**: Filter collapse on textarea focus is instant
- **UX4**: Single-line CommandBar height is compact (~48-56px including padding)
- **UX5**: Left-handed layout feels natural — primary action (+ button) is reachable by left thumb
- **UX6**: Entity icon inside textarea is visually distinct (accent color) but not distracting

## UI States Matrix

| Network | Data               | CommandBar UI                                |
|---------|--------------------|----------------------------------------------|
| Online  | Has entities       | Normal: filter + textarea + eye + create     |
| Online  | Empty list         | Same — CommandBar is always available        |
| Offline | Has entities       | Same — creation works offline (client-first) |
| Offline | Empty list         | Same                                         |
| Any     | Filter expanded    | Textarea active, filter shows all box icons  |
| Any     | Textarea focused   | Filter collapsed, textarea has cursor        |
| Any     | Wrapped text       | Eye and + stacked vertically                 |
| Any     | Max height reached | Textarea scrolls internally, stacked layout  |

## Behavior

Behavior specs in `features/command-bar.feature` with `@command-bar` tags.

## Visual Specification

All sizes MUST use Tailwind rem-based classes (not hardcoded px) to respect the project's interface scaling feature (`data-scale` on `<html>`: small=87.5%, normal=100%, large=125%, xLarge=150%). Colors use project design tokens (accent from user settings, grays from Tailwind config). Dark mode via existing `html.dark` class.

### CommandBar container

- `bg-white` (dark mode handled by existing global overrides)
- `fixed z-40` (below modals/overlays which use z-50)
- Bottom position: `border-t border-gray-200 safe-area-bottom`
- Top position: `border-b border-gray-200`
- `px-3 py-2` (matches existing BoxFilterBar padding)
- `flex items-start gap-1.5`
- Left-handed: `flex-direction: row-reverse`

### Filter toggle (collapsed)

Matches existing BoxFilterBar collapsed state:
- `flex items-center gap-0.5 px-1 py-1 rounded-lg text-accent active:bg-accent/10 transition-colors`
- Box icon: `w-7 h-7`, accent color
- Chevron: `w-3 h-3` (inherits `text-accent` from parent button)
- Custom SVG icons from `BoxIcons.tsx` (TodayBoxIcon, WeekBoxIcon, LaterBoxIcon, AllBoxesIcon)

### Filter (expanded)

Matches existing BoxFilterBar expanded state:
- Row of circular buttons with `gap-1`
- Each button: `w-10 h-10 flex items-center justify-center rounded-full transition-colors`
- Active box: `text-white bg-accent`
- Inactive: `text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200`
- Icons inside: `w-7 h-7`

### Input wrapper + textarea

- Input wrapper: `flex-1 relative min-w-0`
- Entity icon: `absolute left-2.5 top-2`, `w-5 h-5`, `text-accent`, `pointer-events-none`
- Textarea:
  - `border border-gray-200 focus:border-accent` (standard 1px border)
  - `rounded-2xl` (Tailwind 1rem = 16px, closest to messenger style without custom value)
  - `py-2 pr-3 pl-9` (pl-9 = 2.25rem to clear entity icon)
  - `text-sm leading-snug` (matches project text size)
  - `min-h-9` (2.25rem), `max-h-40` (10rem, scales with interface scale)
  - `resize-none overflow-hidden` (becomes `overflow-y-auto` at max-height)
  - `placeholder:text-gray-400 text-gray-900`
  - `transition-colors`

### Bar actions (eye + create button)

- Container: `flex self-end gap-1 shrink-0`
- Left-handed non-stacked: `flex-row-reverse`
- **Stacked mode** (wrapped text): `flex-col self-stretch justify-end gap-0.5`

### Eye toggle button

Matches existing HiddenTasksToggle styling:
- `w-10 h-10 rounded-xl flex items-center justify-center transition-colors`
- Inactive: `text-gray-400 hover:bg-gray-100`
- Active: `bg-accent/10 text-accent`
- Icon: `w-5 h-5` (Eye or EyeOff from Lucide)

### Create button (+)

Matches existing add task button styling from BoxFilterBar:
- `w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-md transition-colors`
- Hover: `hover:bg-accent/80`
- Active: `active:bg-accent/70`
- Icon: `w-5 h-5` (Plus from Lucide)

### Entity icons per page (Lucide React)

| Page                         | Icon                | Lucide component |
|------------------------------|---------------------|------------------|
| Tasks / Inbox / Detail pages | Checkbox with check | CheckSquare      |
| Goals                        | Crosshair target    | Target           |
| Ideas                        | Light bulb          | Lightbulb        |
| Contexts                     | Map pin             | MapPin           |
| Categories                   | Label tag           | Tag              |

### Page-specific CommandBar configurations

| Page               | Filter boxes                                  | Eye toggle | Entity icon | Default placeholder           | Auto-link field              |
|--------------------|-----------------------------------------------|------------|-------------|-------------------------------|------------------------------|
| ActiveTasksPage    | today, week, later, all                       | yes        | CheckSquare | "New task for {targetBox}..." | box={targetBox}              |
| InboxPage          | --                                            | yes        | CheckSquare | "New task to inbox..."        | box="inbox"                  |
| GoalDetailPage     | inbox, today, week, later, all (default: all) | yes        | CheckSquare | "New task for {targetBox}..." | goal_id, box={targetBox}     |
| CategoryDetailPage | inbox, today, week, later, all (default: all) | yes        | CheckSquare | "New task for {targetBox}..." | category_id, box={targetBox} |
| ContextDetailPage  | inbox, today, week, later, all (default: all) | yes        | CheckSquare | "New task for {targetBox}..." | context_id, box={targetBox}  |
| GoalsPage          | --                                            | --         | Target      | "New goal..."                 | --                           |
| IdeasPage          | --                                            | --         | Lightbulb   | "New idea..."                 | --                           |
| CategoriesPage     | --                                            | --         | Tag         | "New category..."             | --                           |
| ContextsPage       | --                                            | --         | MapPin      | "New context..."              | --                           |

`{targetBox}` = active filter value if specific box selected, OR user's default box setting (from synced settings) if filter is "all".

### Auto-resize algorithm (Telegram-style)

Max height constant `COMMAND_BAR_MAX_TEXTAREA_HEIGHT` SHALL be computed from rem (e.g., `element.style.maxHeight` read from CSS `max-h-40`) rather than hardcoded px, so it scales with interface scale.

```
1. On init:
   textarea.style.height = 'auto'
   singleLineHeight = textarea.scrollHeight
   textarea.style.height = ''
   maxHeight = parseFloat(getComputedStyle(textarea).maxHeight)  // reads rem-based max-h-40

2. On input:
   // Always measure in row-mode for stable threshold
   barActions remove stacked class
   textarea.style.height = 'auto'
   rowScrollHeight = textarea.scrollHeight
   shouldStack = rowScrollHeight > singleLineHeight

   barActions toggle stacked class based on shouldStack

   if (!shouldStack):
     textarea.style.height = ''      // CSS min-height manages
     textarea.style.overflowY = ''
     return

   // Wrapped text: measure again after stacking applied (wider textarea)
   textarea.style.height = 'auto'
   finalScrollHeight = textarea.scrollHeight
   finalHeight = min(finalScrollHeight, maxHeight)
   textarea.style.height = finalHeight + 'px'
   textarea.style.overflowY = finalScrollHeight > maxHeight ? 'auto' : 'hidden'
```

### Handedness mirroring rules

- Bar container: `flex-direction: row-reverse` (filter goes right, actions go left)
- Bar actions (row mode only): `flex-direction: row-reverse`
- Entity icon inside textarea: NO mirror (always left-positioned via `left-2.5`)
- Stack order: NO change (create button always at bottom)
- Textarea padding: NO change (always `pl-9`)

## Affected IA

Requires update to page-level component structure: all entity pages switch from per-page creation UI to shared CommandBar. No route changes.

## Success Metrics

- **M1**: Single `CommandBar` component used on all 9 entity pages (tasks, inbox, goals, ideas, categories, contexts, goal-detail, category-detail, context-detail)
- **M2**: Zero page-specific entity creation components remain (BoxFilterBar, AddTaskInput, HiddenTasksToggle removed)
- **M3**: All existing Playwright and Vitest tests pass after migration
- **M4**: Mutation test score >=90% on new CommandBar code

## Resolved Questions

- **Q1**: Enter submits (creates entity). No newlines in textarea — entity names are single-line only. Textarea auto-grow is for long single-line names that wrap visually, not for multi-paragraph input.
- **Q2**: Detail pages (goal/category/context) default filter to "all" (AllBoxesIcon) — shows tasks from all boxes.
