## Context

`useFilterBarPosition` uses a dynamic `platformDefault` based on `useIsDesktop()`, but unlike `usePanelSide`, it does not persist this default to localStorage on first visit. This means the default shifts when viewport width changes between sessions.

`usePanelSide` already solves this with a lock-in pattern (lines 24-26): on first visit, it writes the platform default to localStorage so it becomes stable.

## Goals / Non-Goals

**Goals:**
- Apply the same lock-in pattern from `usePanelSide` to `useFilterBarPosition` (FR1, FR2)

**Non-Goals:**
- Changing the lock-in pattern itself or extracting a shared abstraction (NG2)
- Modifying default values for desktop/mobile (NG1)

## Decisions

### D1: Copy the lock-in pattern from usePanelSide

Add a `localStorage.getItem` / `setItem` guard before `usePreference` in `useFilterBarPosition`, identical to `usePanelSide:24-26`.

**Rationale**: The pattern is 3 lines, well-tested in `usePanelSide`, and directly addresses the bug. Extracting a shared helper would be premature — only two hooks use this pattern.

**Alternative considered**: Making `usePreference` support a `lockOnFirstVisit` option. Rejected — adds complexity to a general-purpose hook for a niche need.

## Risks / Trade-offs

- [Risk: User stuck on wrong default] If a user first opens on the "wrong" platform (e.g. desktop but prefers bottom), they must go to settings to change it. → This matches existing sidebar behavior and is the intended UX.
