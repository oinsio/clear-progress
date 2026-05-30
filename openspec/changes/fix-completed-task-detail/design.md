## Context

In `useTaskSelection` (lines 58-60) there is a check: if Focus Mode is enabled and the selected task is completed, `selectedTaskId` is reset to `null`. This was intended as part of Focus Mode — to hide completed tasks from attention. However, it completely blocks viewing and editing completed tasks, which is a bug.

Focus Mode is enabled by default (`DEFAULT_FOCUS_MODE = true`).

## Goals / Non-Goals

**Goals:**
- Remove the block on opening completed tasks (FR1, FR2)

**Non-Goals:**
- Changing Focus Mode visual behavior (opacity) (NG1)

## Decisions

### D1: Remove `is_completed` check in useEffect

**Decision**: Remove lines 58-60 in `useTaskSelection.ts`.

**Rationale**: Focus Mode should only affect visual presentation (task opacity), not the ability to interact. Selection blocking is a side effect that does not match the purpose of Focus Mode.

**Alternative**: Add an `allowCompletedSelection` prop — rejected because there is no scenario where blocking completed task selection is needed.

## Risks / Trade-offs

- **[Minimal]** Some tests may verify the current (buggy) behavior → update tests.
