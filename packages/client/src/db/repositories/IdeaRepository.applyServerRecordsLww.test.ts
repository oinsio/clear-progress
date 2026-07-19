import type { WireIdea } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildIdea } from "@/test/factories/ideaFactory";
import type { Idea } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createIdeaRepositorySetup } from "./IdeaRepository.test-setup";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * IdeaRepository.
 */
describe("IdeaRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createIdeaRepositorySetup();

  function toWireIdea(idea: Idea): WireIdea {
    const { syncStatus: _syncStatus, ...wireIdea } = idea;
    return wireIdea;
  }

  runApplyServerRecordsLwwContractTests<Idea, WireIdea>({
    entityName: "idea",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.ideas.get(id),
    putLocalRecord: async (record) => {
      await db.ideas.put(record);
    },
    buildLocalRecord: (overrides) => buildIdea(overrides),
    buildServerRecord: (overrides) => toWireIdea(buildIdea(overrides)),
  });
});
