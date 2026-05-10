---
paths:
  - "**/*_unit.feature"
  - "**/*.feature"
  - "**/steps/*.steps.ts"
  - "**/test/features/**"
  - "vitest.config.ts"
---

# Rule: Unit BDD conventions (vitest-cucumber)

Use **@amiceli/vitest-cucumber** for verifying business logic (domain, application layer) through executable Gherkin specifications without a real browser.

## File Structure

```
packages/client/src/test/features/
└── <feature_name>/
    ├── <feature_name>_<aspect>.feature       # Gherkin specification
    ├── <feature_name>_<aspect>_unit.feature   # (if paired with e2e)
    └── steps/
        └── <feature_name>_<aspect>.steps.ts   # Step definitions (vitest)
```

Example for goal_focus:
```
goal_focus/
├── goal_focus_add_remove.feature
├── goal_focus_auto_removal.feature
├── goal_focus_data_integrity.feature
├── goal_focus_navigation.feature
├── goal_focus_replacement.feature
├── goal_focus_nfr_unit.feature
├── goal_focus_nfr_e2e.feature          # (paired — for playwright-bdd)
└── steps/
    ├── goal_focus_add_remove.steps.ts
    ├── goal_focus_auto_removal.steps.ts
    ├── goal_focus_data_integrity.steps.ts
    ├── goal_focus_navigation.steps.ts
    ├── goal_focus_replacement.steps.ts
    └── goal_focus_nfr_unit.steps.ts
```

## File Naming

- Feature: `<feature>_<aspect>.feature` — snake_case, describes a behavior aspect
- Steps: `<feature>_<aspect>.steps.ts` — one steps file per feature file
- The `_unit` suffix is added only when a paired `_e2e` file exists for the same aspect

## Step Definition Pattern

```typescript
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../<feature_name>.feature");

type FeatureContext = {
  // Typed context for sharing data between steps
};

describeFeature(feature, (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
  // Repositories — real, working with fake-indexeddb
  const goalRepository = new GoalRepository();

  f.BeforeEachScenario(async () => {
    await db.goals.clear();
    await db.settings.clear();
  });

  f.Background(({ Given }) => {
    Given("goals exist:", async (_ctx: TestContext, table) => {
      // Seed data from DataTable
    });
  });

  // @<change-name> @FR-X
  f.Scenario("Scenario name from feature", ({ Given, When, Then, And }) => {
    Given("...", async (_ctx: TestContext) => { /* ... */ });
    When("...", async (_ctx: TestContext) => { /* ... */ });
    Then("...", async (_ctx: TestContext) => { /* ... */ });
  });
});
```

## Key Rules

1. **Real repositories** — use actual GoalRepository, SettingsRepository with fake-indexeddb, not mocks
2. **Cleanup before each scenario** — `BeforeEachScenario` clears tables via `db.<table>.clear()`
3. **DataTable** — Background seeds data from Gherkin tables through factories (`buildGoal`, etc.)
4. **Typed context** — `FeatureContext` for passing data between steps
5. **Tag comment** — before `f.Scenario` add comment `// @<change-name> @FR-X`
6. **loadFeature with relative path** — `await loadFeature("../<feature>.feature")`

## Traceability

- Tags in Gherkin: `@<change-name> @FR-X` above each Scenario
- Comment in steps: `// @<change-name> @FR-X` before `f.Scenario`
- Scenario name in steps **must exactly match** the feature file

## Running

```bash
pnpm test              # All unit tests including *.steps.ts
pnpm test:watch        # Watch mode
```

Vitest picks up steps files via the pattern `src/**/*.steps.{ts,tsx}` in `vitest.config.ts`.

## When to Use Unit BDD vs E2E BDD

| Aspect                        | Unit BDD (vitest-cucumber) | E2E BDD (playwright-bdd) |
|-------------------------------|----------------------------|--------------------------|
| Business logic (CRUD, rules)  | yes                        | no                       |
| Data operations (IndexedDB)   | yes                        | no                       |
| Performance (operation time)  | yes (performance.now)      | no                       |
| Keyboard accessibility        | no                         | yes                      |
| aria-labels, focus management | no                         | yes                      |
| Responsive layout             | no                         | yes                      |
| CSS animations, transitions   | no                         | yes                      |
| Navigation (URL, routing)     | partially (mock)           | yes                      |

## Dependencies

- `@amiceli/vitest-cucumber` (devDependency)
- `fake-indexeddb` (devDependency) — for real repositories in tests
- Factories: `src/test/factories/` (`buildGoal`, `buildTask`, etc.)
