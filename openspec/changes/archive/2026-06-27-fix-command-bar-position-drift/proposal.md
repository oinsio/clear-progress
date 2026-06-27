# Fix command bar position drift on viewport change

## Problem

When a user opens the app for the first time on a wide (desktop) viewport, the command bar correctly appears at the top (`DESKTOP_FILTER_BAR_POSITION = "top"`). If the user then closes the app, resizes the browser to a narrow (mobile) viewport, and reopens — the command bar jumps to the bottom (`MOBILE_FILTER_BAR_POSITION = "bottom"`), even though the user never explicitly changed the setting.

The sidebar (`usePanelSide`) already solves this by persisting the platform default to localStorage on the very first visit, so subsequent viewport changes don't affect the stored value. The command bar (`useFilterBarPosition`) lacks this lock-in.

## Goals

- **G1**: Command bar position must not change due to viewport size changes when the user has not explicitly chosen a position.

## Non-goals

- **NG1**: Changing the default positions themselves (top for desktop, bottom for mobile).
- **NG2**: Making the command bar reactively follow viewport width — the fix deliberately prevents this.

## Functional Requirements

- **FR1**: On the first visit (no `filter_bar_position` key in localStorage), `useFilterBarPosition` must persist the current platform default to localStorage before returning it.
- **FR2**: On subsequent visits, the stored value must be used regardless of current viewport width.

## UX Acceptance Criteria

- **UX1**: A user who first opens the app on desktop sees the command bar at the top; resizing to mobile width does not move it.
- **UX2**: A user who first opens the app on mobile sees the command bar at the bottom; resizing to desktop width does not move it.
- **UX3**: Explicit position change via settings still works and overrides the locked-in value.

## Success Metrics

- **M1**: `useFilterBarPosition` has the same lock-in pattern as `usePanelSide` — verified by unit tests.
- **M2**: Mutation score on `useFilterBarPosition.ts` stays >= 95%.
