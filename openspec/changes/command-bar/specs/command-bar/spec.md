## ADDED Requirements

### Requirement: CommandBar renders configurable layout

CommandBar SHALL render a horizontal bar containing: optional filter section, textarea with entity icon, optional eye toggle, and create button. The bar SHALL be a non-fixed flex child (`shrink-0`) inside the page's flex column layout, positioned above or below the scrollable content based on user's `filter_bar_position` preference. Bottom position uses `order-last` to appear below the scrollable area. CommandBar MUST NOT use `position: fixed` — it participates in the normal document flow so it naturally respects the Sidebar and content area boundaries. CommandBar MUST NEVER overlap the Sidebar. Textarea SHALL have `flex: 1` to fill available space. All sizes MUST use Tailwind rem-based classes to scale with the interface scale setting. Bar styling: `bg-white shrink-0 px-3 py-2 flex items-start gap-1.5`. Bottom position: `order-last border-t border-gray-200 pb-[calc(0.5rem+env(safe-area-inset-bottom))]` — bottom padding includes base 0.5rem plus iOS safe area. Top position: `border-b border-gray-200`. Textarea MUST use `m-0 block` to eliminate browser default margin and inline baseline gap — this ensures CommandBar height (57px) matches Sidebar search section height exactly, aligning their top borders. Implements FR1, FR2, FR3, FR4, NFR-R3 of command-bar.

#### Scenario: Minimal configuration (no filter, no eye)
- **WHEN** CommandBar receives only entityIcon, placeholder, and onSubmit
- **THEN** it renders textarea with entity icon and create button only

#### Scenario: Full configuration (filter + eye)
- **WHEN** CommandBar receives filter, eyeToggle, entityIcon, placeholder, and onSubmit
- **THEN** it renders filter toggle, textarea with entity icon, eye toggle, and create button

#### Scenario: Bottom position
- **WHEN** user preference is "bottom"
- **THEN** CommandBar is fixed at bottom with border-top

#### Scenario: Top position
- **WHEN** user preference is "top"
- **THEN** CommandBar is fixed at top with border-bottom

### Requirement: Entity icon displays inside textarea

CommandBar SHALL render the provided Lucide icon inside the textarea area, positioned absolutely on the left (`absolute left-2.5 top-2`). Icon: `w-5 h-5 text-accent pointer-events-none`. The textarea SHALL have left padding (`pl-9`) to avoid overlapping the icon. Textarea styling: `border border-gray-200 focus:border-accent rounded-2xl py-2 pr-3 pl-9 text-sm leading-snug min-h-9 max-h-40 resize-none overflow-hidden placeholder:text-gray-400 text-gray-900 transition-colors`. All sizes are rem-based via Tailwind for interface scaling compatibility. Implements FR3 of command-bar.

#### Scenario: Entity icon is visible
- **WHEN** CommandBar renders with entityIcon=Target
- **THEN** Target icon is visible inside the textarea on the left, in accent color

#### Scenario: Icon does not mirror for left-handed
- **WHEN** handedness is "left"
- **THEN** entity icon remains on the left side of the textarea (FR14)

### Requirement: Filter section is optional and collapsible

When filter config is provided, CommandBar SHALL render a collapsed filter (active box icon + chevron). Collapsed filter: `flex items-center gap-0.5 px-1 py-1 rounded-lg text-accent active:bg-accent/10 transition-colors`. Box icon: `w-7 h-7`, chevron: `w-3 h-3` (inherits `text-accent` from parent button). Tapping expands to show all box icons. Expanded filter: row with `gap-1`, each button `w-10 h-10 flex items-center justify-center rounded-full transition-colors`. Active box: `text-white bg-accent`. Inactive: `text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200`. Icons inside: `w-7 h-7`. Box icons are custom SVGs from `BoxIcons.tsx` (TodayBoxIcon, WeekBoxIcon, LaterBoxIcon, AllBoxesIcon). Tapping a box icon SHALL select it, call `onBoxChange`, and collapse the filter. Implements FR5, FR6, FR9 of command-bar.

#### Scenario: Filter collapsed shows active box
- **WHEN** filter is provided with activeBox="today"
- **THEN** collapsed filter shows TodayBoxIcon and a chevron

#### Scenario: Filter expands on tap
- **WHEN** user taps the collapsed filter
- **THEN** filter expands to show all box icons in a row

#### Scenario: Selecting a box collapses filter
- **WHEN** user taps "week" in expanded filter
- **THEN** filter collapses, onBoxChange is called with "week"

#### Scenario: No filter config means no filter rendered
- **WHEN** filter prop is undefined
- **THEN** no filter section is rendered

### Requirement: Filter collapses on textarea focus

When the filter is expanded and the user focuses on the textarea, the filter SHALL collapse immediately, applying the current active box value. Implements FR8 of command-bar.

#### Scenario: Textarea focus collapses expanded filter
- **WHEN** filter is expanded and user focuses on textarea
- **THEN** filter collapses with current active box value preserved

