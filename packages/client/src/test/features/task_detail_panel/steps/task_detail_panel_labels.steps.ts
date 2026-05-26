// implements FR4, FR5, FR6, FR7, FR8, FR9 of task-detail-panel-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { useTaskEditLabels } from "@/hooks/useTaskEditLabels";
import { buildCategory } from "@/test/factories/categoryFactory";
import { buildContext } from "@/test/factories/contextFactory";
import { buildGoal } from "@/test/factories/goalFactory";
import type { Category, Context, Goal } from "@/types/entities";

const feature = await loadFeature("../task_detail_panel_labels.feature");

type FeatureContext = Record<string, never>;

interface ChecklistProgress {
  completed: number;
  total: number;
}

const EMPTY_PROGRESS: ChecklistProgress = { completed: 0, total: 0 };

function renderLabels(params: {
  goalId?: string;
  contextId?: string;
  categoryId?: string;
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  progress?: ChecklistProgress;
}) {
  const { result } = renderHook(() =>
    useTaskEditLabels(
      params.goalId ?? "",
      params.contextId ?? "",
      params.categoryId ?? "",
      params.goals ?? [],
      params.contexts ?? [],
      params.categories ?? [],
      params.progress ?? EMPTY_PROGRESS,
    ),
  );
  return result.current;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let goals: Goal[];
    let contexts: Context[];
    let categories: Category[];
    let progress: ChecklistProgress;
    let labels: ReturnType<typeof renderLabels>;

    f.BeforeEachScenario(() => {
      goals = [];
      contexts = [];
      categories = [];
      progress = EMPTY_PROGRESS;
    });

    // @task-detail-panel-spec @FR4
    f.Scenario("Goal name resolved from ID", ({ Given, When, Then }) => {
      Given(
        'goals contain a goal with id "g1" and name "Learn piano"',
        (_ctx: TestContext) => {
          goals = [buildGoal({ id: "g1", name: "Learn piano" })];
        },
      );

      When(
        'useTaskEditLabels is called with selectedGoalId "g1"',
        (_ctx: TestContext) => {
          labels = renderLabels({ goalId: "g1", goals });
        },
      );

      Then('selectedGoalName is "Learn piano"', (_ctx: TestContext) => {
        expect(labels.selectedGoalName).toBe("Learn piano");
      });
    });

    // @task-detail-panel-spec @FR7
    f.Scenario("No goal selected shows fallback", ({ When, Then }) => {
      When(
        'useTaskEditLabels is called with selectedGoalId ""',
        (_ctx: TestContext) => {
          labels = renderLabels({ goalId: "" });
        },
      );

      Then("selectedGoalName is the no-goal fallback", (_ctx: TestContext) => {
        expect(labels.selectedGoalName).toBe("Без цели");
      });
    });

    // @task-detail-panel-spec @FR5
    f.Scenario("Context name resolved from ID", ({ Given, When, Then }) => {
      Given(
        'contexts contain a context with id "c1" and name "@Home"',
        (_ctx: TestContext) => {
          contexts = [buildContext({ id: "c1", name: "@Home" })];
        },
      );

      When(
        'useTaskEditLabels is called with selectedContextId "c1"',
        (_ctx: TestContext) => {
          labels = renderLabels({ contextId: "c1", contexts });
        },
      );

      Then('selectedContextName is "@Home"', (_ctx: TestContext) => {
        expect(labels.selectedContextName).toBe("@Home");
      });
    });

    // @task-detail-panel-spec @FR7
    f.Scenario("No context selected shows fallback", ({ When, Then }) => {
      When(
        'useTaskEditLabels is called with selectedContextId ""',
        (_ctx: TestContext) => {
          labels = renderLabels({ contextId: "" });
        },
      );

      Then(
        "selectedContextName is the no-context fallback",
        (_ctx: TestContext) => {
          expect(labels.selectedContextName).toBe("Без контекста");
        },
      );
    });

    // @task-detail-panel-spec @FR6
    f.Scenario("Category name resolved from ID", ({ Given, When, Then }) => {
      Given(
        'categories contain a category with id "cat1" and name "Work"',
        (_ctx: TestContext) => {
          categories = [buildCategory({ id: "cat1", name: "Work" })];
        },
      );

      When(
        'useTaskEditLabels is called with selectedCategoryId "cat1"',
        (_ctx: TestContext) => {
          labels = renderLabels({ categoryId: "cat1", categories });
        },
      );

      Then('selectedCategoryName is "Work"', (_ctx: TestContext) => {
        expect(labels.selectedCategoryName).toBe("Work");
      });
    });

    // @task-detail-panel-spec @FR7
    f.Scenario("No category selected shows fallback", ({ When, Then }) => {
      When(
        'useTaskEditLabels is called with selectedCategoryId ""',
        (_ctx: TestContext) => {
          labels = renderLabels({ categoryId: "" });
        },
      );

      Then(
        "selectedCategoryName is the no-category fallback",
        (_ctx: TestContext) => {
          expect(labels.selectedCategoryName).toBe("Без категории");
        },
      );
    });

    // @task-detail-panel-spec @FR8
    f.Scenario("Checklist label shows progress", ({ Given, When, Then }) => {
      Given(
        "checklist progress is 2 completed out of 5 total",
        (_ctx: TestContext) => {
          progress = { completed: 2, total: 5 };
        },
      );

      When(
        "useTaskEditLabels is called with this progress",
        (_ctx: TestContext) => {
          labels = renderLabels({ progress });
        },
      );

      Then('checklistTabLabel contains "2" and "5"', (_ctx: TestContext) => {
        expect(labels.checklistTabLabel).toContain("2");
        expect(labels.checklistTabLabel).toContain("5");
      });
    });

    // @task-detail-panel-spec @FR9
    f.Scenario("Checklist label without progress", ({ Given, When, Then }) => {
      Given("checklist progress is 0 total", (_ctx: TestContext) => {
        progress = { completed: 0, total: 0 };
      });

      When(
        "useTaskEditLabels is called with this progress",
        (_ctx: TestContext) => {
          labels = renderLabels({ progress });
        },
      );

      Then(
        "checklistTabLabel is the plain checklist label",
        (_ctx: TestContext) => {
          expect(labels.checklistTabLabel).toBe("Чек-лист");
        },
      );
    });
  },
);
