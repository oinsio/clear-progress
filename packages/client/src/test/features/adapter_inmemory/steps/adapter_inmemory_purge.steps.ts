// implements FR11 of adapter-inmemory-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { InMemorySyncAdapter } from "@clear-progress/adapter-inmemory";
import type { PullResponse, PurgeResponse } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import {
  createWireCategory,
  createWireChecklistItem,
  createWireContext,
  createWireGoal,
  createWireIdea,
  createWireTask,
} from "./wire-factories";

const feature = await loadFeature("../adapter_inmemory_purge.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let adapter: InMemorySyncAdapter;
    let purgeResponse: PurgeResponse;
    let secondPurgeResponse: PurgeResponse;
    let pullResponse: PullResponse;

    f.BeforeEachScenario(async () => {
      adapter = new InMemorySyncAdapter();
    });

    // @adapter-inmemory-spec @FR11
    f.Scenario(
      "Soft-deleted entities are removed",
      ({ Given, And, When, Then }) => {
        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          "a deleted task and a non-deleted task exist",
          async (_ctx: TestContext) => {
            await adapter.push({
              tasks: [
                createWireTask({ name: "Keep", is_deleted: false }),
                createWireTask({ name: "Delete", is_deleted: true }),
              ],
            });
          },
        );

        When("purge is called", async (_ctx: TestContext) => {
          purgeResponse = await adapter.purge();
        });

        Then(
          "the purge response reports 1 task purged",
          async (_ctx: TestContext) => {
            expect(purgeResponse.ok).toBe(true);
            expect(purgeResponse.purged.tasks).toBe(1);
          },
        );

        And(
          "only the non-deleted task remains in pull",
          async (_ctx: TestContext) => {
            pullResponse = await adapter.pull({ since_revision: 0 });
            expect(pullResponse.tasks).toHaveLength(1);
            expect(pullResponse.tasks[0]?.name).toBe("Keep");
          },
        );
      },
    );

    // @adapter-inmemory-spec @FR11
    f.Scenario("Purge increments purge_revision", ({ Given, When, Then }) => {
      Given("an initialized adapter", async (_ctx: TestContext) => {
        await adapter.init();
      });

      When("purge is called twice", async (_ctx: TestContext) => {
        purgeResponse = await adapter.purge();
        secondPurgeResponse = await adapter.purge();
      });

      Then(
        "the first purge has purge_revision 1 and the second has purge_revision 2",
        async (_ctx: TestContext) => {
          expect(purgeResponse.purge_revision).toBe(1);
          expect(secondPurgeResponse.purge_revision).toBe(2);
        },
      );
    });

    // @adapter-inmemory-spec @FR11
    f.Scenario(
      "Purge across all entity types",
      ({ Given, And, When, Then }) => {
        const keepTask = createWireTask({ is_deleted: false });

        Given("an initialized adapter", async (_ctx: TestContext) => {
          await adapter.init();
        });

        And(
          "one soft-deleted entity of each type exists",
          async (_ctx: TestContext) => {
            await adapter.push({
              tasks: [keepTask, createWireTask({ is_deleted: true })],
              goals: [createWireGoal({ is_deleted: true })],
              contexts: [createWireContext({ is_deleted: true })],
              categories: [createWireCategory({ is_deleted: true })],
              ideas: [createWireIdea({ is_deleted: true })],
              checklist_items: [
                createWireChecklistItem({
                  task_id: keepTask.id,
                  is_deleted: true,
                }),
              ],
            });
          },
        );

        When("purge is called", async (_ctx: TestContext) => {
          purgeResponse = await adapter.purge();
        });

        Then(
          "each entity type reports 1 purged item",
          async (_ctx: TestContext) => {
            expect(purgeResponse.ok).toBe(true);
            expect(purgeResponse.purged.tasks).toBe(1);
            expect(purgeResponse.purged.goals).toBe(1);
            expect(purgeResponse.purged.contexts).toBe(1);
            expect(purgeResponse.purged.categories).toBe(1);
            expect(purgeResponse.purged.ideas).toBe(1);
            expect(purgeResponse.purged.checklist_items).toBe(1);
          },
        );
      },
    );
  },
);
