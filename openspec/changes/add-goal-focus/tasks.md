# Tasks: Add Goal Focus

## 1. Contract layer (packages/contract)

- [ ] 1.1 Add `"focused_goals"` to `MenuModeSchema` (FR6)
- [ ] 1.2 Add Settings key constants: `FOCUSED_GOAL_1`, `FOCUSED_GOAL_2` (FR8)
- [ ] 1.3 Add constant `MAX_FOCUSED_GOALS = 2` (FR2)

## 2. Application layer — hook useFocusedGoals

- [ ] 2.1 Create hook `useFocusedGoals` — read `focused_goal_1`/`focused_goal_2` from Settings via liveQuery (FR1, FR8)
- [ ] 2.2 Implement `addGoalToFocus(goalId)` — add goal, return `'added' | 'limit_reached'` (FR1, FR2)
- [ ] 2.3 Implement `removeGoalFromFocus(goalId)` — remove goal from focus (FR10)
- [ ] 2.4 Implement `isGoalFocused(goalId): boolean` (FR1)
- [ ] 2.5 Implement `replaceGoalInFocus(oldGoalId, newGoalId)` — replacement in dialog (FR3)
- [ ] 2.6 Implement auto-cleanup: remove goals with `is_deleted`, `completed`, `cancelled` from focus (FR9)
- [ ] 2.7 Implement self-healing: validate values on read — clear invalid UUID or missing goal, compact slots, mark for sync (FR11)
- [ ] 2.8 Tests for useFocusedGoals — all scenarios from spec (FR1-FR11)

## 3. Navigation — useMenuOrder integration

- [ ] 3.1 Update `DEFAULT_MENU_ORDER` — add `{ mode: "focused_goals", visible: true }` at the end (FR6)
- [ ] 3.2 Add migration in `useMenuOrder`: if `"focused_goals"` is missing from saved menuOrder — add at end (FR6)
- [ ] 3.3 Tests for menuOrder migration

## 4. UI — RightFilterPanel

- [ ] 4.1 Add rendering of `"focused_goals"` block in RightFilterPanel — 0/1/2 navigation items (FR4, FR7)
- [ ] 4.2 Each item: circle with goal's cover image (or default image if no cover) + goal name, click → navigate(`/goals/${goalId}`) (FR5, UX2)
- [ ] 4.3 Support expanded and collapsed panel modes (NFR-R1)
- [ ] 4.4 Add `FILTER_ITEMS` entry for `"focused_goals"` — icon and labelKey for MenuOrderSection (FR6)

## 5. UI — GoalDetailPage

- [ ] 5.1 Add focus toggle icon in GoalDetailPage action bar (FR1, FR10, UX1)
- [ ] 5.2 Icon reflects current state: active/inactive (UX1)
- [ ] 5.3 aria-label for icon: "Add to focus" / "Remove from focus" (NFR-A1, NFR-A2)
- [ ] 5.4 Click handler: toggle focus or show dialog at limit (FR1, FR2, FR3)

## 6. UI — FocusGoalReplacementDialog

- [ ] 6.1 Create replacement dialog component for focused goal (FR3, UX3)
- [ ] 6.2 Show names of current focused goals + 3 actions: replace A, replace B, cancel (UX3)
- [ ] 6.3 Keyboard accessibility for dialog (NFR-A3)
- [ ] 6.4 Tests for dialog

## 7. UI — MenuOrderSection (Settings)

- [ ] 7.1 Update MenuOrderSection — `"focused_goals"` displayed as one draggable element (FR6)
- [ ] 7.2 Add label and icon for `"focused_goals"` in settings list

## 8. Verification

- [ ] 8.1 All unit tests green (useFocusedGoals, menuOrder migration, dialog)
- [ ] 8.2 Mutation testing ≥ 95% on new code
- [ ] 8.3 Component tests: GoalDetailPage focus toggle — add/remove/replace focused goals via UI (FR1, FR2, FR3, FR10)
- [ ] 8.4 Component tests: auto-cleanup — goal removed from navigation on deletion/completion/cancellation (FR9)
- [ ] 8.5 Component tests: keyboard accessibility — Tab/Enter/Space for focus icon and replacement dialog (NFR-A1, NFR-A3)
- [ ] 8.6 Build passes without errors (`pnpm run build`)
- [ ] 8.7 Verify optimistic UI: focus toggle responds immediately without waiting for IndexedDB write (NFR-P1)
- [ ] 8.8 Verify smooth disappearance of goal from navigation on unfocus (no layout jank) (UX4)
