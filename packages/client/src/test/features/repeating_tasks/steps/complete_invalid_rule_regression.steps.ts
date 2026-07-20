// implements FR1, FR3 of fix-recurring-completion-error-masking
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { mockAddAlerts } from "@/app/providers/__mocks__/AlertProvider";
import type { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import type { TaskRepository } from "@/db/repositories/TaskRepository";
import { useTaskCompletionAlerts } from "@/hooks/useTaskCompletionAlerts";
import type { RecurringResult } from "@/services/TaskService";
import { TaskService } from "@/services/TaskService";
import { createMockChecklistRepository } from "@/test/factories/checklistRepositoryFactory";
import { buildTask } from "@/test/factories/taskFactory";
import { createMockTaskRepository } from "@/test/mocks/taskRepositoryMock";

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
);

const feature = await loadFeature(
  "../complete_invalid_rule_regression.feature",
);

const UNPARSEABLE_RULE = "{not valid json}";

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;
  let taskName: string;
  let recurringResult: RecurringResult;

  f.BeforeEachScenario(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    taskService = new TaskService(mockTaskRepository, mockChecklistRepository);
    mockAddAlerts.mockClear();
  });

  const givenUnparseableRuleTask = (_ctx: TestContext) => {
    taskName = "Buy groceries";
    const existingTask = buildTask({
      id: "task-1",
      name: taskName,
      repeat_rule: UNPARSEABLE_RULE,
      is_hidden: false,
      next_date: "",
      appear_date: "",
    });
    const completedTask = buildTask({ ...existingTask, is_completed: true });

    mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
    mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
  };

  const whenTaskIsCompleted = async (_ctx: TestContext) => {
    const result = await taskService.complete("task-1");
    recurringResult = result.recurringResult;
  };

  // @fix-recurring-completion-error-masking @FR1
  f.Scenario(
    "Completing a task with a genuinely unparseable repeat rule",
    ({ Given, When, Then }) => {
      Given(
        "a recurring task with an unparseable repeat rule",
        givenUnparseableRuleTask,
      );

      When("the task is completed", whenTaskIsCompleted);

      Then(
        'the recurring result status is "skipped_invalid_rule"',
        (_ctx: TestContext) => {
          expect(recurringResult.status).toBe("skipped_invalid_rule");
        },
      );
    },
  );

  // @fix-recurring-completion-error-masking @FR3
  f.Scenario(
    "The invalid-rule alert still appears for a genuinely unparseable rule",
    ({ Given, When, Then }) => {
      Given(
        "a recurring task with an unparseable repeat rule",
        givenUnparseableRuleTask,
      );

      When("the task is completed", whenTaskIsCompleted);

      Then(
        "the user is shown a repeat rule invalid alert for the task",
        (_ctx: TestContext) => {
          const { result } = renderHook(() => useTaskCompletionAlerts());
          result.current.raiseCompletionAlerts(recurringResult, taskName);

          expect(mockAddAlerts).toHaveBeenCalledWith([
            { type: "repeat_rule_invalid", taskNames: [taskName] },
          ]);
        },
      );
    },
  );
});
