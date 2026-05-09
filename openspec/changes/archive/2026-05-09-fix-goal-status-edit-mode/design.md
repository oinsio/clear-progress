## Context

`GoalDetailPage` manages goal editing. Fields `name` and `description` are stored in local state (`editName`, `editDescription`) and written to DB only when "Save" is pressed. Status (`status`) is handled differently — `handleStatusChange` calls `goalService.updateStatus()` directly, writing to IndexedDB immediately.

`useFocusedGoals` hook implements self-healing with polling every 100ms: if it detects a goal with `completed`/`cancelled` status, it removes it from focus. Due to immediate status write to DB, self-healing triggers before "Save" is pressed.

`activeStatus` is computed as `goal?.status ?? "planning"` — read from liveQuery (DB), not from local state.

## Goals / Non-Goals

**Goals:**
- Align status management in edit mode with name/description pattern (local state → save → DB) (FR1, FR2, FR3)

**Non-Goals:**
- Change self-healing behavior in `useFocusedGoals` — it works correctly
- Change status behavior outside edit mode

## Decisions

### D1: Local state for status in edit mode

Add `editStatus` to `GoalDetailPage` local state, similar to `editName`/`editDescription`.

**Initialization:** when entering edit mode (`handleStartEdit`) — `setEditStatus(goal.status)`.

**Usage:** `activeStatus` in edit mode is taken from `editStatus`, in view mode — from `goal.status`.

**Saving:** `handleSave` includes `status: editStatus` in `updateGoal()` call.

**Cancellation:** `handleCancelEdit` simply resets `isEditing` — `editStatus` stops being used.

**Alternative:** Block self-healing for goals in edit mode — rejected, as it complicates `useFocusedGoals` and requires cross-component coordination.

### D2: handleStatusChange acts differently depending on mode

- **Edit mode** (`isEditing === true`): `handleStatusChange` updates only `editStatus`, doesn't write to DB
- **View mode** (`isEditing === false`): status buttons are not displayed (current behavior — they are shown only in edit mode), so this case is not relevant

### D3: updateGoal includes status

Current `handleSave` calls `updateGoal({ name, description, cover_file_id })`. After the fix, status is included: `updateGoal({ name, description, cover_file_id, status: editStatus })`.

Method `updateGoalStatus` in `useGoal` hook remains available for cases when status needs to be updated outside edit mode (e.g., via sync), but `GoalDetailPage` stops calling it directly.

## Risks / Trade-offs

**[Risk]** User changes status and leaves the page without saving — status won't be saved.
→ **Mitigation**: This is expected behavior — the same happens with name/description. When leaving the page, edit mode is reset.

**[Risk]** liveQuery updates `goal` object during editing (e.g., via sync), and `editStatus` gets out of sync.
→ **Mitigation**: Similar to current behavior of `editName`/`editDescription` — they also don't update during sync while editing. This is correct: user sees their changes, not external ones.
