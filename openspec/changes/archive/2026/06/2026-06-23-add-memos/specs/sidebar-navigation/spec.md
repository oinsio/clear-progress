## MODIFIED Requirements

### Requirement: Mode selection changes active filter

Clicking a filter item SHALL navigate to its route if one is defined. For items without a route (focused_goals only), clicking SHALL toggle the active mode. The active mode SHALL be visually distinguished with `bg-white/20`. All task-related modes (inbox, tasks, completed) and content modes (goals, ideas, contexts, categories, deleted, memos) MUST have routes defined. Implements FR1, FR2 of add-memos.

#### Scenario: Clicking inbox navigates to inbox page
- **WHEN** user clicks the "inbox" filter item
- **THEN** app navigates to "/inbox"

#### Scenario: Clicking tasks navigates to active tasks page
- **WHEN** user clicks the "tasks" filter item
- **THEN** app navigates to "/tasks"

#### Scenario: Clicking completed navigates to completed page
- **WHEN** user clicks the "completed" filter item
- **THEN** app navigates to "/completed"

#### Scenario: Active mode highlighted based on current route
- **WHEN** user is on "/inbox"
- **THEN** the "inbox" filter item has `aria-pressed="true"`

#### Scenario: Clicking memos navigates to memos page
- **WHEN** user clicks the "memos" filter item
- **THEN** app navigates to "/memos"

#### Scenario: Memos mode highlighted when on memos route
- **WHEN** user is on "/memos"
- **THEN** the "memos" filter item has `aria-pressed="true"`

### Requirement: Filter items with routes navigate instead of toggling

Filter items that have a `route` property (inbox, tasks, completed, goals, ideas, contexts, categories, deleted, memos) SHALL navigate to that route when clicked, instead of toggling the mode. Only focused_goals remains without a route. Implements FR1, FR2 of add-memos.

#### Scenario: Clicking memos navigates to memos page
- **WHEN** user clicks the "memos" filter item
- **THEN** app navigates to the memos route "/memos"

#### Scenario: Clicking inbox navigates to inbox page
- **WHEN** user clicks the "inbox" filter item
- **THEN** app navigates to the inbox route "/inbox"

#### Scenario: Clicking goals navigates to goals page
- **WHEN** user clicks the "goals" filter item
- **THEN** app navigates to the goals route

#### Scenario: Clicking contexts navigates to contexts page
- **WHEN** user clicks the "contexts" filter item
- **THEN** app navigates to the contexts route
