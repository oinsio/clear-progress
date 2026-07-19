import type { WireTask } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildTask } from "@/test/factories/taskFactory";
import type { Task } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createTaskRepositorySetup } from "./TaskRepository.test-setup";

/**
 * Contract-style RED tests for FR5 of fix-stale-sync-overwrites.
 * Proves `runApplyServerRecordsLwwContractTests` runs against TaskRepository
 * and is red under the current (pre-LWW) `applyServerRecords` implementation.
 * Tasks 4.3/4.4 will instantiate the same suite against the other 6
 * repositories once the shared `applyServerRecordLww` helper exists.
 */
describe("TaskRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createTaskRepositorySetup();

  function toWireTask(task: Task): WireTask {
    const { syncStatus: _syncStatus, ...wireTask } = task;
    return wireTask;
  }

  runApplyServerRecordsLwwContractTests<Task, WireTask>({
    entityName: "task",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.tasks.get(id),
    putLocalRecord: async (record) => {
      await db.tasks.put(record);
    },
    buildLocalRecord: (overrides) => buildTask(overrides),
    buildServerRecord: (overrides) => toWireTask(buildTask(overrides)),
  });
});
