// implements FR1, FR2, FR3 of task-detail-panel-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext } from "vitest";
import { useTaskFormState } from "@/hooks/useTaskFormState";
import { buildTask } from "@/test/factories/taskFactory";
import type { RepeatRule } from "@/types/common";
import type { Task } from "@/types/entities";
import { serializeRepeatRule } from "@/utils/repeatRule";

const feature = await loadFeature("../task_detail_panel_form_state.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let task: Task;
    let hookResult: ReturnType<typeof useTaskFormState>;

    f.BeforeEachScenario(() => {
      task = buildTask();
    });

    // @task-detail-panel-spec @FR1
    f.Scenario(
      "All fields initialized from task",
      ({ Given, And, When, Then }) => {
        Given(
          'a task with name "Buy groceries" and description "Milk and eggs"',
          (_ctx: TestContext) => {
            task = buildTask({
              name: "Buy groceries",
              description: "Milk and eggs",
            });
          },
        );

        And(
          'the task has box "today", goal_id "g1", context_id "c1", category_id "cat1"',
          (_ctx: TestContext) => {
            task = buildTask({
              ...task,
              box: "today",
              goal_id: "g1",
              context_id: "c1",
              category_id: "cat1",
            });
          },
        );

        When(
          "useTaskFormState is initialized with this task",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useTaskFormState(task));
            hookResult = result.current;
          },
        );

        Then('the form name is "Buy groceries"', (_ctx: TestContext) => {
          expect(hookResult.name).toBe("Buy groceries");
        });

        And('the form description is "Milk and eggs"', (_ctx: TestContext) => {
          expect(hookResult.description).toBe("Milk and eggs");
        });

        And('the selected box is "today"', (_ctx: TestContext) => {
          expect(hookResult.selectedBox).toBe("today");
        });

        And('the selected goal ID is "g1"', (_ctx: TestContext) => {
          expect(hookResult.selectedGoalId).toBe("g1");
        });

        And('the selected context ID is "c1"', (_ctx: TestContext) => {
          expect(hookResult.selectedContextId).toBe("c1");
        });

        And('the selected category ID is "cat1"', (_ctx: TestContext) => {
          expect(hookResult.selectedCategoryId).toBe("cat1");
        });
      },
    );

    // @task-detail-panel-spec @FR1
    f.Scenario(
      "Empty optional fields initialized as empty strings",
      ({ Given, When, Then, And }) => {
        Given(
          "a task with empty goal_id, context_id, and category_id",
          (_ctx: TestContext) => {
            task = buildTask({
              goal_id: "",
              context_id: "",
              category_id: "",
            });
          },
        );

        When(
          "useTaskFormState is initialized with this task",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useTaskFormState(task));
            hookResult = result.current;
          },
        );

        Then('the selected goal ID is ""', (_ctx: TestContext) => {
          expect(hookResult.selectedGoalId).toBe("");
        });

        And('the selected context ID is ""', (_ctx: TestContext) => {
          expect(hookResult.selectedContextId).toBe("");
        });

        And('the selected category ID is ""', (_ctx: TestContext) => {
          expect(hookResult.selectedCategoryId).toBe("");
        });
      },
    );

    // @task-detail-panel-spec @FR3
    f.Scenario("Repeat rule parsed from task", ({ Given, When, Then, And }) => {
      Given("a task with a daily repeat rule", (_ctx: TestContext) => {
        const repeatRule: RepeatRule = {
          type: "fixed",
          frequency: "daily",
          interval: 1,
          target_box: "today",
          advance_days: 0,
        };
        task = buildTask({
          repeat_rule: serializeRepeatRule(repeatRule),
        });
      });

      When(
        "useTaskFormState is initialized with this task",
        (_ctx: TestContext) => {
          const { result } = renderHook(() => useTaskFormState(task));
          hookResult = result.current;
        },
      );

      Then(
        'the selected repeat rule has frequency "daily"',
        (_ctx: TestContext) => {
          const rule = hookResult.selectedRepeatRule;
          expect(rule).not.toBeNull();
          expect(rule?.type).toBe("fixed");
          if (rule?.type === "fixed") {
            expect(rule?.frequency).toBe("daily");
          }
        },
      );

      And('the selected repeat rule has type "fixed"', (_ctx: TestContext) => {
        expect(hookResult.selectedRepeatRule?.type).toBe("fixed");
      });
    });

    // @task-detail-panel-spec @FR3
    f.Scenario("Empty repeat rule results in null", ({ Given, When, Then }) => {
      Given("a task with empty repeat_rule", (_ctx: TestContext) => {
        task = buildTask({ repeat_rule: "" });
      });

      When(
        "useTaskFormState is initialized with this task",
        (_ctx: TestContext) => {
          const { result } = renderHook(() => useTaskFormState(task));
          hookResult = result.current;
        },
      );

      Then("the selected repeat rule is null", (_ctx: TestContext) => {
        expect(hookResult.selectedRepeatRule).toBeNull();
      });
    });

    // @task-detail-panel-spec @FR2
    f.Scenario(
      "Setter functions are returned",
      ({ Given, When, Then, And }) => {
        Given("a task with default values", (_ctx: TestContext) => {
          task = buildTask();
        });

        When(
          "useTaskFormState is initialized with this task",
          (_ctx: TestContext) => {
            const { result } = renderHook(() => useTaskFormState(task));
            hookResult = result.current;
          },
        );

        Then("setName is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setName).toBe("function");
        });

        And("setDescription is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setDescription).toBe("function");
        });

        And("setSelectedGoalId is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setSelectedGoalId).toBe("function");
        });

        And("setSelectedContextId is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setSelectedContextId).toBe("function");
        });

        And("setSelectedCategoryId is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setSelectedCategoryId).toBe("function");
        });

        And("setSelectedBox is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setSelectedBox).toBe("function");
        });

        And("setSelectedRepeatRule is a function", (_ctx: TestContext) => {
          expect(typeof hookResult.setSelectedRepeatRule).toBe("function");
        });
      },
    );
  },
);
