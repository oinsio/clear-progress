// implements FR5 of fix-stale-sync-overwrites
import "fake-indexeddb/auto";
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { WireGoal, WireTask } from "@clear-progress/contract";
import { expect, type TestContext, vi } from "vitest";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { buildGoal } from "@/test/factories/goalFactory";
import { buildTask } from "@/test/factories/taskFactory";
import type { Goal, Task } from "@/types/entities";

const feature = await loadFeature("../pull_lww_protection.feature");

const LOCAL_EDIT_TIMESTAMP = "2026-01-02T00:00:00.000Z";
const OTHER_DEVICE_NEWER_TIMESTAMP = "2026-01-03T00:00:00.000Z";
const OTHER_DEVICE_OLDER_TIMESTAMP = "2026-01-01T00:00:00.000Z";

type Context = Record<string, never>;

function toWireTask(task: Task): WireTask {
  const { syncStatus: _syncStatus, ...wireTask } = task;
  return wireTask;
}

function toWireGoal(goal: Goal): WireGoal {
  const { syncStatus: _syncStatus, ...wireGoal } = goal;
  return wireGoal;
}

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  let taskRepository: TaskRepository;
  let goalRepository: GoalRepository;
  let seededTaskId: string;
  let seededGoalId: string;
  let incomingTaskUpdatedAt: string;
  let incomingGoalUpdatedAt: string;
  let conflictWarnSpy: ReturnType<typeof vi.spyOn>;

  f.BeforeEachScenario(async () => {
    await db.tasks.clear();
    await db.goals.clear();
    taskRepository = new TaskRepository();
    goalRepository = new GoalRepository();
  });

  async function seedLocalRecords(
    syncStatus: "synced" | "pending",
    updatedAt: string,
  ) {
    const task = buildTask({ updated_at: updatedAt, syncStatus });
    const goal = buildGoal({ updated_at: updatedAt, syncStatus });
    seededTaskId = task.id;
    seededGoalId = goal.id;
    await db.tasks.add(task);
    await db.goals.add(goal);
  }

  async function pullRecordsWithUpdatedAt(updatedAt: string) {
    incomingTaskUpdatedAt = updatedAt;
    incomingGoalUpdatedAt = updatedAt;
    const serverTask = toWireTask(
      buildTask({ id: seededTaskId, updated_at: updatedAt }),
    );
    const serverGoal = toWireGoal(
      buildGoal({ id: seededGoalId, updated_at: updatedAt }),
    );
    await taskRepository.applyServerRecords([serverTask]);
    await goalRepository.applyServerRecords([serverGoal]);
  }

  async function expectBothRecordsShowOtherDeviceEditAndSynced() {
    const task = await db.tasks.get(seededTaskId);
    const goal = await db.goals.get(seededGoalId);
    expect(task?.updated_at).toBe(incomingTaskUpdatedAt);
    expect(task?.syncStatus).toBe("synced");
    expect(goal?.updated_at).toBe(incomingGoalUpdatedAt);
    expect(goal?.syncStatus).toBe("synced");
  }

  async function expectBothRecordsKeepLocalEditAndPending() {
    const task = await db.tasks.get(seededTaskId);
    const goal = await db.goals.get(seededGoalId);
    expect(task?.updated_at).toBe(LOCAL_EDIT_TIMESTAMP);
    expect(task?.syncStatus).toBe("pending");
    expect(goal?.updated_at).toBe(LOCAL_EDIT_TIMESTAMP);
    expect(goal?.syncStatus).toBe("pending");
  }

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "A locally-pending edit is overwritten when another device's edit is newer",
    ({ Given, When, Then }) => {
      Given(
        "a task edited locally and pending sync, with a locally-pending goal edited the same way",
        async (_ctx: TestContext) => {
          await seedLocalRecords("pending", LOCAL_EDIT_TIMESTAMP);
        },
      );

      When(
        "the same records are pulled from the server with a strictly newer edit from another device",
        async (_ctx: TestContext) => {
          await pullRecordsWithUpdatedAt(OTHER_DEVICE_NEWER_TIMESTAMP);
        },
      );

      Then(
        "both records show the other device's edit and are marked as synced",
        expectBothRecordsShowOtherDeviceEditAndSynced,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "A locally-pending edit survives a pull of an equally old server record",
    ({ Given, When, Then }) => {
      Given(
        "a task edited locally and pending sync, with a locally-pending goal edited the same way",
        async (_ctx: TestContext) => {
          await seedLocalRecords("pending", LOCAL_EDIT_TIMESTAMP);
        },
      );

      When(
        "the same records are pulled from the server with no newer edit from another device, timestamps tied",
        async (_ctx: TestContext) => {
          await pullRecordsWithUpdatedAt(LOCAL_EDIT_TIMESTAMP);
        },
      );

      Then(
        "both records still show the local edit and remain pending sync",
        expectBothRecordsKeepLocalEditAndPending,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "A locally-pending edit survives a pull of an older server record",
    ({ Given, When, Then }) => {
      Given(
        "a task edited locally and pending sync, with a locally-pending goal edited the same way",
        async (_ctx: TestContext) => {
          await seedLocalRecords("pending", LOCAL_EDIT_TIMESTAMP);
        },
      );

      When(
        "the same records are pulled from the server with an older, stale edit from another device",
        async (_ctx: TestContext) => {
          await pullRecordsWithUpdatedAt(OTHER_DEVICE_OLDER_TIMESTAMP);
        },
      );

      Then(
        "both records still show the local edit and remain pending sync",
        expectBothRecordsKeepLocalEditAndPending,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "A synced record always reflects the latest pull",
    ({ Given, When, Then }) => {
      Given(
        "a task already in sync with the server, with a goal already in sync the same way",
        async (_ctx: TestContext) => {
          await seedLocalRecords("synced", LOCAL_EDIT_TIMESTAMP);
        },
      );

      When(
        "the same records are pulled from the server with a newer edit from another device",
        async (_ctx: TestContext) => {
          await pullRecordsWithUpdatedAt(OTHER_DEVICE_NEWER_TIMESTAMP);
        },
      );

      Then(
        "both records show the other device's edit and are marked as synced",
        expectBothRecordsShowOtherDeviceEditAndSynced,
      );
    },
  );

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "A new record from another device appears after its first pull",
    ({ Given, When, Then }) => {
      Given(
        "no local copy of a task or a goal exists yet",
        async (_ctx: TestContext) => {
          seededTaskId = crypto.randomUUID();
          seededGoalId = crypto.randomUUID();
        },
      );

      When(
        "the same records are pulled from the server for the first time",
        async (_ctx: TestContext) => {
          await pullRecordsWithUpdatedAt(OTHER_DEVICE_NEWER_TIMESTAMP);
        },
      );

      Then(
        "both records appear locally and are marked as synced",
        async (_ctx: TestContext) => {
          const task = await db.tasks.get(seededTaskId);
          const goal = await db.goals.get(seededGoalId);
          expect(task).toBeDefined();
          expect(task?.syncStatus).toBe("synced");
          expect(goal).toBeDefined();
          expect(goal?.syncStatus).toBe("synced");
        },
      );
    },
  );

  // @fix-stale-sync-overwrites @FR5
  f.Scenario(
    "An overwritten pending edit is logged as a sync conflict for debugging",
    ({ Given, When, Then }) => {
      Given(
        "a task edited locally and pending sync",
        async (_ctx: TestContext) => {
          const task = buildTask({
            updated_at: LOCAL_EDIT_TIMESTAMP,
            syncStatus: "pending",
          });
          seededTaskId = task.id;
          await db.tasks.add(task);
        },
      );

      When(
        "the task is pulled from the server with a strictly newer edit from another device",
        async (_ctx: TestContext) => {
          conflictWarnSpy = vi
            .spyOn(console, "warn")
            .mockImplementation(() => {});
          const serverTask = toWireTask(
            buildTask({
              id: seededTaskId,
              updated_at: OTHER_DEVICE_NEWER_TIMESTAMP,
            }),
          );
          await taskRepository.applyServerRecords([serverTask]);
        },
      );

      Then(
        "a sync conflict is logged with the task's id and both devices' timestamps",
        async (_ctx: TestContext) => {
          expect(conflictWarnSpy).toHaveBeenCalledWith(
            expect.stringContaining("task"),
            expect.objectContaining({
              id: seededTaskId,
              localUpdatedAt: LOCAL_EDIT_TIMESTAMP,
              serverUpdatedAt: OTHER_DEVICE_NEWER_TIMESTAMP,
            }),
          );
          conflictWarnSpy.mockRestore();
        },
      );
    },
  );
});
