// implements FR4 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";
import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { TaskService } from "@/services/TaskService";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";

const feature = await loadFeature("../rebalance_sync.feature");

type Context = Record<string, never>;

const REBALANCE_TRIGGER_SORT_ORDER = "a".repeat(
  SORT_ORDER_REBALANCE_THRESHOLD + 1,
);

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskService: TaskService;
  let taskIdsByLabel: Record<string, string>;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    taskService = new TaskService(
      new TaskRepository(),
      new ChecklistRepository(),
    );
    taskIdsByLabel = {};
  });

  async function seedBoxNeedingRebalance(
    labelWithStaleTimestamp: string,
    staleTimestamp: string,
  ) {
    const draggedTask = buildTask({
      box: "inbox",
      sort_order: "a0",
      updated_at:
        labelWithStaleTimestamp === "dragged"
          ? staleTimestamp
          : "2025-01-01T00:00:00.000Z",
      syncStatus: "synced" as const,
    });
    const otherTask = buildTask({
      box: "inbox",
      sort_order: "b0",
      updated_at:
        labelWithStaleTimestamp === "other"
          ? staleTimestamp
          : "2025-01-01T00:00:00.000Z",
      syncStatus: "synced" as const,
    });
    taskIdsByLabel.dragged = draggedTask.id;
    taskIdsByLabel.other = otherTask.id;
    await db.tasks.bulkAdd([draggedTask, otherTask]);
  }

  // @fix-stale-sync-overwrites @FR4
  f.Scenario(
    "A task swept into rebalancing keeps the timestamp of its last real edit",
    ({ Given, When, Then, And }) => {
      Given(
        'a box "inbox" with tasks needing rebalance, where task "other" has updated_at "2025-01-01T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          await seedBoxNeedingRebalance("other", "2025-01-01T00:00:00.000Z");
        },
      );

      When(
        'the user drags task "dragged" to trigger rebalancing',
        async (_ctx: TestContext) => {
          await taskService.reorderTasks(
            taskIdsByLabel.dragged,
            REBALANCE_TRIGGER_SORT_ORDER,
          );
        },
      );

      Then(
        'task "other" has syncStatus "pending"',
        async (_ctx: TestContext) => {
          const otherTask = (await db.tasks.get(taskIdsByLabel.other)) as Task;
          expect(otherTask.syncStatus).toBe("pending");
        },
      );

      And(
        'task "other"\'s updated_at is still "2025-01-01T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          const otherTask = (await db.tasks.get(taskIdsByLabel.other)) as Task;
          expect(otherTask.updated_at).toBe("2025-01-01T00:00:00.000Z");
        },
      );
    },
  );

  // @fix-stale-sync-overwrites @FR4
  f.Scenario(
    "The task the user actually reordered gets a fresh timestamp",
    ({ Given, When, Then, And }) => {
      Given(
        'a box "inbox" with tasks needing rebalance, where task "dragged" has updated_at "2025-01-01T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          await seedBoxNeedingRebalance("dragged", "2025-01-01T00:00:00.000Z");
        },
      );

      When(
        'the user drags task "dragged" to trigger rebalancing',
        async (_ctx: TestContext) => {
          await taskService.reorderTasks(
            taskIdsByLabel.dragged,
            REBALANCE_TRIGGER_SORT_ORDER,
          );
        },
      );

      Then(
        'task "dragged" has syncStatus "pending"',
        async (_ctx: TestContext) => {
          const draggedTask = (await db.tasks.get(
            taskIdsByLabel.dragged,
          )) as Task;
          expect(draggedTask.syncStatus).toBe("pending");
        },
      );

      And(
        'task "dragged"\'s updated_at is refreshed past "2025-01-01T00:00:00.000Z"',
        async (_ctx: TestContext) => {
          const draggedTask = (await db.tasks.get(
            taskIdsByLabel.dragged,
          )) as Task;
          expect(draggedTask.updated_at).not.toBe("2025-01-01T00:00:00.000Z");
        },
      );
    },
  );
});
