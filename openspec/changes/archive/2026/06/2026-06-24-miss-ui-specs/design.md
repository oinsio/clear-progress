## Context

ErrorFallback and GoalCoverPicker are two UI components implemented in code without OpenSpec specifications. Both components are stable and covered by unit tests (GoalCoverPicker — 7 tests, ErrorFallback — no tests). The goal is to add specs and BDD unit tests without changing the implementation.

## Goals / Non-Goals

**Goals:**
- Create `error-fallback` spec for ErrorFallback + RouteErrorFallback (FR1-FR3)
- Extend `goal-detail-card` spec with a requirement for GoalCoverPicker UI (FR4-FR8)
- Write BDD unit feature + step definitions for both components

**Non-Goals:**
- Refactoring or changing component behavior
- E2E tests
- Covering server-side cover logic (already in cover-sync-protocol)

## Decisions

### D1: ErrorFallback — separate capability, not part of an existing one

ErrorFallback does not belong to goal-detail-card or task-page-layout. It is an infrastructure error boundary component. Creating a separate `error-fallback` capability.

### D2: GoalCoverPicker — ADDED requirement in goal-detail-card

GoalCoverPicker is used exclusively in GoalDetailCard edit mode. Logically it is part of the goal-detail-card capability. Adding via delta spec as an ADDED requirement.

### D3: BDD unit tests via vitest-cucumber

Both components are presentational React. Testing via vitest-cucumber with `@testing-library/react` — render component and verify behavior.

## Risks / Trade-offs

- [Risk] ErrorFallback is trivial — spec may be excessive → Spec is minimal but ensures traceability
- [Risk] GoalCoverPicker already has 7 unit tests — BDD tests may duplicate → BDD describes behavior at scenario level, existing tests can be removed later
