## 1. UI: Component props and highlight logic

- [x] 1.1 Add `isActive` prop to `FocusedGoalNavItem` with highlight styling for both expanded and collapsed states (FR1, FR6, NFR-A1)
- [x] 1.2 Add `activeGoalId?: string` prop to `FocusedGoalsBlock`, derive `isActive` per item and pass to `FocusedGoalNavItem` (FR1, FR6)
- [x] 1.3 Add `activeFocusedGoalId?: string` prop to `RightFilterPanel`, pass to `FocusedGoalsBlock` as `activeGoalId` (FR1)
- [x] 1.4 Update `GoalDetailPage` to compute `isFocusedGoal` and `isFocusedGoalsVisible`, pass conditional `mode` and `activeFocusedGoalId` to `RightFilterPanel` (FR1, FR2, FR3, FR5)

## 2. Verification

- [x] 2.1 Verify build passes (`pnpm run build`)
- [x] 2.2 Run existing goal_focus BDD tests to ensure no regressions (`pnpm test`)
- [x] 2.3 Manual verification: navigate to focused goal page, confirm highlight; toggle focus on/off, confirm reactive switch; hide focused_goals in menu, confirm fallback

## 3. Testing

- [x] 3.1 Add 5 new scenarios to goal_focus_navigation.feature (FR1, FR2, FR3, FR5, FR6)
- [x] 3.2 Extend FeatureContext with currentGoalId, rightPanelMode, activeFocusedGoalId
- [x] 3.3 Add computeRightPanelState() helper function
- [x] 3.4 Implement new Given/When/Then step definitions
- [x] 3.5 Run tests: `pnpm test goal_focus_navigation` — verify all 9 scenarios pass
- [x] 3.6 Run full test suite: `pnpm test` — verify no regressions
