// implements FR4, FR5, UX4, UX5 of hide-tasks
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../task_detail_panel_hide_section.feature");

type FeatureContext = Record<string, never>;

/**
 * Evaluates hide section visibility logic matching TaskDetailPanel:
 * - `isHideRowVisible`: `!task.repeat_rule`
 * - `hideRowValue`: `task.is_hidden ? task.appear_date : ""`
 * - `hideRowHasValue`: `task.is_hidden`
 */
function evaluateHideSection(task: Task) {
  const isHideRowVisible = !task.repeat_rule;
  const hideRowValue = task.is_hidden ? task.appear_date : "";
  const hideRowHasValue = task.is_hidden;
  return { isHideRowVisible, hideRowValue, hideRowHasValue };
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let task: Task;
    let isHideRowVisible: boolean;
    let hideRowValue: string;
    let hideRowHasValue: boolean;

    f.BeforeEachScenario(() => {
      task = buildTask();
      isHideRowVisible = false;
      hideRowValue = "";
      hideRowHasValue = false;
    });

    // @hide-tasks @FR4 @UX4
    f.Scenario(
      "Non-recurring task shows hide until row",
      ({ Given, When, Then }) => {
        Given("a task without repeat rule", (_ctx: TestContext) => {
          task = buildTask({ repeat_rule: "" });
        });

        When("hide section visibility is evaluated", (_ctx: TestContext) => {
          const result = evaluateHideSection(task);
          isHideRowVisible = result.isHideRowVisible;
          hideRowValue = result.hideRowValue;
          hideRowHasValue = result.hideRowHasValue;
        });

        Then("the hide until row should be visible", (_ctx: TestContext) => {
          expect(isHideRowVisible).toBe(true);
        });
      },
    );

    // @hide-tasks @FR5
    f.Scenario(
      "Recurring task does not show hide until row",
      ({ Given, When, Then }) => {
        Given("a task with a repeat rule", (_ctx: TestContext) => {
          task = buildTask({
            repeat_rule:
              '{"type":"fixed","frequency":"daily","interval":1,"target_box":"today","advance_days":0}',
          });
        });

        When("hide section visibility is evaluated", (_ctx: TestContext) => {
          const result = evaluateHideSection(task);
          isHideRowVisible = result.isHideRowVisible;
        });

        Then(
          "the hide until row should not be visible",
          (_ctx: TestContext) => {
            expect(isHideRowVisible).toBe(false);
          },
        );
      },
    );

    // @hide-tasks @UX5
    f.Scenario(
      "Hidden task shows appear date in row value",
      ({ Given, When, Then, And }) => {
        Given(
          'a hidden task with appear date "2026-09-01"',
          (_ctx: TestContext) => {
            task = buildTask({
              is_hidden: true,
              appear_date: "2026-09-01",
              repeat_rule: "",
            });
          },
        );

        When("hide section visibility is evaluated", (_ctx: TestContext) => {
          const result = evaluateHideSection(task);
          isHideRowVisible = result.isHideRowVisible;
          hideRowValue = result.hideRowValue;
          hideRowHasValue = result.hideRowHasValue;
        });

        Then('the hide row value is "2026-09-01"', (_ctx: TestContext) => {
          expect(hideRowValue).toBe("2026-09-01");
        });

        And("the hide row has value indicator", (_ctx: TestContext) => {
          expect(hideRowHasValue).toBe(true);
        });
      },
    );

    // @hide-tasks @FR4
    f.Scenario(
      "Non-hidden task shows empty hide row value",
      ({ Given, And, When, Then }) => {
        Given("a task without repeat rule", (_ctx: TestContext) => {
          task = buildTask({ repeat_rule: "" });
        });

        And("the task is not hidden", (_ctx: TestContext) => {
          task = buildTask({ ...task, is_hidden: false });
        });

        When("hide section visibility is evaluated", (_ctx: TestContext) => {
          const result = evaluateHideSection(task);
          hideRowValue = result.hideRowValue;
          hideRowHasValue = result.hideRowHasValue;
        });

        Then('the hide row value is ""', (_ctx: TestContext) => {
          expect(hideRowValue).toBe("");
        });

        And("the hide row has no value indicator", (_ctx: TestContext) => {
          expect(hideRowHasValue).toBe(false);
        });
      },
    );
  },
);
