import type { WireGoal } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildGoal } from "@/test/factories/goalFactory";
import type { Goal } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createGoalRepositorySetup } from "./GoalRepository.test-setup";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * GoalRepository.
 */
describe("GoalRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createGoalRepositorySetup();

  function toWireGoal(goal: Goal): WireGoal {
    const { syncStatus: _syncStatus, ...wireGoal } = goal;
    return wireGoal;
  }

  runApplyServerRecordsLwwContractTests<Goal, WireGoal>({
    entityName: "goal",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.goals.get(id),
    putLocalRecord: async (record) => {
      await db.goals.put(record);
    },
    buildLocalRecord: (overrides) => buildGoal(overrides),
    buildServerRecord: (overrides) => toWireGoal(buildGoal(overrides)),
  });
});
