// implements FR5, FR8, FR13 of add-file-attachments
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { AttachmentService } from "@/services/AttachmentService";
import type { FileService } from "@/services/FileService";
import type { Attachment, ISOTimestamp } from "@/types/entities";

const feature = await loadFeature("../attachment_service_crud.feature");

function buildMockAttachment(overrides: Partial<Attachment> = {}): Attachment {
  const now = "2025-01-15T10:00:00.000Z" as ISOTimestamp;
  return {
    id: crypto.randomUUID(),
    entity_type: "task",
    entity_id: "task-1",
    data_hash: "test-hash",
    filename: "test.pdf",
    mime_type: "application/pdf",
    file_size: 1024,
    sort_order: "a0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}

function createMockFile(name: string, sizeBytes: number): File {
  const content = new Uint8Array(sizeBytes);
  return new File([content], name, { type: "application/pdf" });
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let mockAttachmentRepo: {
      save: ReturnType<typeof vi.fn>;
      delete: ReturnType<typeof vi.fn>;
      getById: ReturnType<typeof vi.fn>;
      getByEntityTypeAndId: ReturnType<typeof vi.fn>;
    };
    let mockFileService: {
      uploadFile: ReturnType<typeof vi.fn>;
      deleteFile: ReturnType<typeof vi.fn>;
    };
    let service: AttachmentService;

    f.BeforeEachScenario(async () => {
      mockAttachmentRepo = {
        save: vi.fn(),
        delete: vi.fn(),
        getById: vi.fn().mockResolvedValue(undefined),
        getByEntityTypeAndId: vi.fn().mockResolvedValue([]),
      };
      mockFileService = {
        uploadFile: vi.fn().mockResolvedValue({
          data_hash: "default-hash",
          mime_type: "application/octet-stream",
        }),
        deleteFile: vi.fn().mockResolvedValue(undefined),
      };
      service = new AttachmentService(
        mockAttachmentRepo as unknown as AttachmentRepository,
        mockFileService as unknown as FileService,
      );
    });

    // @add-file-attachments @FR8
    f.Scenario("Attach a file to a task", ({ Given, And, When, Then }) => {
      Given(
        'a FileService that returns hash "abc123" on upload',
        async (_ctx: TestContext) => {
          mockFileService.uploadFile.mockResolvedValue({
            data_hash: "abc123",
            mime_type: "application/pdf",
          });
        },
      );

      And(
        'no existing attachments for task "task-1"',
        async (_ctx: TestContext) => {
          mockAttachmentRepo.getByEntityTypeAndId.mockResolvedValue([]);
        },
      );

      When(
        'attachFile is called with a 1KB "report.pdf" for task "task-1"',
        async (_ctx: TestContext) => {
          const file = createMockFile("report.pdf", 1024);
          await service.attachFile(file, "task", "task-1");
        },
      );

      Then(
        'an attachment record is saved with hash "abc123", filename "report.pdf", sort_order 0',
        async (_ctx: TestContext) => {
          expect(mockAttachmentRepo.save).toHaveBeenCalledOnce();
          const saved = mockAttachmentRepo.save.mock.calls[0][0] as Attachment;
          expect(saved.data_hash).toBe("abc123");
          expect(saved.filename).toBe("report.pdf");
          expect(typeof saved.sort_order).toBe("string");
        },
      );

      And(
        "the attachment is marked as needsSync true",
        async (_ctx: TestContext) => {
          const saved = mockAttachmentRepo.save.mock.calls[0][0] as Attachment;
          expect(saved.needsSync).toBe(true);
        },
      );
    });

    // @add-file-attachments @FR8
    f.Scenario(
      "Sort order increments for subsequent attachments",
      ({ Given, And, When, Then }) => {
        Given(
          'a FileService that returns hash "def456" on upload',
          async (_ctx: TestContext) => {
            mockFileService.uploadFile.mockResolvedValue({
              data_hash: "def456",
              mime_type: "image/jpeg",
            });
          },
        );

        And(
          '2 existing attachments for task "task-1"',
          async (_ctx: TestContext) => {
            mockAttachmentRepo.getByEntityTypeAndId.mockResolvedValue([
              buildMockAttachment({ sort_order: "a0" }),
              buildMockAttachment({ sort_order: "a1" }),
            ]);
          },
        );

        When(
          'attachFile is called with a 2KB "image.jpg" for task "task-1"',
          async (_ctx: TestContext) => {
            const file = createMockFile("image.jpg", 2048);
            await service.attachFile(file, "task", "task-1");
          },
        );

        Then(
          "the new attachment has sort_order 2",
          async (_ctx: TestContext) => {
            const saved = mockAttachmentRepo.save.mock
              .calls[0][0] as Attachment;
            expect(typeof saved.sort_order).toBe("string");
            expect(String(saved.sort_order) > "a1").toBe(true);
          },
        );
      },
    );

    // @add-file-attachments @FR8
    f.Scenario(
      "File upload uses MAX_ATTACHMENT_SIZE_BYTES limit",
      ({ Given, When, Then }) => {
        Given(
          "a FileService that tracks upload arguments",
          async (_ctx: TestContext) => {
            mockFileService.uploadFile.mockResolvedValue({
              data_hash: "tracked-hash",
              mime_type: "application/pdf",
            });
          },
        );

        When(
          'attachFile is called with a file for goal "goal-1"',
          async (_ctx: TestContext) => {
            const file = createMockFile("doc.pdf", 512);
            await service.attachFile(file, "goal", "goal-1");
          },
        );

        Then(
          "FileService.uploadFile was called with empty goalId and MAX_ATTACHMENT_SIZE_BYTES",
          async (_ctx: TestContext) => {
            expect(mockFileService.uploadFile).toHaveBeenCalledWith(
              expect.any(File),
              "",
              MAX_ATTACHMENT_SIZE_BYTES,
            );
          },
        );
      },
    );

    // @add-file-attachments @FR13 @FR18
    f.Scenario("Delete an attachment", ({ Given, When, Then }) => {
      Given('an attachment "att-1" exists', async (_ctx: TestContext) => {
        mockAttachmentRepo.getById.mockResolvedValue(
          buildMockAttachment({ id: "att-1", data_hash: "att-1-hash" }),
        );
      });

      When(
        'deleteAttachment is called with "att-1"',
        async (_ctx: TestContext) => {
          await service.deleteAttachment("att-1");
        },
      );

      Then(
        'attachmentRepository.delete was called with "att-1"',
        async (_ctx: TestContext) => {
          expect(mockAttachmentRepo.delete).toHaveBeenCalledWith("att-1");
        },
      );
    });

    // @add-file-attachments @FR5
    f.Scenario("Get attachments for an entity", ({ Given, When, Then }) => {
      let returnedAttachments: Attachment[];

      Given(
        '3 attachments exist for goal "goal-1"',
        async (_ctx: TestContext) => {
          const attachments = [
            buildMockAttachment({ entity_type: "goal", entity_id: "goal-1" }),
            buildMockAttachment({ entity_type: "goal", entity_id: "goal-1" }),
            buildMockAttachment({ entity_type: "goal", entity_id: "goal-1" }),
          ];
          mockAttachmentRepo.getByEntityTypeAndId.mockResolvedValue(
            attachments,
          );
        },
      );

      When(
        'getAttachments is called for goal "goal-1"',
        async (_ctx: TestContext) => {
          returnedAttachments = await service.getAttachments("goal", "goal-1");
        },
      );

      Then("3 attachments are returned", async (_ctx: TestContext) => {
        expect(returnedAttachments).toHaveLength(3);
      });
    });
  },
);
