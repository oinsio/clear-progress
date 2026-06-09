// implements FR5 of add-file-attachments
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { buildAttachment } from "@/test/factories/attachmentFactory";
import type { Attachment } from "@/types/entities";

const feature = await loadFeature("../attachment_repository_crud.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const repository = new AttachmentRepository();

    f.BeforeEachScenario(async () => {
      await db.attachments.clear();
    });

    f.Scenario("Save and retrieve attachment", ({ Given, When, Then }) => {
      let attachment: Attachment;

      Given(
        "a valid attachment exists in memory",
        async (_ctx: TestContext) => {
          attachment = buildAttachment();
        },
      );

      When(
        "the attachment is saved to the repository",
        async (_ctx: TestContext) => {
          await repository.save(attachment);
        },
      );

      Then("getAll returns the saved attachment", async (_ctx: TestContext) => {
        const allAttachments = await repository.getAll();
        expect(allAttachments).toHaveLength(1);
        expect(allAttachments[0].id).toBe(attachment.id);
      });
    });

    f.Scenario(
      "Get attachments by entity type and id",
      ({ Given, When, Then, And }) => {
        const entityId = crypto.randomUUID();
        let result: Attachment[];

        Given(
          'two attachments for entity type "task" and entity id "entity-1" exist',
          async (_ctx: TestContext) => {
            await db.attachments.bulkAdd([
              buildAttachment({ entity_type: "task", entity_id: entityId }),
              buildAttachment({ entity_type: "task", entity_id: entityId }),
            ]);
          },
        );

        And(
          'one deleted attachment for entity type "task" and entity id "entity-1" exists',
          async (_ctx: TestContext) => {
            await db.attachments.add(
              buildAttachment({
                entity_type: "task",
                entity_id: entityId,
                is_deleted: true,
              }),
            );
          },
        );

        And(
          "one attachment for a different entity exists",
          async (_ctx: TestContext) => {
            await db.attachments.add(buildAttachment());
          },
        );

        When(
          'getByEntityTypeAndId is called with "task" and "entity-1"',
          async (_ctx: TestContext) => {
            result = await repository.getByEntityTypeAndId("task", entityId);
          },
        );

        Then(
          "only the two non-deleted attachments are returned",
          async (_ctx: TestContext) => {
            expect(result).toHaveLength(2);
            for (const attachment of result) {
              expect(attachment.is_deleted).toBe(false);
            }
          },
        );
      },
    );

    f.Scenario(
      "Get all attachments by entity type and id includes deleted",
      ({ Given, When, Then, And }) => {
        const entityId = crypto.randomUUID();
        let result: Attachment[];

        Given(
          'two attachments for entity type "goal" and entity id "entity-2" exist',
          async (_ctx: TestContext) => {
            await db.attachments.bulkAdd([
              buildAttachment({ entity_type: "goal", entity_id: entityId }),
              buildAttachment({ entity_type: "goal", entity_id: entityId }),
            ]);
          },
        );

        And(
          'one deleted attachment for entity type "goal" and entity id "entity-2" exists',
          async (_ctx: TestContext) => {
            await db.attachments.add(
              buildAttachment({
                entity_type: "goal",
                entity_id: entityId,
                is_deleted: true,
              }),
            );
          },
        );

        When(
          'getAllByEntityTypeAndId is called with "goal" and "entity-2"',
          async (_ctx: TestContext) => {
            result = await repository.getAllByEntityTypeAndId("goal", entityId);
          },
        );

        Then(
          "all three attachments are returned",
          async (_ctx: TestContext) => {
            expect(result).toHaveLength(3);
          },
        );
      },
    );

    f.Scenario("Get attachments by hash", ({ Given, When, Then, And }) => {
      const targetHash = "abc123";
      let result: Attachment[];

      Given(
        'two attachments with data_hash "abc123" exist',
        async (_ctx: TestContext) => {
          await db.attachments.bulkAdd([
            buildAttachment({ data_hash: targetHash }),
            buildAttachment({ data_hash: targetHash }),
          ]);
        },
      );

      And(
        "one attachment with a different data_hash exists",
        async (_ctx: TestContext) => {
          await db.attachments.add(
            buildAttachment({ data_hash: "other-hash" }),
          );
        },
      );

      When('getByHash is called with "abc123"', async (_ctx: TestContext) => {
        result = await repository.getByHash(targetHash);
      });

      Then(
        "two attachments with matching hash are returned",
        async (_ctx: TestContext) => {
          expect(result).toHaveLength(2);
          for (const attachment of result) {
            expect(attachment.data_hash).toBe(targetHash);
          }
        },
      );
    });

    f.Scenario("Soft delete attachment", ({ Given, When, Then, And }) => {
      let attachmentId: string;

      Given(
        "a saved attachment with known id exists",
        async (_ctx: TestContext) => {
          const attachment = buildAttachment({ needsSync: false });
          attachmentId = attachment.id;
          await db.attachments.add(attachment);
        },
      );

      When("delete is called with that id", async (_ctx: TestContext) => {
        await repository.delete(attachmentId);
      });

      Then("the attachment has is_deleted true", async (_ctx: TestContext) => {
        const stored = await db.attachments.get(attachmentId);
        expect(stored?.is_deleted).toBe(true);
      });

      And("the attachment has needsSync true", async (_ctx: TestContext) => {
        const stored = await db.attachments.get(attachmentId);
        expect(stored?.needsSync).toBe(true);
      });
    });

    f.Scenario("Delete non-existent attachment is no-op", ({ When, Then }) => {
      let thrownError: Error | undefined;

      When(
        "delete is called with a non-existent id",
        async (_ctx: TestContext) => {
          try {
            await repository.delete(crypto.randomUUID());
          } catch (error) {
            thrownError = error as Error;
          }
        },
      );

      Then("no error is thrown", async (_ctx: TestContext) => {
        expect(thrownError).toBeUndefined();
      });
    });

    f.Scenario("Save rejects invalid attachment", ({ When, Then }) => {
      let thrownError: Error | undefined;

      When(
        "save is called with invalid attachment data",
        async (_ctx: TestContext) => {
          const invalidAttachment = {
            id: "not-a-uuid",
          } as unknown as Attachment;
          try {
            await repository.save(invalidAttachment);
          } catch (error) {
            thrownError = error as Error;
          }
        },
      );

      Then(
        'an error containing "Invalid attachment data" is thrown',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError?.message).toContain("Invalid attachment data");
        },
      );
    });

    f.Scenario(
      "Get by entity type and id returns sorted by sort_order",
      ({ Given, When, Then }) => {
        const entityId = crypto.randomUUID();
        let result: Attachment[];

        Given(
          "attachments with sort_order 2, 0, 1 exist for the same entity",
          async (_ctx: TestContext) => {
            await db.attachments.bulkAdd([
              buildAttachment({
                entity_type: "task",
                entity_id: entityId,
                sort_order: "a2",
              }),
              buildAttachment({
                entity_type: "task",
                entity_id: entityId,
                sort_order: "a0",
              }),
              buildAttachment({
                entity_type: "task",
                entity_id: entityId,
                sort_order: "a1",
              }),
            ]);
          },
        );

        When(
          "getByEntityTypeAndId is called for that entity",
          async (_ctx: TestContext) => {
            result = await repository.getByEntityTypeAndId("task", entityId);
          },
        );

        Then(
          "attachments are returned in sort_order 0, 1, 2",
          async (_ctx: TestContext) => {
            expect(result).toHaveLength(3);
            expect(
              String(result[0].sort_order) < String(result[1].sort_order),
            ).toBe(true);
            expect(
              String(result[1].sort_order) < String(result[2].sort_order),
            ).toBe(true);
          },
        );
      },
    );
  },
);
