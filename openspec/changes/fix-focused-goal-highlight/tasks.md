## 1. UI: Component props and highlight logic

- [ ] 1.1 Add `isActive` prop to `FocusedGoalNavItem` with highlight styling for both expanded and collapsed states (FR1, FR6, NFR-A1)
- [ ] 1.2 Add `activeGoalId?: string` prop to `FocusedGoalsBlock`, derive `isActive` per item and pass to `FocusedGoalNavItem` (FR1, FR6)
- [ ] 1.3 Add `activeFocusedGoalId?: string` prop to `RightFilterPanel`, pass to `FocusedGoalsBlock` as `activeGoalId` (FR1)
- [ ] 1.4 Update `GoalDetailPage` to compute `isFocusedGoal` and `isFocusedGoalsVisible`, pass conditional `mode` and `activeFocusedGoalId` to `RightFilterPanel` (FR1, FR2, FR3, FR5)

## 2. Verification

- [ ] 2.1 Verify build passes (`pnpm run build`)
- [ ] 2.2 Run existing goal_focus BDD tests to ensure no regressions (`pnpm test`)
- [ ] 2.3 Manual verification: navigate to focused goal page, confirm highlight; toggle focus on/off, confirm reactive switch; hide focused_goals in menu, confirm fallback
