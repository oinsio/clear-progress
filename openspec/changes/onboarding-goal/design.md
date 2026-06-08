# Onboarding Goal — Design

## Context

Clear Progress has no onboarding. New users see an empty app with no guidance. The proposal (FR1-FR7) defines an onboarding flow that creates a real goal with tasks to teach core interactions. The design must fit into the existing client-first architecture with Dexie, GoalService, TaskService, and i18n.

## Goals / Non-Goals

**Goals:**
- D1: Declarative template that is trivial to extend (FR5, FR6)
- D2: Reuse existing GoalService/TaskService for entity creation (FR4)
- D3: First-launch detection with no visible delay (NFR-P1)

**Non-Goals:**
- No new database tables or schema changes
- No server-side onboarding logic
- No special entity flags — onboarding entities are indistinguishable from user-created ones

## Decisions

### D1: Declarative template with i18n keys

**Decision**: Single `onboardingTemplate.ts` file containing an array of task descriptors with i18n key references and box assignment.

**Rationale**: Adding a new onboarding task = append to array + add i18n keys. No code changes in service/hook/component. Alternatives considered:
- Tasks distributed across feature modules (registry pattern) — rejected as overengineering for 5-15 tasks
- JSON file instead of TS — rejected because TS gives type safety on box values

**Structure**:
```typescript
interface OnboardingTaskTemplate {
  nameKey: string;        // i18n key for task name
  descriptionKey: string; // i18n key for task description
  box: Box;               // "today" | "later" | "done" | "delegated"
}

interface OnboardingTemplate {
  goal: {
    nameKey: string;
    descriptionKey: string;
  };
  tasks: OnboardingTaskTemplate[];
}
```

### D2: Detection via localStorage + DB check

**Decision**: Check `STORAGE_KEYS.ONBOARDING_SHOWN` first (fast path). If absent, query GoalRepository + TaskRepository for any active entities. If both empty — show dialog.

**Rationale**: localStorage check is synchronous and instant. DB check only runs on the first ever load (no flag yet). This satisfies NFR-P1.

**Alternative**: Only localStorage — rejected because clearing browser storage would re-trigger onboarding for existing users. Only DB — rejected because it would trigger for users who declined onboarding and later deleted all their data.

### D3: OnboardingService orchestrates creation

**Decision**: `OnboardingService` with two methods:
- `shouldShowOnboarding(): Promise<boolean>` — detection logic
- `createOnboardingEntities(translate: TFunction): Promise<void>` — creates goal + tasks via existing services

**Rationale**: Service layer keeps logic testable and decoupled from React. It receives GoalService and TaskService via constructor injection, consistent with existing patterns. The `translate` function is passed at call time so that entities are created with the user's current language.

### D4: Hook + Dialog component

**Decision**: `useOnboarding` hook manages state (checking → showing → dismissed). `OnboardingDialog` is a pure presentational component. Dialog renders inside App.tsx after providers are mounted (needs i18n and DB access).

**Rationale**: Hook handles async detection logic. Dialog is a standard modal using existing UI patterns (focus trap, accessible). Placement after providers ensures i18n and services are available.

## Risks / Trade-offs

- [Risk] User clears localStorage but keeps DB → onboarding won't re-show (DB not empty) → **Acceptable**: flag is a secondary check, DB presence is the primary signal
- [Risk] Language changes after onboarding creation → task names stay in original language → **Acceptable**: entities are snapshots, same as any user-created entity
- [Trade-off] No versioning of onboarding content — existing users never see updates → **Acceptable per requirements**: onboarding targets new users only
