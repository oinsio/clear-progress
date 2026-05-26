// implements FR7, FR8, FR9, FR10 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type {
  DeleteCoverResponse,
  GetCoverResponse,
  UploadCoverResponse,
  UploadCoversResponse,
} from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";

const feature = await loadFeature("../adapter_inmemory_covers.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let uploadResponse: UploadCoverResponse;
    let batchResponse: UploadCoversResponse;
    let getResponse: GetCoverResponse;
    let deleteResponse: DeleteCoverResponse;

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR7
    f.Scenario("New cover upload", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        'a cover is uploaded with data_hash "abc123"',
        async (_ctx: TestContext) => {
          uploadResponse = await adapter.uploadCover({
            goal_id: "goal-1",
            filename: "cover.jpg",
            mime_type: "image/jpeg",
            data: btoa("fake-image-data"),
            data_hash: "abc123",
          });
        },
      );

      Then(
        'the upload response has ok true, data_hash "abc123", and reused false',
        async (_ctx: TestContext) => {
          expect(uploadResponse.ok).toBe(true);
          expect(uploadResponse.data_hash).toBe("abc123");
          expect(uploadResponse.reused).toBe(false);
        },
      );
    });

    // @adapter-inmemory-spec @FR7
    f.Scenario("Duplicate cover is reused", ({ Given, And, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      And(
        'a cover with data_hash "abc123" already exists',
        async (_ctx: TestContext) => {
          await adapter.uploadCover({
            goal_id: "goal-1",
            filename: "cover.jpg",
            mime_type: "image/jpeg",
            data: btoa("fake-image-data"),
            data_hash: "abc123",
          });
        },
      );

      When(
        'a cover is uploaded with data_hash "abc123"',
        async (_ctx: TestContext) => {
          uploadResponse = await adapter.uploadCover({
            goal_id: "goal-2",
            filename: "cover2.jpg",
            mime_type: "image/jpeg",
            data: btoa("fake-image-data"),
            data_hash: "abc123",
          });
        },
      );

      Then("the upload response has reused true", async (_ctx: TestContext) => {
        expect(uploadResponse.reused).toBe(true);
      });
    });

    // @adapter-inmemory-spec @FR8
    f.Scenario("Batch within limit succeeds", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        "a batch of 2 covers with valid mime types is uploaded",
        async (_ctx: TestContext) => {
          batchResponse = await adapter.uploadCovers({
            covers: [
              {
                local_id: "local-1",
                goal_id: "goal-1",
                filename: "cover1.jpg",
                mime_type: "image/jpeg",
                data: btoa("image-1"),
                data_hash: "hash1",
              },
              {
                local_id: "local-2",
                goal_id: "goal-2",
                filename: "cover2.jpg",
                mime_type: "image/png",
                data: btoa("image-2"),
                data_hash: "hash2",
              },
            ],
          });
        },
      );

      Then(
        "the batch response has ok true and 2 results",
        async (_ctx: TestContext) => {
          expect(batchResponse.ok).toBe(true);
          expect(batchResponse.results).toHaveLength(2);
        },
      );
    });

    // @adapter-inmemory-spec @FR8
    f.Scenario("Batch exceeding limit is rejected", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When("a batch of 11 covers is uploaded", async (_ctx: TestContext) => {
        const covers = Array.from({ length: 11 }, (_, index) => ({
          local_id: `local-${index}`,
          goal_id: `goal-${index}`,
          filename: `cover${index}.jpg`,
          mime_type: "image/jpeg",
          data: btoa(`image-${index}`),
          data_hash: `hash-${index}`,
        }));
        batchResponse = await adapter.uploadCovers({ covers });
      });

      Then("the batch response has ok false", async (_ctx: TestContext) => {
        expect(batchResponse.ok).toBe(false);
      });
    });

    // @adapter-inmemory-spec @FR8
    f.Scenario(
      "Invalid mime type returns per-item error",
      ({ Given, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        When(
          'a batch with one valid cover and one cover with mime_type "text/plain" is uploaded',
          async (_ctx: TestContext) => {
            batchResponse = await adapter.uploadCovers({
              covers: [
                {
                  local_id: "local-1",
                  goal_id: "goal-1",
                  filename: "valid.jpg",
                  mime_type: "image/jpeg",
                  data: btoa("valid-image"),
                  data_hash: "hash1",
                },
                {
                  local_id: "local-2",
                  goal_id: "goal-2",
                  filename: "invalid.txt",
                  mime_type: "text/plain",
                  data: btoa("not-an-image"),
                  data_hash: "hash2",
                },
              ],
            });
          },
        );

        Then(
          "the valid cover result has data_hash and the invalid cover result has error",
          async (_ctx: TestContext) => {
            expect(batchResponse.results[0]?.data_hash).toBeDefined();
            expect(batchResponse.results[1]?.error).toBeDefined();
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR9
    f.Scenario("Get existing cover", ({ Given, And, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      And(
        'a cover with data_hash "abc123" already exists',
        async (_ctx: TestContext) => {
          await adapter.uploadCover({
            goal_id: "goal-1",
            filename: "cover.jpg",
            mime_type: "image/jpeg",
            data: btoa("fake-image-data"),
            data_hash: "abc123",
          });
        },
      );

      When(
        'getCover is called with hash "abc123"',
        async (_ctx: TestContext) => {
          getResponse = await adapter.getCover({ hashes: ["abc123"] });
        },
      );

      Then(
        "the cover response contains mime_type and data",
        async (_ctx: TestContext) => {
          expect(getResponse.ok).toBe(true);
          expect(getResponse.covers).toHaveLength(1);
          expect(getResponse.covers[0]?.mime_type).toBe("image/jpeg");
          expect(getResponse.covers[0]?.data).toBeDefined();
        },
      );
    });

    // @adapter-inmemory-spec @FR9
    f.Scenario("Get missing cover returns error", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        'getCover is called with hash "nonexistent"',
        async (_ctx: TestContext) => {
          getResponse = await adapter.getCover({
            hashes: ["nonexistent"],
          });
        },
      );

      Then("the cover result has an error field", async (_ctx: TestContext) => {
        expect(getResponse.covers[0]?.error).toBeDefined();
      });
    });

    // @adapter-inmemory-spec @FR10
    f.Scenario(
      "Delete shared cover decrements ref_count",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a cover with data_hash "shared" has ref_count 2',
          async (_ctx: TestContext) => {
            await adapter.uploadCover({
              goal_id: "goal-1",
              filename: "shared.jpg",
              mime_type: "image/jpeg",
              data: btoa("shared-image"),
              data_hash: "shared",
            });
            await adapter.uploadCover({
              goal_id: "goal-2",
              filename: "shared2.jpg",
              mime_type: "image/jpeg",
              data: btoa("shared-image"),
              data_hash: "shared",
            });
          },
        );

        When(
          'deleteCover is called with hash "shared"',
          async (_ctx: TestContext) => {
            deleteResponse = await adapter.deleteCover({
              hash: "shared",
              goal_id: "goal-1",
            });
          },
        );

        Then(
          "the delete response has deleted false and ref_count 1",
          async (_ctx: TestContext) => {
            expect(deleteResponse.ok).toBe(true);
            expect(deleteResponse.deleted).toBe(false);
            expect(deleteResponse.ref_count).toBe(1);
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR10
    f.Scenario(
      "Delete last reference removes cover",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          'a cover with data_hash "single" has ref_count 1',
          async (_ctx: TestContext) => {
            await adapter.uploadCover({
              goal_id: "goal-1",
              filename: "single.jpg",
              mime_type: "image/jpeg",
              data: btoa("single-image"),
              data_hash: "single",
            });
          },
        );

        When(
          'deleteCover is called with hash "single"',
          async (_ctx: TestContext) => {
            deleteResponse = await adapter.deleteCover({
              hash: "single",
              goal_id: "goal-1",
            });
          },
        );

        Then(
          "the delete response has deleted true and ref_count 0",
          async (_ctx: TestContext) => {
            expect(deleteResponse.ok).toBe(true);
            expect(deleteResponse.deleted).toBe(true);
            expect(deleteResponse.ref_count).toBe(0);
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR10
    f.Scenario("Delete non-existent cover", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When(
        'deleteCover is called with hash "nonexistent"',
        async (_ctx: TestContext) => {
          deleteResponse = await adapter.deleteCover({
            hash: "nonexistent",
            goal_id: "goal-1",
          });
        },
      );

      Then(
        "the delete response has ok true, deleted true, and ref_count 0",
        async (_ctx: TestContext) => {
          expect(deleteResponse.ok).toBe(true);
          expect(deleteResponse.deleted).toBe(true);
          expect(deleteResponse.ref_count).toBe(0);
        },
      );
    });
  },
);
