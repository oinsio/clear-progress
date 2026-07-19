import type { WireChecklistItem } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import type { ChecklistItem } from "@/types/entities";
import { db } from "../database";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";
import { createChecklistRepositorySetup } from "./ChecklistRepository.test-setup";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * ChecklistRepository.
 */
describe("ChecklistRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createChecklistRepositorySetup();

  function toWireChecklistItem(item: ChecklistItem): WireChecklistItem {
    const { syncStatus: _syncStatus, ...wireChecklistItem } = item;
    return wireChecklistItem;
  }

  runApplyServerRecordsLwwContractTests<ChecklistItem, WireChecklistItem>({
    entityName: "checklist item",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.checklist_items.get(id),
    putLocalRecord: async (record) => {
      await db.checklist_items.put(record);
    },
    buildLocalRecord: (overrides) => buildChecklistItem(overrides),
    buildServerRecord: (overrides) =>
      toWireChecklistItem(buildChecklistItem(overrides)),
  });
});
