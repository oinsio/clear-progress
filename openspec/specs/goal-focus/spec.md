# Capability: Goal Focus

## Purpose

Mechanism for selecting 1-2 goals for quick access from navigation with cross-device sync.

## Requirements

### Requirement: User can add a goal to focus

User SHALL be able to add a goal to focus via a toggle icon on GoalDetailPage. The same icon MUST remove the goal from focus if it is already focused (toggle behavior). System MUST store focused goals in Settings IndexedDB (keys `focused_goal_1`, `focused_goal_2`). Key value — `goal_id` (UUID v4) or `""` (empty). Implements FR1, FR8, FR10 of add-goal-focus.

#### Scenario: Add first goal to focus
- **WHEN** user clicks focus icon on GoalDetailPage with 0 goals in focus
- **THEN** goal is written to `focused_goal_1`, icon switches to active state

#### Scenario: Add second goal to focus
- **WHEN** user clicks focus icon on GoalDetailPage with 1 goal in focus
- **THEN** goal is written to `focused_goal_2`, icon switches to active state

#### Scenario: Goal already in focus
- **WHEN** user clicks focus icon for a goal that is already in focus
- **THEN** goal is removed from focus (toggle), remaining goal MUST shift to `focused_goal_1`, `focused_goal_2` is cleared to `""`

#### Scenario: Remove goal from position 1 when position 2 occupied
- **WHEN** `focused_goal_1=A`, `focused_goal_2=B` and user removes A from focus
- **THEN** `focused_goal_1=B`, `focused_goal_2=""` (B shifts up)

#### Scenario: Remove goal from position 2
- **WHEN** `focused_goal_1=A`, `focused_goal_2=B` and user removes B from focus
- **THEN** `focused_goal_1=A`, `focused_goal_2=""`

#### Scenario: Remove only focused goal
- **WHEN** `focused_goal_1=A`, `focused_goal_2=""` and user removes A from focus
- **THEN** `focused_goal_1=""`, `focused_goal_2=""`

### Requirement: Focus limit is strictly 2 goals

System MUST limit focused goals to 2. When attempting to add a 3rd goal, system MUST show a replacement dialog. Implements FR2, FR3 of add-goal-focus.

#### Scenario: Attempt to add third goal
- **WHEN** user clicks focus icon with 2 goals in focus
- **THEN** system shows a dialog with names of current focused goals and offers: replace first, replace second, or cancel

#### Scenario: Replace first focused goal via dialog
- **WHEN** `focused_goal_1=A`, `focused_goal_2=B` and user chooses "replace A" in dialog
- **THEN** `focused_goal_1=B`, `focused_goal_2=C` (B shifts up, new C always at bottom)

#### Scenario: Replace second focused goal via dialog
- **WHEN** `focused_goal_1=A`, `focused_goal_2=B` and user chooses "replace B" in dialog
- **THEN** `focused_goal_1=A`, `focused_goal_2=C` (A stays, new C at bottom)

#### Scenario: Cancel replacement dialog
- **WHEN** user clicks "Cancel" in replacement dialog
- **THEN** focused goals do not change, dialog closes

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

### Requirement: Focused goals is a single menu block

`"focused_goals"` MUST be a single MenuMode in menuOrder. In menu order settings it MUST move as one block (focused goals cannot be split by other items). Implements FR6 of add-goal-focus.

#### Scenario: Reorder focused_goals in menu settings
- **WHEN** user drags the focused_goals block in menu order settings
- **THEN** both focused goals move together as a single element

#### Scenario: Toggle visibility of focused_goals
- **WHEN** user hides focused_goals in menu settings
- **THEN** both focused goals disappear from navigation

### Requirement: Auto-cleanup of invalid focused goals

System MUST automatically remove a goal from focus if it is deleted (soft delete), completed, or cancelled **after the changes are saved to IndexedDB**. During editing (before clicking "Save"), the goal MUST remain in focus even if its status is changed to `completed` or `cancelled` in the UI. Implements FR9 of add-goal-focus.

#### Scenario: Focused goal is soft-deleted
- **WHEN** a focused goal is marked `is_deleted = true`
- **THEN** goal is removed from focus, remaining goal shifts to `focused_goal_1`, goal disappears from navigation

#### Scenario: Focused goal is completed (after save)
- **WHEN** a focused goal's status is saved as `completed` in IndexedDB (user clicked "Save" in edit mode, or status was changed via sync/API)
- **THEN** goal is removed from focus, remaining goal shifts to `focused_goal_1`, goal disappears from navigation

