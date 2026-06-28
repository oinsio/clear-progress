/** Tests for AttachmentService — implements FR5, FR8, FR13 of add-file-attachments */

import type { EntityType } from "@clear-progress/contract";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { createMockAttachmentRepository } from "@/test/mocks/attachmentRepositoryMock";
import type { Attachment } from "@/types/entities";
import { AttachmentService } from "./AttachmentService";
import type { FileService } from "./FileService";

const TEST_ENTITY_TYPE: EntityType = "goal";
const TEST_ENTITY_ID = "entity-uuid-123";
const TEST_DATA_HASH = "abc123hash";

function createMockFileService(): FileService {
  return {
    uploadFile: vi.fn().mockResolvedValue({
      data_hash: TEST_DATA_HASH,
      mime_type: "application/pdf",
    }),
    deleteFile: vi.fn(),
    getFileDisplayUrl: vi.fn(),
  } as unknown as FileService;
}

function createTestFile(): File {
  return new File(["content"], "test.pdf", { type: "application/pdf" });
}

describe("AttachmentService", () => {
  let service: AttachmentService;
  let mockRepository: AttachmentRepository;
  let mockFileService: FileService;

  beforeEach(() => {
    mockRepository = createMockAttachmentRepository();
    mockFileService = createMockFileService();
    service = new AttachmentService(mockRepository, mockFileService);
  });

  describe("attachFile", () => {
    // FR8: kills mutants 1 (body removed), 2 (is_deleted), 3 (syncStatus), 4 (object literal)
    it("returns attachment with correct fields", async () => {
      const file = createTestFile();

      const result = await service.attachFile(
        file,
        TEST_ENTITY_TYPE,
        TEST_ENTITY_ID,
      );

      expect(result.entity_type).toBe(TEST_ENTITY_TYPE);
      expect(result.entity_id).toBe(TEST_ENTITY_ID);
      expect(result.data_hash).toBe(TEST_DATA_HASH);
      expect(result.filename).toBe("test.pdf");
      expect(result.mime_type).toBe("application/pdf");
      expect(result.file_size).toBe(7); // "content".length
      expect(result.is_deleted).toBe(false);
      expect(result.syncStatus).toBe("pending");
      expect(typeof result.sort_order).toBe("string");
      expect(result.revision).toBe(0);
    });

    // FR8: kills mutant 5 (empty string goalId → "Stryker was here!")
    it("calls uploadFile with empty goalId and MAX_ATTACHMENT_SIZE_BYTES", async () => {
      const file = createTestFile();

      await service.attachFile(file, TEST_ENTITY_TYPE, TEST_ENTITY_ID);

      expect(mockFileService.uploadFile).toHaveBeenCalledWith(
        file,
        "",
        MAX_ATTACHMENT_SIZE_BYTES,
      );
    });

    it("saves attachment to repository", async () => {
      const file = createTestFile();

      const result = await service.attachFile(
        file,
        TEST_ENTITY_TYPE,
        TEST_ENTITY_ID,
      );

      expect(mockRepository.save).toHaveBeenCalledWith(result);
    });

    it("sets sort_order above existing attachments", async () => {
      const existingAttachments = [
        { id: "a1", sort_order: "a0" },
        { id: "a2", sort_order: "a1" },
      ] as Attachment[];
      vi.mocked(mockRepository.getByEntityTypeAndId).mockResolvedValue(
        existingAttachments,
      );
      const file = createTestFile();

      const result = await service.attachFile(
        file,
        TEST_ENTITY_TYPE,
        TEST_ENTITY_ID,
      );

      expect(typeof result.sort_order).toBe("string");
      expect(String(result.sort_order) > "a1").toBe(true);
    });
  });

  // FR13, FR18: kills mutant 6 (deleteAttachment body removed)
  describe("deleteAttachment", () => {
    it("delegates to repository.delete and calls fileService.deleteFile", async () => {
      const attachmentId = "attachment-uuid-456";
      const mockAttachment = {
        id: attachmentId,
        data_hash: "file-hash-789",
      } as Attachment;
      vi.mocked(mockRepository.getById).mockResolvedValue(mockAttachment);

      await service.deleteAttachment(attachmentId);

      expect(mockRepository.getById).toHaveBeenCalledWith(attachmentId);
      expect(mockRepository.delete).toHaveBeenCalledWith(attachmentId);
      expect(mockFileService.deleteFile).toHaveBeenCalledWith(
        "file-hash-789",
        "",
      );
    });

    it("skips deleteFile when attachment not found", async () => {
      vi.mocked(mockRepository.getById).mockResolvedValue(undefined);

      await service.deleteAttachment("non-existent");

      expect(mockRepository.delete).toHaveBeenCalledWith("non-existent");
      expect(mockFileService.deleteFile).not.toHaveBeenCalled();
    });
  });

  // FR5: kills mutant 7 (getAttachments body removed)
  describe("getAttachments", () => {
    it("returns result from repository", async () => {
      const expectedAttachments = [{ id: "a1" }] as Attachment[];
      vi.mocked(mockRepository.getByEntityTypeAndId).mockResolvedValue(
        expectedAttachments,
      );

      const result = await service.getAttachments(
        TEST_ENTITY_TYPE,
        TEST_ENTITY_ID,
      );

      expect(result).toBe(expectedAttachments);
    });
  });
});
