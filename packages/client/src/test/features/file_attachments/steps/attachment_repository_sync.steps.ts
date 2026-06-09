// implements FR5 of add-file-attachments
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { WireAttachment } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { buildAttachment } from "@/test/factories/attachmentFactory";
import type { Attachment } from "@/types/entities";

const feature = await loadFeature("../attachment_repository_sync.feature");

function buildWireAttachment(
  overrides: Partial<WireAttachment> = {},
): WireAttachment {
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    entity_type: "task",
    entity_id: crypto.randomUUID(),
    data_hash: `wire-hash-${Math.random().toString(36).slice(2, 8)}`,
    filename: "server-file.pdf",
    mime_type: "application/pdf",
    file_size: 2048,
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 1,
    ...overrides,
  };
}

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const repository = new AttachmentRepository();

    f.BeforeEachScenario(async () => {
      await db.attachments.clear();
    });

    f.Scenario(
      "Bulk upsert saves multiple attachments",
      ({ Given, When, Then }) => {
        let attachments: Attachment[];

        Given(
          "three valid attachments exist in memory",
          async (_ctx: TestContext) => {
            attachments = [
              buildAttachment(),
              buildAttachment(),
              buildAttachment(),
            ];
          },
        );

        When(
          "bulkUpsert is called with all three",
          async (_ctx: TestContext) => {
            await repository.bulkUpsert(attachments);
          },
        );

        Then(
          "getAll returns all three attachments",
          async (_ctx: TestContext) => {
            const allAttachments = await repository.getAll();
            expect(allAttachments).toHaveLength(3);
          },
        );
      },
    );

    f.Scenario("Get attachments needing sync", ({ Given, When, Then, And }) => {
      let result: Attachment[];

      Given(
        "two attachments with needsSync true exist",
        async (_ctx: TestContext) => {
          await db.attachments.bulkAdd([
            buildAttachment({ needsSync: true }),
            buildAttachment({ needsSync: true }),
          ]);
        },
      );

      And(
        "one attachment with needsSync false exists",
        async (_ctx: TestContext) => {
          await db.attachments.add(buildAttachment({ needsSync: false }));
        },
      );

      When("getNeedingSync is called", async (_ctx: TestContext) => {
        result = await repository.getNeedingSync();
      });

      Then(
        "only the two dirty attachments are returned",
        async (_ctx: TestContext) => {
          expect(result).toHaveLength(2);
          for (const attachment of result) {
            expect(attachment.needsSync).toBe(true);
          }
        },
      );
    });

    f.Scenario("Apply server records", ({ Given, When, Then }) => {
      let serverRecords: WireAttachment[];

      Given("no attachments exist locally", async (_ctx: TestContext) => {
        const count = await db.attachments.count();
        expect(count).toBe(0);
      });

      When(
        "applyServerRecords is called with two server records",
        async (_ctx: TestContext) => {
          serverRecords = [buildWireAttachment(), buildWireAttachment()];
          await repository.applyServerRecords(serverRecords);
        },
      );

      Then(
        "both records are stored with needsSync false",
        async (_ctx: TestContext) => {
          const allAttachments = await repository.getAll();
          expect(allAttachments).toHaveLength(2);
          for (const attachment of allAttachments) {
            expect(attachment.needsSync).toBe(false);
          }
        },
      );
    });

    f.Scenario(
      "Apply server records skips local dirty records",
      ({ Given, When, Then }) => {
        let localAttachment: Attachment;

        Given(
          "a local attachment with needsSync true exists",
          async (_ctx: TestContext) => {
            localAttachment = buildAttachment({
              needsSync: true,
              filename: "local-version.pdf",
            });
            await db.attachments.add(localAttachment);
          },
        );

        When(
          "applyServerRecords is called with a record having the same id",
          async (_ctx: TestContext) => {
            const serverRecord = buildWireAttachment({
              id: localAttachment.id,
              filename: "server-version.pdf",
            });
            await repository.applyServerRecords([serverRecord]);
          },
        );

        Then(
          "the local attachment is not overwritten",
          async (_ctx: TestContext) => {
            const stored = await db.attachments.get(localAttachment.id);
            expect(stored?.filename).toBe("local-version.pdf");
            expect(stored?.needsSync).toBe(true);
          },
        );
      },
    );
  },
);
