# Onboarding Goal

## Why

New users open the app and see an empty screen with no guidance. There is no onboarding — users must figure out the interface on their own. A guided introduction through the app's own goal/task system teaches by doing and demonstrates core mechanics immediately.

## What Changes

- ADDED: Modal dialog on first launch offering onboarding
- ADDED: Declarative onboarding template with i18n keys and per-task box configuration
- ADDED: Service to detect first launch and create onboarding goal + tasks
- ADDED: Localized onboarding content (ru/en)

## Goals

- G1: New users understand core interactions (complete, edit, navigate) within 5 minutes
- G2: Onboarding uses the app's own entities — no separate tutorial system

## Non-Goals

- NG1: Interactive step-by-step tour with tooltips or highlights
- NG2: Onboarding for returning users or after data reset
- NG3: Analytics or tracking of onboarding completion

## Users & Scenarios

- U1: First-time user — opens app, sees onboarding dialog, accepts, gets goal with tasks
- U2: First-time user — opens app, sees onboarding dialog, declines, starts with empty app
- U3: Existing user — never sees onboarding dialog (localStorage flag or non-empty DB)

## Requirements

### Functional

- FR1: Show modal dialog on first app launch (no localStorage flag AND empty DB)
- FR2: "Start" action creates a goal "Onboarding" (status: active) with predefined tasks
- FR3: "Skip" action sets localStorage flag without creating any entities
- FR4: Onboarding goal and tasks are regular entities — sync, edit, delete as usual
- FR5: Onboarding template is declarative — i18n keys, configurable box per task
- FR6: Template is extensible — adding a task = new entry in array + i18n keys
- FR7: Set localStorage flag after both "Start" and "Skip" to prevent re-showing

### Non-Functional

#### Performance

- NFR-P1: First-launch detection completes in under 100ms — no visible delay before dialog

#### Accessibility

- NFR-A1: Dialog is accessible — focus trap, Escape to close, screen reader labels
- NFR-A2: Both actions reachable via keyboard (Tab + Enter)

#### Responsive

- NFR-R1: Dialog renders correctly on mobile (320px) through desktop (2560px)

## Onboarding Content

| #         | Text (ru)                                                                                                             | Box   |
|-----------|-----------------------------------------------------------------------------------------------------------------------|-------|
| Goal      | **Ознакомиться с Clear Progress**                                                                                     | —     |
| Goal desc | Выполните задачи ниже, чтобы познакомиться с основными возможностями приложения. После ознакомления удалите эту цель. | —     |
| Task 1    | Проведите по задаче вправо (свайп) или отметьте галочкой для завершения                                               | today |
| Task 2    | Нажмите на задачу для её быстрого редактирования                                                                      | later |
| Task 3    | Для открытия окна редактирования задачи нажмите на неё и держите                                                      | later |
| Task 4    | Проверьте настройки в основном меню в боковой панели                                                                  | later |
| Task 5    | Включите/выключите нужные пункты меню в настройках                                                                    | later |

English translations will be added to `en.json` during implementation (task 1.4).

## UX Acceptance Criteria

- UX1: Dialog appears over empty app shell — user sees the app behind the modal
- UX2: Dialog has clear title, brief explanation, and two actions (skip / start)
- UX3: After accepting, user lands on the main page with onboarding goal visible
- UX4: Onboarding tasks are indistinguishable from regular tasks in behavior

## UI States Matrix

| State                 | Network | Data              | UI                           |
|-----------------------|---------|-------------------|------------------------------|
| First launch          | any     | empty DB, no flag | Show onboarding dialog       |
| Returning user        | any     | flag exists       | No dialog                    |
| Non-empty DB, no flag | any     | has entities      | Set flag silently, no dialog |

## Behavior

Scenarios defined in `features/onboarding.feature` with `@onboarding-goal` tags.

## Visual Reference

No Figma — standard dialog component from existing design system.

## Affected IA

No IA changes — onboarding goal appears in existing Goals list.

## Success Metrics

- M1: 100% of first-time users see the onboarding dialog
- M2: Onboarding goal + tasks created correctly with proper i18n in both languages
- M3: Template extensible — new task addable without code changes beyond template + i18n

## Open Questions

None.

## Capabilities

### New Capabilities

- `onboarding`: First-launch detection, onboarding dialog, declarative template, goal+task creation

### Modified Capabilities

None.

## Impact

- `packages/client` — new service, hook, component, template, constants, i18n keys
- `STORAGE_KEYS` — new key `ONBOARDING_SHOWN`
- `ru.json` / `en.json` — new `onboarding.*` namespace