#### Scenario: Textarea focus with collapsed filter does nothing
- **WHEN** filter is already collapsed and user focuses on textarea
- **THEN** no change to filter state

### Requirement: Eye toggle is optional

When eyeToggle config is provided, CommandBar SHALL render an eye toggle button matching existing HiddenTasksToggle: `w-10 h-10 rounded-xl flex items-center justify-center transition-colors`. When `isVisible` is true: Eye icon `w-5 h-5`, `bg-accent/10 text-accent`. When false: EyeOff icon `w-5 h-5`, `text-gray-400 hover:bg-gray-100`. Tapping SHALL call `onToggle`. Implements FR7 of command-bar.

#### Scenario: Eye toggle active state
- **WHEN** eyeToggle.isVisible is true
- **THEN** Eye icon is shown with accent background (aria-pressed="true")

#### Scenario: Eye toggle inactive state
- **WHEN** eyeToggle.isVisible is false
- **THEN** EyeOff icon is shown with gray styling (aria-pressed="false")

#### Scenario: No eyeToggle config means no eye rendered
- **WHEN** eyeToggle prop is undefined
- **THEN** no eye toggle is rendered

### Requirement: Textarea auto-grows as text wraps

Textarea SHALL auto-grow vertically as long entity names wrap visually, up to `max-h-40` (10rem, scales with interface scale). Beyond that, it SHALL scroll internally (`overflow-y: auto`). The bar itself grows with the textarea, pushing content area. On returning to single visual line, textarea SHALL revert to minimum height by clearing inline styles (letting CSS `min-h-9` manage height). The max height SHALL be read from computed CSS (`getComputedStyle(textarea).maxHeight`) rather than hardcoded, so it scales with the interface scale setting. Enter key SHALL submit (create entity), NOT insert a newline — entity names are single-line only, textarea grows only due to visual word-wrap. The auto-resize algorithm: (1) on init, measure `singleLineHeight` by setting `height: auto`, reading `scrollHeight`, then resetting; (2) on each input, temporarily remove stacked class, set `height: auto`, read `scrollHeight` in row-mode, decide stacking based on `scrollHeight > singleLineHeight`; (3) if wrapped, re-measure after stacking and set `height = min(scrollHeight, computedMaxHeight)`. Implements FR10 of command-bar.

#### Scenario: Short name stays compact
- **WHEN** user types a short name that fits one line
- **THEN** textarea height equals CSS min-height (no inline style override)

#### Scenario: Long name wraps and grows textarea
- **WHEN** user types a long name that wraps to 3 visual lines
- **THEN** textarea height increases to fit 3 lines

#### Scenario: Max height triggers scroll
- **WHEN** textarea content exceeds the computed max-height (max-h-40, scales with interface scale)
- **THEN** textarea height is capped at max-height with internal scroll (overflow-y: auto)

#### Scenario: Clearing text returns to single line
- **WHEN** user deletes text back to single line
- **THEN** textarea returns to minimum height, inline styles cleared

#### Scenario: Enter key submits
- **WHEN** user presses Enter with non-empty text
- **THEN** onSubmit is called with trimmed text and textarea clears

#### Scenario: Enter key with empty text does nothing
- **WHEN** user presses Enter with empty or whitespace-only text
- **THEN** nothing happens, no submit

### Requirement: Eye and create button stack on wrapped text

When textarea content wraps to multiple visual lines, eye toggle and create button SHALL stack vertically (eye above, create below) instead of horizontal row. Bar actions container: row mode `flex self-end gap-1 shrink-0`; stacked mode `flex-col self-stretch justify-end gap-0.5`. The stacking threshold SHALL be determined by measuring scrollHeight in row-mode (temporarily removing stacked class) to prevent oscillation. The `singleLineHeight` SHALL be measured dynamically on textarea init, not hardcoded. Implements FR11, FR12 of command-bar.

#### Scenario: Single line keeps row layout
- **WHEN** textarea content fits one visual line
- **THEN** eye and create button are in a horizontal row

#### Scenario: Wrapped text triggers stacking
- **WHEN** textarea content wraps to two or more visual lines
- **THEN** eye and create button stack vertically (eye above create)

#### Scenario: Create button always at bottom of stack
- **WHEN** buttons are stacked
- **THEN** create button is at the bottom regardless of handedness (FR15)

### Requirement: Handedness mirrors layout

When handedness preference is "left", CommandBar SHALL apply `flex-direction: row-reverse` to the bar container and to the actions container (in row mode). Entity icon inside textarea SHALL NOT mirror. Button stack order SHALL NOT change. Implements FR13, FR14, FR15 of command-bar.

#### Scenario: Right-handed layout (default)
- **WHEN** handedness is "right"
- **THEN** layout is: [Filter] [Textarea] [Eye] [+]

#### Scenario: Left-handed layout
- **WHEN** handedness is "left"
- **THEN** layout is: [+] [Eye] [Textarea] [Filter]

#### Scenario: Left-handed stacked layout
- **WHEN** handedness is "left" and textarea content wraps to multiple visual lines
- **THEN** stacked buttons are on the left, filter on the right, create button still at bottom of stack

