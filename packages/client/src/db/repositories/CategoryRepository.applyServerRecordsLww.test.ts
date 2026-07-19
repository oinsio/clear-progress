import type { WireCategory } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildCategory } from "@/test/factories/categoryFactory";
import type { Category } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createCategoryRepositorySetup } from "./CategoryRepository.test-setup";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * CategoryRepository.
 */
describe("CategoryRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createCategoryRepositorySetup();

  function toWireCategory(category: Category): WireCategory {
    const { syncStatus: _syncStatus, ...wireCategory } = category;
    return wireCategory;
  }

  runApplyServerRecordsLwwContractTests<Category, WireCategory>({
    entityName: "category",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.categories.get(id),
    putLocalRecord: async (record) => {
      await db.categories.put(record);
    },
    buildLocalRecord: (overrides) => buildCategory(overrides),
    buildServerRecord: (overrides) => toWireCategory(buildCategory(overrides)),
  });
});
