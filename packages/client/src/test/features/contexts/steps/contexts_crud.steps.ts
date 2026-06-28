// implements FR1, FR2, FR3 of add-context-category-specs
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { db } from "@/db/database";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Context as ContextEntity, ISOTimestamp } from "@/types/entities";
import {
  createScenarioContext,
  getContext,
  seedContext,
} from "./contexts_steps.helpers";

const feature = await loadFeature("../contexts_crud.feature");

const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ISO_TIMESTAMP_REGEX = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const ctx = createScenarioContext();

    f.BeforeEachScenario(async () => {
      await ctx.reset();
    });

    // @add-context-category-specs @FR1
    f.Scenario("Create context with name", ({ When, Then, And }) => {
      let createdContext: ContextEntity;

      When('user creates context "@home"', async (_ctx: TestContext) => {
        createdContext = await ctx.contextService.create("@home");
      });

      Then(
        'context is persisted with name "@home"',
        async (_ctx: TestContext) => {
          const persistedContext = await db.contexts.get(createdContext.id);
          expect(persistedContext?.name).toBe("@home");
        },
      );

      And("context has revision 0", async (_ctx: TestContext) => {
        expect(createdContext.revision).toBe(0);
      });

      And('context has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(createdContext.syncStatus).toBe("pending");
      });

      And("context has is_deleted false", async (_ctx: TestContext) => {
        expect(createdContext.is_deleted).toBe(false);
      });
    });

    // @add-context-category-specs @FR1
    f.Scenario(
      "Sort order defaults to end of list",
      ({ Given, When, Then }) => {
        let createdContext: ContextEntity;

        Given("3 active contexts exist", async (_ctx: TestContext) => {
          await seedContext(ctx.contextIds, "Context A", { sort_order: "a0" });
          await seedContext(ctx.contextIds, "Context B", { sort_order: "a1" });
          await seedContext(ctx.contextIds, "Context C", { sort_order: "a2" });
        });

        When('user creates context "@new"', async (_ctx: TestContext) => {
          createdContext = await ctx.contextService.create("@new");
        });

        Then(
          "context has sort_order above existing maximum",
          async (_ctx: TestContext) => {
            expect(typeof createdContext.sort_order).toBe("string");
            const allContexts = await ctx.contextService.getAll();
            const others = allContexts.filter(
              (entity) => entity.id !== createdContext.id,
            );
            for (const other of others) {
              expect(
                String(createdContext.sort_order) > String(other.sort_order),
              ).toBe(true);
            }
          },
        );
      },
    );

    // @add-context-category-specs @FR1
    f.Scenario("UUID generated client-side", ({ When, Then }) => {
      let createdContext: ContextEntity;

      When('user creates context "@home"', async (_ctx: TestContext) => {
        createdContext = await ctx.contextService.create("@home");
      });

      Then("context id is valid UUID v4", async (_ctx: TestContext) => {
        expect(createdContext.id).toMatch(UUID_V4_REGEX);
      });
    });

    // @add-context-category-specs @FR1
    f.Scenario("Timestamps set on creation", ({ When, Then, And }) => {
      let createdContext: ContextEntity;

      When('user creates context "@home"', async (_ctx: TestContext) => {
        createdContext = await ctx.contextService.create("@home");
      });

      Then(
        "context created_at and updated_at are equal",
        async (_ctx: TestContext) => {
          expect(createdContext.created_at).toBe(createdContext.updated_at);
        },
      );

      And(
        "context timestamps are ISO 8601 with Z suffix",
        async (_ctx: TestContext) => {
          expect(createdContext.created_at).toMatch(ISO_TIMESTAMP_REGEX);
          expect(createdContext.updated_at).toMatch(ISO_TIMESTAMP_REGEX);
        },
      );
    });

    // @add-context-category-specs @FR2
    f.Scenario("List sorted by sort_order", ({ Given, When, Then }) => {
      let returnedContexts: ContextEntity[];

      Given("contexts with sort_order 2, 0, 1", async (_ctx: TestContext) => {
        await seedContext(ctx.contextIds, "Context A", { sort_order: "2" });
        await seedContext(ctx.contextIds, "Context B", { sort_order: "0" });
        await seedContext(ctx.contextIds, "Context C", { sort_order: "1" });
      });

      When("user requests all contexts", async (_ctx: TestContext) => {
        returnedContexts = await ctx.contextService.getAll();
      });

      Then(
        "contexts are returned in order 0, 1, 2",
        async (_ctx: TestContext) => {
          const sortOrders = returnedContexts.map(
            (context) => context.sort_order,
          );
          expect(sortOrders).toEqual(["0", "1", "2"]);
        },
      );
    });

    // @add-context-category-specs @FR2
    f.Scenario("Empty list", ({ Given, When, Then }) => {
      let returnedContexts: ContextEntity[];

      Given("no contexts exist", async (_ctx: TestContext) => {
        // DB is already cleared in BeforeEachScenario
      });

      When("user requests all contexts", async (_ctx: TestContext) => {
        returnedContexts = await ctx.contextService.getAll();
      });

      Then("empty array is returned", async (_ctx: TestContext) => {
        expect(returnedContexts).toEqual([]);
      });
    });

    // @add-context-category-specs @FR2
    f.Scenario("Soft-deleted contexts excluded", ({ Given, When, Then }) => {
      let returnedContexts: ContextEntity[];

      Given("2 active and 1 deleted contexts", async (_ctx: TestContext) => {
        await seedContext(ctx.contextIds, "Active A", {
          is_deleted: false,
        });
        await seedContext(ctx.contextIds, "Active B", {
          is_deleted: false,
        });
        await seedContext(ctx.contextIds, "Deleted C", {
          is_deleted: true,
        });
      });

      When("user requests all contexts", async (_ctx: TestContext) => {
        returnedContexts = await ctx.contextService.getAll();
      });

      Then("only 2 contexts are returned", async (_ctx: TestContext) => {
        expect(returnedContexts).toHaveLength(2);
      });
    });

    // @add-context-category-specs @FR3
    f.Scenario("Update context name", ({ Given, When, Then, And }) => {
      let updatedContext: ContextEntity;
      let originalUpdatedAt: string;

      Given('context "@home" exists', async (_ctx: TestContext) => {
        await seedContext(ctx.contextIds, "@home", {
          updated_at: "2020-01-01T00:00:00.000Z" as ISOTimestamp,
        });
        const existingContext = await getContext(ctx.contextIds, "@home");
        originalUpdatedAt = existingContext.updated_at;
      });

      When(
        'user updates context name to "@office"',
        async (_ctx: TestContext) => {
          updatedContext = await ctx.contextService.update(
            getIdOrThrow(ctx.contextIds, "@home"),
            "@office",
          );
        },
      );

      Then('context name is "@office"', async (_ctx: TestContext) => {
        expect(updatedContext.name).toBe("@office");
      });

      And('context has syncStatus "pending"', async (_ctx: TestContext) => {
        expect(updatedContext.syncStatus).toBe("pending");
      });

      And("context updated_at is refreshed", async (_ctx: TestContext) => {
        expect(updatedContext.updated_at).not.toBe(originalUpdatedAt);
      });
    });

    // @add-context-category-specs @FR3
    f.Scenario("Update nonexistent context throws error", ({ When, Then }) => {
      const nonexistentId = crypto.randomUUID();
      let thrownError: Error;

      When("user updates nonexistent context", async (_ctx: TestContext) => {
        try {
          await ctx.contextService.update(nonexistentId, "New Name");
        } catch (error) {
          thrownError = error as Error;
        }
      });

      Then('error "Context not found" is thrown', async (_ctx: TestContext) => {
        expect(thrownError).toBeDefined();
        expect(thrownError.message).toContain("Context not found");
      });
    });
  },
);