#### Scenario: Focused goal is cancelled (after save)
- **WHEN** a focused goal's status is saved as `cancelled` in IndexedDB (user clicked "Save" in edit mode, or status was changed via sync/API)
- **THEN** goal is removed from focus, remaining goal shifts to `focused_goal_1`, goal disappears from navigation

#### Scenario: Both focused goals become invalid simultaneously
- **WHEN** both focused goals are deleted/completed/cancelled
- **THEN** `focused_goal_1=""`, `focused_goal_2=""`, block disappears from navigation

#### Scenario: Status changed to completed/cancelled during editing (not saved yet)
- **WHEN** user opens edit mode for a focused goal, changes status to `completed` or `cancelled` in the UI, but does NOT click "Save" (still in edit mode)
- **THEN** goal remains in focus, focus icon remains active, goal is still visible in navigation

#### Scenario: Status changed to completed/cancelled, then edit cancelled
- **WHEN** user opens edit mode for a focused goal, changes status to `completed` or `cancelled` in the UI, then clicks "Cancel"
- **THEN** goal remains in focus with its original status, focus icon remains active, goal is still visible in navigation

#### Scenario: Status changed to completed/cancelled, then saved
- **WHEN** user opens edit mode for a focused goal, changes status to `completed` or `cancelled` in the UI, then clicks "Save"
- **THEN** after save completes and status is written to IndexedDB, goal is removed from focus, remaining goal shifts to `focused_goal_1`, goal disappears from navigation

### Requirement: Focus slots have no gaps

System MUST guarantee invariant: `focused_goal_2` cannot have a value when `focused_goal_1` is empty. New goal MUST always be added to `focused_goal_2` (or to `focused_goal_1` if both positions are empty). On any removal, remaining goal MUST shift to `focused_goal_1`. Implements FR1, FR2 of add-goal-focus.

#### Scenario: Invariant maintained after removal from position 1
- **WHEN** `focused_goal_1=A`, `focused_goal_2=B` and A is removed (manually, auto-cleanup, or replacement)
- **THEN** `focused_goal_1=B`, `focused_goal_2=""` (never `focused_goal_1=""`, `focused_goal_2=B`)

#### Scenario: New goal always goes to last position
- **WHEN** user adds a goal with `focused_goal_1` occupied and `focused_goal_2` empty
- **THEN** new goal is written to `focused_goal_2`

### Requirement: Self-healing of corrupted focus data

System MUST validate focused goal values on read. If a value is not a valid UUID v4 or the goal does not exist on the client, the value MUST be cleared to `""`, slots MUST be compacted per the no-gaps invariant, and corrected data MUST be synced to the server. Implements FR11 of add-goal-focus.

#### Scenario: Invalid UUID in focused_goal_1
- **WHEN** `focused_goal_1` contains a non-UUID value (e.g., `"corrupted"`) and `focused_goal_2=B`
- **THEN** `focused_goal_1=B`, `focused_goal_2=""`, corrected values are marked for sync

#### Scenario: Goal not found on client
- **WHEN** `focused_goal_1` contains a valid UUID but no goal with that ID exists in IndexedDB, and `focused_goal_2=B`
- **THEN** `focused_goal_1=B`, `focused_goal_2=""`, corrected values are marked for sync

#### Scenario: Both slots corrupted
- **WHEN** both `focused_goal_1` and `focused_goal_2` contain invalid data
- **THEN** `focused_goal_1=""`, `focused_goal_2=""`, corrected values are marked for sync

#### Scenario: Only focused_goal_1 corrupted
- **WHEN** `focused_goal_1` contains invalid data and `focused_goal_2=B` (valid)
- **THEN** `focused_goal_1=B`, `focused_goal_2=""`, corrected values are marked for sync

#### Scenario: Only focused_goal_2 corrupted
- **WHEN** `focused_goal_1=A` (valid) and `focused_goal_2` contains invalid data
- **THEN** `focused_goal_1=A`, `focused_goal_2=""`, corrected value is marked for sync

### Requirement: Focus state syncs across devices

Focused goals MUST sync across devices via Settings sync (IndexedDB → pull/push). Implements FR8 of add-goal-focus.

#### Scenario: Sync focus to another device
- **WHEN** user adds a goal to focus on device A
- **THEN** after sync, the goal appears in navigation as focused on device B

#### Scenario: Conflict resolution
- **WHEN** user changes focused goals on two devices simultaneously (offline)
- **THEN** on sync, the record with the later `updated_at` wins (last-write-wins)

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
