// implements FR3 of miss-behavior-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { act, renderHook } from "@testing-library/react";
import { expect, type TestContext, vi } from "vitest";
import { BOX } from "@/constants";
import { useCompletedTaskHandlers } from "@/hooks/useCompletedTaskHandlers";
import type { UseTasksReturn } from "@/hooks/useTasks";
import { buildTasksHook } from "@/test/builders/hookBuilders";
import { buildTask } from "@/test/factories/taskFactory";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../completed_page_operations.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let completedTask: Task;
    let inbox: UseTasksReturn;
    let today: UseTasksReturn;
    let week: UseTasksReturn;
    let later: UseTasksReturn;
    let setSelectedTaskId: ReturnType<typeof vi.fn>;
    let handlersResult: ReturnType<
      typeof renderHook<ReturnType<typeof useCompletedTaskHandlers>, unknown>
    >;
    let duplicatedTask: Task;

    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      inbox = buildTasksHook();
      today = buildTasksHook();
      week = buildTasksHook();
      later = buildTasksHook();
      setSelectedTaskId = vi.fn();
    });

    function createCompletedTask(box: Box): void {
      completedTask = buildTask({ box, is_completed: true });
    }

    async function renderAndAct(
      action: () => Promise<void> | void,
    ): Promise<void> {
      renderHandlers([completedTask]);
      await act(() => action());
    }

    function renderHandlers(tasks: Task[]) {
      handlersResult = renderHook(() =>
        useCompletedTaskHandlers({
          completedTasks: tasks,
          inbox,
          today,
          week,
          later,
          selectedTask: null,
          setSelectedTaskId,
        }),
      );
    }

    // @miss-behavior-specs @FR3
    f.Scenario(
      "Update dispatches to task's original box",
      ({ Given, When, Then }) => {
        Given('a completed task in the "inbox" box', (_ctx: TestContext) => {
          createCompletedTask(BOX.INBOX);
        });

        When("the task is updated", async (_ctx: TestContext) => {
          await renderAndAct(() =>
            handlersResult.result.current.handleUpdateTask(completedTask.id, {
              name: "Updated",
            }),
          );
        });

        Then(
          "the update is routed to the inbox handler",
          (_ctx: TestContext) => {
            expect(inbox.updateTask).toHaveBeenCalledWith(completedTask.id, {
              name: "Updated",
            });
          },
        );
      },
    );

    // @miss-behavior-specs @FR3
    f.Scenario(
      "Move dispatches to task's original box",
      ({ Given, When, Then }) => {
        Given('a completed task in the "week" box', (_ctx: TestContext) => {
          createCompletedTask(BOX.WEEK);
        });

        When('the task is moved to "today"', async (_ctx: TestContext) => {
          await renderAndAct(() =>
            handlersResult.result.current.handleMoveTask(
              completedTask.id,
              BOX.TODAY,
            ),
          );
        });

        Then("the move is routed to the week handler", (_ctx: TestContext) => {
          expect(week.moveTask).toHaveBeenCalledWith(
            completedTask.id,
            BOX.TODAY,
          );
        });
      },
    );

    // @miss-behavior-specs @FR3
    f.Scenario(
      "Delete clears selection and dispatches to original box",
      ({ Given, When, Then, And }) => {
        Given('a completed task in the "later" box', (_ctx: TestContext) => {
          createCompletedTask(BOX.LATER);
        });

        When("the task is deleted", async (_ctx: TestContext) => {
          await renderAndAct(() =>
            handlersResult.result.current.handleDeleteTask(completedTask.id),
          );
        });

        Then("selection is cleared", (_ctx: TestContext) => {
          expect(setSelectedTaskId).toHaveBeenCalledWith(null);
        });

        And(
          "the delete is routed to the later handler",
          (_ctx: TestContext) => {
            expect(later.deleteTask).toHaveBeenCalledWith(completedTask.id);
          },
        );
      },
    );

    // @miss-behavior-specs @FR3
    f.Scenario("Duplicate selects the new task", ({ Given, When, Then }) => {
      Given('a completed task in the "today" box', (_ctx: TestContext) => {
        createCompletedTask(BOX.TODAY);
        duplicatedTask = buildTask({ box: BOX.TODAY });
        today = buildTasksHook({
          duplicateTask: vi.fn().mockResolvedValue(duplicatedTask),
        });
      });

      When("the task is duplicated", async (_ctx: TestContext) => {
        await renderAndAct(() =>
          handlersResult.result.current.handleDuplicateTask(completedTask.id),
        );
      });

      Then("the new task becomes selected", (_ctx: TestContext) => {
        expect(setSelectedTaskId).toHaveBeenCalledWith(duplicatedTask.id);
      });
    });

    // @miss-behavior-specs @FR3
    f.Scenario(
      "Unknown box falls back to today handler",
      ({ Given, When, Then }) => {
        Given(
          'a completed task with an unrecognized box "unknown"',
          (_ctx: TestContext) => {
            createCompletedTask("unknown" as unknown as Box);
          },
        );

        When("the task is updated", async (_ctx: TestContext) => {
          await renderAndAct(() =>
            handlersResult.result.current.handleUpdateTask(completedTask.id, {
              name: "Updated",
            }),
          );
        });

        Then(
          "the update is routed to the today handler",
          (_ctx: TestContext) => {
            expect(today.updateTask).toHaveBeenCalledWith(completedTask.id, {
              name: "Updated",
            });
          },
        );
      },
    );
  },
);
