// implements FR1, FR2, FR5 of detect-invalid-repeat-rule
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { fakeClock } from "@/lib/temporal";
import { type RecurringResult, TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { isRepeatRuleInvalid } from "@/utils/repeatRule";
import { filterTaskNamesWithInvalidRepeatRules } from "@/utils/repeatRuleValidation";

const feature = await loadFeature("../invalid_repeat_rule_detection.feature");

const VALID_DAILY_RULE = JSON.stringify({
  type: "fixed",
  frequency: "daily",
  interval: 1,
  target_box: "today",
  advance_days: 0,
});

const INVALID_RULE = '{"type":"unknown"}';

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let task: Task;
    let validationResult: boolean;
    let taskService: TaskService;
    let completionResult: {
      completed: Task;
      recurringResult: RecurringResult;
    };
    let pulledTasks: Array<{
      name: string;
      repeat_rule: string;
      is_deleted: boolean;
      is_completed: boolean;
    }>;
    let postPullResult: string[];

    f.BeforeEachScenario(async () => {
      await db.tasks.clear();
      await db.checklist_items.clear();
      const clock = fakeClock("2026-01-15T10:00:00Z");
      taskService = new TaskService(
        new TaskRepository(),
        new ChecklistRepository(),
        clock,
      );
      pulledTasks = [];
      postPullResult = [];
    });

    // @detect-invalid-repeat-rule @FR1
    f.Scenario(
      "Non-empty repeat_rule that fails parsing is detected as invalid",
      ({ Given, When, Then }) => {
        Given(
          'a task with repeat_rule \'{"type":"unknown"}\'',
          (_ctx: TestContext) => {
            task = buildTask({ repeat_rule: INVALID_RULE });
          },
        );

        When("isRepeatRuleInvalid is called", (_ctx: TestContext) => {
          validationResult = isRepeatRuleInvalid(task);
        });

        Then("it returns true", (_ctx: TestContext) => {
          expect(validationResult).toBe(true);
        });
      },
    );

    // @detect-invalid-repeat-rule @FR1
    f.Scenario(
      "Empty repeat_rule is not detected as invalid",
      ({ Given, When, Then }) => {
        Given('a task with repeat_rule ""', (_ctx: TestContext) => {
          task = buildTask({ repeat_rule: "" });
        });

        When("isRepeatRuleInvalid is called", (_ctx: TestContext) => {
          validationResult = isRepeatRuleInvalid(task);
        });

        Then("it returns false", (_ctx: TestContext) => {
          expect(validationResult).toBe(false);
        });
      },
    );

    // @detect-invalid-repeat-rule @FR1
    f.Scenario(
      "Valid repeat_rule is not detected as invalid",
      ({ Given, When, Then }) => {
        Given("a task with a valid daily repeat_rule", (_ctx: TestContext) => {
          task = buildTask({ repeat_rule: VALID_DAILY_RULE });
        });

        When("isRepeatRuleInvalid is called", (_ctx: TestContext) => {
          validationResult = isRepeatRuleInvalid(task);
        });

        Then("it returns false", (_ctx: TestContext) => {
          expect(validationResult).toBe(false);
        });
      },
    );

    // @detect-invalid-repeat-rule @FR2
    f.Scenario(
      "Completing task with invalid repeat_rule returns skipped status",
      ({ Given, When, Then, And }) => {
        Given(
          "an active task with invalid repeat_rule",
          async (_ctx: TestContext) => {
            task = buildTask({
              repeat_rule: INVALID_RULE,
              box: "today",
              next_date: "2026-01-15",
              appear_date: "2026-01-15",
            });
            await db.tasks.add(task);
          },
        );

        When("the task is completed", async (_ctx: TestContext) => {
          completionResult = await taskService.complete(task.id);
        });

        Then(
          'the recurringResult status is "skipped_invalid_rule"',
          (_ctx: TestContext) => {
            expect(completionResult.recurringResult.status).toBe(
              "skipped_invalid_rule",
            );
          },
        );

        And("the task is marked as completed", (_ctx: TestContext) => {
          expect(completionResult.completed.is_completed).toBe(true);
        });
      },
    );

    // @detect-invalid-repeat-rule @FR2
    f.Scenario(
      "Completing task with valid repeat_rule returns created status",
      ({ Given, When, Then }) => {
        Given(
          "an active task with valid daily repeat_rule",
          async (_ctx: TestContext) => {
            task = buildTask({
              repeat_rule: VALID_DAILY_RULE,
              box: "today",
              next_date: "2026-01-15",
              appear_date: "2026-01-15",
            });
            await db.tasks.add(task);
          },
        );

        When("the task is completed", async (_ctx: TestContext) => {
          completionResult = await taskService.complete(task.id);
        });

        Then('the recurringResult status is "created"', (_ctx: TestContext) => {
          expect(completionResult.recurringResult.status).toBe("created");
        });
      },
    );

    // @detect-invalid-repeat-rule @FR2
    f.Scenario(
      "Completing non-recurring task returns not_recurring status",
      ({ Given, When, Then }) => {
        Given(
          "an active task with empty repeat_rule",
          async (_ctx: TestContext) => {
            task = buildTask({
              repeat_rule: "",
              box: "today",
            });
            await db.tasks.add(task);
          },
        );

        When("the task is completed", async (_ctx: TestContext) => {
          completionResult = await taskService.complete(task.id);
        });

        Then(
          'the recurringResult status is "not_recurring"',
          (_ctx: TestContext) => {
            expect(completionResult.recurringResult.status).toBe(
              "not_recurring",
            );
          },
        );
      },
    );

    // @detect-invalid-repeat-rule @FR5
    f.Scenario(
      "Pull diff with invalid repeat rule triggers alert",
      ({ Given, When, Then, And }) => {
        Given(
          'a pulled task "Water plants" with invalid repeat_rule',
          (_ctx: TestContext) => {
            pulledTasks.push({
              name: "Water plants",
              repeat_rule: INVALID_RULE,
              is_deleted: false,
              is_completed: false,
            });
          },
        );

        And("the task is active and incomplete", (_ctx: TestContext) => {
          // Already set in the previous step: is_deleted=false, is_completed=false
          expect(pulledTasks[0].is_deleted).toBe(false);
          expect(pulledTasks[0].is_completed).toBe(false);
        });

        When("the post-pull check runs", (_ctx: TestContext) => {
          postPullResult = filterTaskNamesWithInvalidRepeatRules(pulledTasks);
        });

        Then('the result contains "Water plants"', (_ctx: TestContext) => {
          expect(postPullResult).toContain("Water plants");
        });
      },
    );

    // @detect-invalid-repeat-rule @FR5
    f.Scenario(
      "Deleted task with invalid rule is excluded",
      ({ Given, When, Then, And }) => {
        Given(
          'a pulled task "Deleted task" with invalid repeat_rule',
          (_ctx: TestContext) => {
            pulledTasks.push({
              name: "Deleted task",
              repeat_rule: INVALID_RULE,
              is_deleted: false,
              is_completed: false,
            });
          },
        );

        And("the task is deleted", (_ctx: TestContext) => {
          pulledTasks[0].is_deleted = true;
        });

        When("the post-pull check runs", (_ctx: TestContext) => {
          postPullResult = filterTaskNamesWithInvalidRepeatRules(pulledTasks);
        });

        Then("the result is empty", (_ctx: TestContext) => {
          expect(postPullResult).toHaveLength(0);
        });
      },
    );

    // @detect-invalid-repeat-rule @FR5
    f.Scenario(
      "Completed task with invalid rule is excluded",
      ({ Given, When, Then, And }) => {
        Given(
          'a pulled task "Done task" with invalid repeat_rule',
          (_ctx: TestContext) => {
            pulledTasks.push({
              name: "Done task",
              repeat_rule: INVALID_RULE,
              is_deleted: false,
              is_completed: false,
            });
          },
        );

        And("the task is completed", (_ctx: TestContext) => {
          pulledTasks[0].is_completed = true;
        });

        When("the post-pull check runs", (_ctx: TestContext) => {
          postPullResult = filterTaskNamesWithInvalidRepeatRules(pulledTasks);
        });

        Then("the result is empty", (_ctx: TestContext) => {
          expect(postPullResult).toHaveLength(0);
        });
      },
    );
  },
);
