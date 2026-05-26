// implements FR10, FR11, FR12 of task-detail-panel-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { resolveEntityName } from "@/components/tasks/taskEditShared";

const feature = await loadFeature("../task_detail_panel_entity_name.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let entities: Array<{ id: string; name: string }>;
    let result: string;

    f.BeforeEachScenario(() => {
      entities = [];
      result = "";
    });

    // @task-detail-panel-spec @FR10
    f.Scenario("ID matches an entity", ({ Given, When, Then }) => {
      Given(
        'entities contain an item with id "a1" and name "Alpha"',
        (_ctx: TestContext) => {
          entities = [{ id: "a1", name: "Alpha" }];
        },
      );

      When(
        'resolveEntityName is called with id "a1" and fallback "None"',
        (_ctx: TestContext) => {
          result = resolveEntityName("a1", entities, "None");
        },
      );

      Then('the result is "Alpha"', (_ctx: TestContext) => {
        expect(result).toBe("Alpha");
      });
    });

    // @task-detail-panel-spec @FR11
    f.Scenario("Empty ID returns fallback", ({ Given, When, Then }) => {
      Given(
        'entities contain an item with id "a1" and name "Alpha"',
        (_ctx: TestContext) => {
          entities = [{ id: "a1", name: "Alpha" }];
        },
      );

      When(
        'resolveEntityName is called with id "" and fallback "None"',
        (_ctx: TestContext) => {
          result = resolveEntityName("", entities, "None");
        },
      );

      Then('the result is "None"', (_ctx: TestContext) => {
        expect(result).toBe("None");
      });
    });

    // @task-detail-panel-spec @FR12
    f.Scenario("Non-matching ID returns fallback", ({ Given, When, Then }) => {
      Given(
        'entities contain an item with id "a1" and name "Alpha"',
        (_ctx: TestContext) => {
          entities = [{ id: "a1", name: "Alpha" }];
        },
      );

      When(
        'resolveEntityName is called with id "unknown" and fallback "None"',
        (_ctx: TestContext) => {
          result = resolveEntityName("unknown", entities, "None");
        },
      );

      Then('the result is "None"', (_ctx: TestContext) => {
        expect(result).toBe("None");
      });
    });

    // @task-detail-panel-spec @FR10
    f.Scenario(
      "Multiple entities resolves correct one",
      ({ Given, When, Then }) => {
        Given("entities contain items:", (_ctx: TestContext, table) => {
          entities = table.map((row: Record<string, string>) => ({
            id: row.id,
            name: row.name,
          }));
        });

        When(
          'resolveEntityName is called with id "b2" and fallback "None"',
          (_ctx: TestContext) => {
            result = resolveEntityName("b2", entities, "None");
          },
        );

        Then('the result is "Beta"', (_ctx: TestContext) => {
          expect(result).toBe("Beta");
        });
      },
    );

    // @task-detail-panel-spec @FR11
    f.Scenario(
      "Empty entities array returns fallback",
      ({ Given, When, Then }) => {
        Given("entities array is empty", (_ctx: TestContext) => {
          entities = [];
        });

        When(
          'resolveEntityName is called with id "a1" and fallback "Fallback"',
          (_ctx: TestContext) => {
            result = resolveEntityName("a1", entities, "Fallback");
          },
        );

        Then('the result is "Fallback"', (_ctx: TestContext) => {
          expect(result).toBe("Fallback");
        });
      },
    );
  },
);
