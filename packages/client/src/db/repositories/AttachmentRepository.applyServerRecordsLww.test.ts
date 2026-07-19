import type { WireAttachment } from "@clear-progress/contract";
import { describe } from "vitest";
import { buildAttachment } from "@/test/factories/attachmentFactory";
import type { Attachment } from "@/types/entities";
import { db } from "../database";
import { createAttachmentRepositorySetup } from "./AttachmentRepository.test-setup";
import { runApplyServerRecordsLwwContractTests } from "./applyServerRecordsLww.contract";

/**
 * Contract tests for FR5 of fix-stale-sync-overwrites.
 * Instantiates the shared LWW pull protection contract suite against
 * AttachmentRepository.
 */
describe("AttachmentRepository applyServerRecords LWW contract", () => {
  const { getRepository } = createAttachmentRepositorySetup();

  function toWireAttachment(attachment: Attachment): WireAttachment {
    const { syncStatus: _syncStatus, ...wireAttachment } = attachment;
    return wireAttachment;
  }

  runApplyServerRecordsLwwContractTests<Attachment, WireAttachment>({
    entityName: "attachment",
    applyServerRecords: (records) =>
      getRepository().applyServerRecords(records),
    getLocalRecord: (id) => db.attachments.get(id),
    putLocalRecord: async (record) => {
      await db.attachments.put(record);
    },
    buildLocalRecord: (overrides) => buildAttachment(overrides),
    buildServerRecord: (overrides) =>
      toWireAttachment(buildAttachment(overrides)),
  });
});