### Requirement: CommandBar does not overlap Sidebar

CommandBar MUST NOT overlap or extend over the Sidebar on any viewport size. Since CommandBar is a flex child inside the content area (not `position: fixed`), it naturally inherits the content area width. The content area is the space between the Sidebar and any detail panel. This applies to all viewport sizes — desktop, tablet, and mobile. Implements NFR-R3 of command-bar.

#### Scenario: Desktop with collapsed sidebar
- **WHEN** viewport is 1440px and sidebar is collapsed (w-14)
- **THEN** CommandBar left edge starts after the sidebar, not at viewport edge

#### Scenario: Mobile with sidebar icons
- **WHEN** viewport is 375px
- **THEN** CommandBar is within the content area, not overlapping sidebar icons

#### Scenario: CommandBar width matches content area
- **WHEN** CommandBar is rendered on any page
- **THEN** CommandBar width equals the width of the content area (main column)

### Requirement: Submit creates entity and clears textarea

Create button (+) matches existing add task button: `w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors`. Plus icon: `w-5 h-5`. Submit is triggered by tapping the create button OR pressing Enter. When triggered with non-empty textarea, CommandBar SHALL call `onSubmit` with trimmed text, then clear textarea and return to single-line state. Empty textarea SHALL not trigger submit. Implements FR4, FR20, FR21 of command-bar.

#### Scenario: Submit via button tap
- **WHEN** user types "Buy milk" and taps create button
- **THEN** onSubmit is called with "Buy milk", textarea clears, bar returns to single-line

#### Scenario: Submit via Enter key
- **WHEN** user types "Buy milk" and presses Enter
- **THEN** onSubmit is called with "Buy milk", textarea clears, bar returns to single-line

#### Scenario: Submit with empty textarea via button
- **WHEN** textarea is empty and user taps create button
- **THEN** nothing happens, onSubmit is not called

#### Scenario: Submit with empty textarea via Enter
- **WHEN** textarea is empty and user presses Enter
- **THEN** nothing happens, onSubmit is not called

#### Scenario: Submit with whitespace-only textarea
- **WHEN** textarea contains only spaces and user submits (button or Enter)
- **THEN** nothing happens, onSubmit is not called

### Requirement: Placeholder and target box reflect active filter

For task pages, the placeholder SHALL show the target box where the task will be created. When filter is set to a specific box (today/week/later/inbox), that box is the target — placeholder shows "New task for {box}..." and task is created in that box. When filter is "all", the target box is the user's default box setting (from synced settings) — placeholder shows "New task for {defaultBox}..." and task is created in the default box. For non-task pages (goals, ideas, categories, contexts), placeholder shows the entity type ("New goal...", etc.). Implements FR19 of command-bar.

#### Scenario: Task page placeholder with specific filter
- **WHEN** filter is set to "today"
- **THEN** placeholder shows "New task for today..." and created task goes to "today" box

#### Scenario: Task page placeholder with "all" filter
- **WHEN** filter is set to "all" and user's default box is "today"
- **THEN** placeholder shows "New task for today..." and created task goes to "today" box

#### Scenario: Task page placeholder with "all" filter and inbox default
- **WHEN** filter is set to "all" and user's default box is "inbox"
- **THEN** placeholder shows "New task to inbox..." and created task goes to "inbox" box

#### Scenario: Goals page placeholder
- **WHEN** CommandBar is on GoalsPage
- **THEN** placeholder shows "New goal..."

#### Scenario: Placeholder updates when filter changes
- **WHEN** user changes filter from "today" to "week"
- **THEN** placeholder updates to "New task for week..."

### Requirement: Accessibility attributes

All interactive elements in CommandBar SHALL have appropriate aria attributes. Implements NFR-A1, NFR-A2, NFR-A3, NFR-A4, NFR-A5 of command-bar.

#### Scenario: Filter toggle has aria-expanded
- **WHEN** filter is collapsed
- **THEN** filter toggle has aria-expanded="false"

#### Scenario: Eye toggle has aria-pressed
- **WHEN** eye toggle is active
- **THEN** eye toggle button has aria-pressed="true"

#### Scenario: Create button has aria-label
- **WHEN** CommandBar renders
- **THEN** create button has an aria-label describing its action

#### Scenario: Textarea has placeholder
- **WHEN** CommandBar renders
- **THEN** textarea has placeholder text describing expected input

### Requirement: Responsive behavior

CommandBar SHALL span full width of the content area (not the viewport) on all screen sizes. On mobile, content area width equals viewport minus sidebar width. On desktop, content area may be further split by a detail panel. CommandBar width always matches the content column width. Implements NFR-R1, NFR-R2 of command-bar.

#### Scenario: Mobile content width
- **WHEN** viewport is 375px wide with sidebar (w-14)
- **THEN** CommandBar width equals viewport width minus sidebar width

#### Scenario: Desktop content width
- **WHEN** viewport is 1440px wide
- **THEN** CommandBar width matches the main content column width
