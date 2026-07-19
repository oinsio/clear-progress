import { beforeEach } from "vitest";
import { db } from "../database";
import { AttachmentRepository } from "./AttachmentRepository";

export function createAttachmentRepositorySetup(): {
  getRepository: () => AttachmentRepository;
} {
  let attachmentRepository: AttachmentRepository;

  beforeEach(async () => {
    await db.attachments.clear();
    attachmentRepository = new AttachmentRepository();
  });

  return {
    getRepository: () => attachmentRepository,
  };
}
