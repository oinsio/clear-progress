## MODIFIED Requirements

### Requirement: Filter section is optional and collapsible

When filter config is provided, CommandBar SHALL render a collapsed filter (active item icon + chevron). CommandBarFilter SHALL accept a generic `items` array of `{ value: string, icon: React.ComponentType, label: string }` objects, an `activeValue: string`, and an `onChange: (value: string) => void` callback. Collapsed filter: `flex items-center gap-0.5 px-1 py-1 rounded-lg text-accent active:bg-accent/10 transition-colors`. Icon: `w-7 h-7`, chevron: `w-3 h-3` (inherits `text-accent` from parent button). Tapping expands to show all item icons. Expanded filter: row with `gap-1`, each button `w-10 h-10 flex items-center justify-center rounded-full transition-colors`. Active item: `text-white bg-accent`. Inactive: `text-gray-400 hover:text-gray-600 hover:bg-gray-100 active:bg-gray-200`. Icons inside: `w-7 h-7`. Tapping an item icon SHALL select it, call `onChange`, and collapse the filter. CommandBarFilterConfig SHALL use generic items array instead of BoxFilter-specific fields. Implements FR5, FR6, FR9 of command-bar. Implements FR7 of goals-filter.

#### Scenario: Filter collapsed shows active item icon
- **WHEN** filter is provided with items and activeValue="today"
- **THEN** collapsed filter shows the icon for "today" item and a chevron

#### Scenario: Filter expands on tap
- **WHEN** user taps the collapsed filter
- **THEN** filter expands to show all item icons in a row

#### Scenario: Selecting an item collapses filter
- **WHEN** user taps "week" item in expanded filter
- **THEN** filter collapses, onChange is called with "week"

#### Scenario: No filter config means no filter rendered
- **WHEN** filter prop is undefined
- **THEN** no filter section is rendered

#### Scenario: Goal status filter items
- **WHEN** GoalsPage provides filter with items [active, paused, finished, all]
- **THEN** filter renders Play, Pause, Check, AllBoxesIcon icons

#### Scenario: Task box filter items (backwards compatibility)
- **WHEN** ActiveTasksPage provides filter with items [today, week, later, all]
- **THEN** filter renders TodayBoxIcon, WeekBoxIcon, LaterBoxIcon, AllBoxesIcon icons
