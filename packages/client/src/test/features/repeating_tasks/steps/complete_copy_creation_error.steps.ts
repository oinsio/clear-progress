// implements FR1, FR2, FR3 of fix-recurring-completion-error-masking
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
import { toISODate } from "@/utils/dateHelpers";

vi.mock(
  "@/app/providers/AlertProvider",
  async () => import("@/app/providers/__mocks__/AlertProvider"),
);

const feature = await loadFeature("../complete_copy_creation_error.feature");

const VALID_DAILY_RULE = {
  type: "fixed" as const,
  frequency: "daily" as const,
  interval: 1,
  target_box: "today" as const,
  advance_days: 0,
};

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let mockTaskRepository: TaskRepository;
  let mockChecklistRepository: ChecklistRepository;
  let taskName: string;
  let recurringResult: RecurringResult;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  f.BeforeEachScenario(() => {
    mockTaskRepository = createMockTaskRepository();
    mockChecklistRepository = createMockChecklistRepository();
    taskService = new TaskService(mockTaskRepository, mockChecklistRepository);
    mockAddAlerts.mockClear();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  f.AfterEachScenario(() => {
    consoleErrorSpy.mockRestore();
  });

  const givenValidRuleTaskWithFailingCopyCreation = (_ctx: TestContext) => {
    taskName = "Daily review";
    const existingTask = buildTask({
      id: "task-1",
      name: taskName,
      repeat_rule: JSON.stringify(VALID_DAILY_RULE),
      is_hidden: false,
      next_date: toISODate("2026-07-19"),
      appear_date: toISODate("2026-07-19"),
    });
    const completedTask = buildTask({ ...existingTask, is_completed: true });

    mockTaskRepository.getById = vi.fn().mockResolvedValue(existingTask);
    mockTaskRepository.update = vi.fn().mockResolvedValue(completedTask);
    mockTaskRepository.create = vi
      .fn()
      .mockRejectedValue(new Error("DB write failed"));
    mockChecklistRepository.getActiveByTaskId = vi.fn().mockResolvedValue([]);
  };

  const whenCompletedWithCopyCreationError = async (_ctx: TestContext) => {
    const result = await taskService.complete("task-1");
    recurringResult = result.recurringResult;
    return result;
  };

  const whenCompletedWithCopyCreationErrorVoid = async (
    ctx: TestContext,
  ): Promise<void> => {
    await whenCompletedWithCopyCreationError(ctx);
  };

  // @fix-recurring-completion-error-masking @FR1 @FR2
  f.Scenario(
    "Copy creation fails for a task with a valid repeat rule",
    ({ Given, When, Then, And }) => {
      let completedIsCompleted: boolean;

      Given(
        "a recurring task with a valid repeat rule",
        givenValidRuleTaskWithFailingCopyCreation,
      );

      When(
        "the task is completed and an unexpected error occurs while creating the next occurrence",
        async (ctx: TestContext) => {
          const result = await whenCompletedWithCopyCreationError(ctx);
          completedIsCompleted = result.completed.is_completed;
        },
      );

      Then("the task is marked as completed", (_ctx: TestContext) => {
        expect(completedIsCompleted).toBe(true);
      });

      And(
        'the recurring result status is "error_creating_copy"',
        (_ctx: TestContext) => {
          expect(recurringResult.status).toBe("error_creating_copy");
        },
      );

      And("the error is logged to the console", (_ctx: TestContext) => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "Failed to create recurring task:",
          expect.any(Error),
        );
      });
    },
  );

  // @fix-recurring-completion-error-masking @FR3
  f.Scenario(
    "No false invalid-rule alert is raised when copy creation fails",
    ({ Given, When, Then }) => {
      Given(
        "a recurring task with a valid repeat rule",
        givenValidRuleTaskWithFailingCopyCreation,
      );

      When(
        "the task is completed and an unexpected error occurs while creating the next occurrence",
        whenCompletedWithCopyCreationErrorVoid,
      );

      Then(
        "the user is not shown a repeat rule invalid alert",
        (_ctx: TestContext) => {
          const { result } = renderHook(() => useTaskCompletionAlerts());
          result.current.raiseCompletionAlerts(recurringResult, taskName);

          expect(mockAddAlerts).not.toHaveBeenCalled();
        },
      );
    },
  );
});
