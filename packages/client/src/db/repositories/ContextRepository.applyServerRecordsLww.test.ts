import type { WireContext } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildContext } from "@/test/factories/contextFactory";
import type { Context } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createContextRepositorySetup } from "./ContextRepository.test-setup";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * ContextRepository.
 */
describe("ContextRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createContextRepositorySetup();

  function toWireContext(context: Context): WireContext {
    const { syncStatus: _syncStatus, ...wireContext } = context;
    return wireContext;
  }

  runApplyServerRecordsLwwContractTests<Context, WireContext>({
    entityName: "context",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.contexts.get(id),
    putLocalRecord: async (record) => {
      await db.contexts.put(record);
    },
    buildLocalRecord: (overrides) => buildContext(overrides),
    buildServerRecord: (overrides) => toWireContext(buildContext(overrides)),
  });
});
