## 1. BDD Specification

- [x] 1.1 Write/update feature file for "Status changed during editing" scenarios from goal-focus spec (FR1, FR3)
- [x] 1.2 Write step definitions for new/updated scenarios (FR1, FR2, FR3)
- [x] 1.3 Ensure tests fail (RED) — current implementation doesn't match specification

## 2. Implementation — GoalDetailPage

- [x] 2.1 Add `editStatus` to component local state, initialize when entering edit mode (FR1)
- [x] 2.2 Change `handleStatusChange` — in edit mode update only `editStatus`, don't write to DB (FR1)
- [x] 2.3 Change `activeStatus` — in edit mode use `editStatus`, in view mode — `goal.status` (FR1)
- [x] 2.4 Include `status: editStatus` in `updateGoal()` call in `handleSave` (FR2)
- [x] 2.5 Ensure `handleCancelEdit` correctly resets edit mode without saving status (FR3)

## 3. Verification

- [x] 3.1 Ensure all BDD tests pass (GREEN)
- [x] 3.2 Ensure existing goal_focus_auto_removal tests are not broken
- [x] 3.3 Run mutation testing, achieve score ≥ 95%
- [x] 3.4 Check build (`pnpm run build`)
- [x] 3.5 Check JetBrains MCP diagnostics for changed files
