## ADDED Requirements

### Requirement: Active focused goal is highlighted in navigation panel

When user is on GoalDetailPage (`/goals/{id}`) and the current goal is in focus and the `focused_goals` block is visible in menu settings, the system MUST highlight that specific focused goal nav item in the right panel and MUST NOT highlight the "Goals" menu item. Only the current goal's nav item SHALL be highlighted, not all focused goals. Implements FR1, FR5, FR6 of fix-focused-goal-highlight.

#### Scenario: Focused goal highlighted on its detail page
- **WHEN** user navigates to `/goals/{id}` where goal is in focus and `focused_goals` is visible in menu
- **THEN** the focused goal's nav item in the right panel shows active styling (`bg-white/20 text-white`) and "Goals" menu item is NOT highlighted

#### Scenario: Only current goal highlighted when multiple goals in focus
- **WHEN** user navigates to `/goals/{id}` where goal A is in focus, and goal B is also in focus
- **THEN** only goal A's nav item shows active styling, goal B's nav item shows default styling

#### Scenario: Highlight updates reactively when focus is toggled off
- **WHEN** user is on `/goals/{id}` with the goal highlighted as focused, and removes the goal from focus
- **THEN** the focused goal's nav item loses active styling and "Goals" menu item becomes highlighted

#### Scenario: Highlight updates reactively when focus is toggled on
- **WHEN** user is on `/goals/{id}` with "Goals" highlighted (goal not in focus), and adds the goal to focus
- **THEN** "Goals" menu item loses highlight and the focused goal's nav item gains active styling

### Requirement: Fallback to Goals highlight when focused_goals block is hidden

When user is on GoalDetailPage and the current goal is in focus but the `focused_goals` block is hidden in menu settings, the system MUST highlight the "Goals" menu item instead. Implements FR3 of fix-focused-goal-highlight.

#### Scenario: Focused goals block hidden in menu settings
- **WHEN** user navigates to `/goals/{id}` where goal is in focus but `focused_goals` is hidden in menu order settings
- **THEN** "Goals" menu item is highlighted (not the focused goal nav item, which is not rendered)

## MODIFIED Requirements

### Requirement: Focused goals appear in navigation

Focused goals MUST be displayed in RightFilterPanel as separate navigation items. Clicking an item MUST navigate to `/goals/:id`. Each nav item MUST support an active/highlighted state controlled by `isActive` prop. Active state MUST use the same styling as other active panel items. Active focused goal nav item MUST have `aria-pressed="true"`. Implements FR4, FR5, FR7 of add-goal-focus. Implements FR1, FR6, NFR-A1 of fix-focused-goal-highlight.

#### Scenario: One goal in focus
- **WHEN** 1 goal is in focus
- **THEN** navigation shows 1 item: circle with goal's cover image (or default image) + goal name, click leads to GoalDetailPage for that goal

#### Scenario: Two goals in focus
- **WHEN** 2 goals are in focus
- **THEN** navigation shows 2 items with cover circles and goal names in order focused_goal_1, focused_goal_2

#### Scenario: Focused goal has cover image
- **WHEN** focused goal has a non-empty `cover_file_id`
- **THEN** navigation shows a circle with the goal's cover image instead of standard icon

#### Scenario: Focused goal has no cover image
- **WHEN** focused goal has an empty `cover_file_id`
- **THEN** navigation shows a circle with the default goal image

#### Scenario: No goals in focus
- **WHEN** 0 goals are in focus
- **THEN** focused_goals block takes no space in navigation (FR7)

#### Scenario: Active focused goal nav item
- **WHEN** a focused goal nav item has `isActive=true`
- **THEN** item shows highlighted styling (`bg-white/20 text-white`) and has `aria-pressed="true"`

#### Scenario: Inactive focused goal nav item
- **WHEN** a focused goal nav item has `isActive=false`
- **THEN** item shows default styling (`text-white/80` for expanded, `text-white/70` for collapsed)