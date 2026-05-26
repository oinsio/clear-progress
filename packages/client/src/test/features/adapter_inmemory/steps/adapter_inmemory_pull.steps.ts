// implements FR3 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type { PullResponse, PushResponse } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import { createWireTask } from "./wire-factories";

const feature = await loadFeature("../adapter_inmemory_pull.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let pullResponse: PullResponse;
    let firstPushResponse: PushResponse;
    let secondPushResponse: PushResponse;

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR3
    f.Scenario(
      "Pull returns empty arrays for fresh state",
      ({ Given, When, Then }) => {
        Given(
          "an initialized adapter with no data",
          async (_ctx: TestContext) => {
            await adapter.init();
          },
        );

        When(
          "pull is called with since_revision 0",
          async (_ctx: TestContext) => {
            pullResponse = await adapter.pull({ since_revision: 0 });
          },
        );

        Then(
          "all entity arrays are empty and current_revision is 0 and purge_revision is 0",
          async (_ctx: TestContext) => {
            expect(pullResponse.ok).toBe(true);
            expect(pullResponse.tasks).toEqual([]);
            expect(pullResponse.goals).toEqual([]);
            expect(pullResponse.contexts).toEqual([]);
            expect(pullResponse.categories).toEqual([]);
            expect(pullResponse.ideas).toEqual([]);
            expect(pullResponse.checklist_items).toEqual([]);
            expect(pullResponse.settings).toEqual([]);
            expect(pullResponse.current_revision).toBe(0);
            expect(pullResponse.purge_revision).toBe(0);
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR3
    f.Scenario(
      "Pull filters by since_revision",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          "a task was pushed in the first batch",
          async (_ctx: TestContext) => {
            firstPushResponse = await adapter.push({
              tasks: [createWireTask({ name: "Task 1" })],
            });
          },
        );

        And(
          "another task was pushed in the second batch",
          async (_ctx: TestContext) => {
            secondPushResponse = await adapter.push({
              tasks: [createWireTask({ name: "Task 2" })],
            });
          },
        );

        When(
          "pull is called with since_revision equal to the first batch revision",
          async (_ctx: TestContext) => {
            pullResponse = await adapter.pull({
              since_revision: firstPushResponse.revision ?? 0,
            });
          },
        );

        Then(
          "only the task from the second batch is returned",
          async (_ctx: TestContext) => {
            expect(pullResponse.tasks).toHaveLength(1);
            expect(pullResponse.tasks[0]?.name).toBe("Task 2");
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR3
    f.Scenario(
      "current_revision reflects latest push",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And("two push batches have been made", async (_ctx: TestContext) => {
          await adapter.push({
            tasks: [createWireTask({ name: "Task 1" })],
          });
          secondPushResponse = await adapter.push({
            tasks: [createWireTask({ name: "Task 2" })],
          });
        });

        When(
          "pull is called with since_revision 0",
          async (_ctx: TestContext) => {
            pullResponse = await adapter.pull({ since_revision: 0 });
          },
        );

        Then(
          "current_revision equals the revision from the last push",
          async (_ctx: TestContext) => {
            expect(pullResponse.current_revision).toBe(
              secondPushResponse.revision,
            );
          },
        );
      },
    );
  },
);
