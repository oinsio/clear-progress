## Context

The sidebar menu order is defined by `DEFAULT_MENU_MODE_ORDER` array in `packages/client/src/stores/menuOrderStore.ts`. This constant drives `DEFAULT_MENU_ORDER` which sets initial visibility. The order is persisted to localStorage on first use; existing users retain their saved order. Driven by FR1, FR2, FR3 from proposal.

## Goals / Non-Goals

**Goals:**
- Change the default array values to the new order
- Update tests that assert on the default order

**Non-Goals:**
- No migration logic for existing users
- No changes to menu rendering, persistence, or reactivity

## Decisions

**Decision: Change only the constant, no migration**

The `loadMenuOrder()` function already handles missing modes by appending them. Existing users have their order in localStorage and won't be affected. New users get the new default. No migration code needed.

Alternatives considered:
- Force-reset all users to new order — rejected, would override user customizations
- Add a version flag to detect and migrate — rejected, unnecessary complexity for a default value change

## Risks / Trade-offs

- [Risk] Tests that hardcode the old default order will fail → Mitigation: update them as part of the change
- [Risk] Existing spec scenario "Default menu order includes memos before deleted" references old positioning → Mitigation: update delta spec to reflect new order
