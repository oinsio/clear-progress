// implements FR1-FR7 of add-project-locales
// eslint-disable-next-line @typescript-eslint/consistent-type-imports
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  deriveTermMentioningKeys,
  dialectsByCode,
  EN_PROJECT_DIALECT,
  expectBaseSyncPaused,
  expectDialectMetadata,
  expectDialectValues,
  findOrphanOverrides,
  findPlaceholderMismatches,
  findPluralSuffixMismatches,
  findRedundantOverrides,
  findSurvivingTermOverrides,
  RU_PROJECT_DIALECT,
} from "./project_locales.helpers";

const feature = await loadFeature("../project_locales.feature");

type Context = Record<string, never>;

describeFeature(feature, (f: FeatureDescriibeCallbackParams<Context>) => {
  f.Background(({ Given }) => {
    Given(
      "the project dialect files and their base locales are flattened",
      (_ctx: TestContext) => {
        for (const dialect of Object.values(dialectsByCode)) {
          expect(Object.keys(dialect.overrides).length).toBeGreaterThan(0);
        }
      },
    );
  });

  // @add-project-locales @FR1
  f.ScenarioOutline(
    "Dialect carries only phrases that differ from the base",
    ({ Then }, variables) => {
      Then(
        "no <dialect> override has a value identical to its base value",
        (_ctx: TestContext) => {
          expect(findRedundantOverrides(variables.dialect)).toEqual([]);
        },
      );
    },
  );

  // @add-project-locales @FR1
  f.ScenarioOutline(
    "Every override exists in the base locale",
    ({ Then }, variables) => {
      Then(
        "every <dialect> override key exists in the base locale",
        (_ctx: TestContext) => {
          expect(findOrphanOverrides(variables.dialect)).toEqual([]);
        },
      );
    },
  );

  // @add-project-locales @FR2
  f.ScenarioOutline(
    "Override set is derived from the term-mentioning base keys",
    ({ When, Then }, variables) => {
      When(
        "the term regex is applied to every value of the base locale",
        (_ctx: TestContext) => {
          expect(dialectsByCode[variables.dialect].termRegex).toBeInstanceOf(
            RegExp,
          );
        },
      );
      Then(
        "the set of matching keys equals the normative inventory of <dialect>",
        (_ctx: TestContext) => {
          const { inventory } = dialectsByCode[variables.dialect];
          expect(deriveTermMentioningKeys(variables.dialect)).toEqual(
            Object.keys(inventory).sort(),
          );
        },
      );
    },
  );

  // @add-project-locales @FR2 @FR3
  f.ScenarioOutline(
    "Dialect content equals the normative inventory exactly",
    ({ Then }, variables) => {
      Then(
        "the <dialect> overrides equal the normative inventory exactly",
        (_ctx: TestContext) => {
          const { overrides, inventory } = dialectsByCode[variables.dialect];
          expect(overrides).toEqual(inventory);
        },
      );
    },
  );

  // @add-project-locales @FR3
  f.ScenarioOutline(
    "No goal terminology survives in overrides",
    ({ Then }, variables) => {
      Then(
        "no <dialect> override value matches the base-language term regex",
        (_ctx: TestContext) => {
          expect(findSurvivingTermOverrides(variables.dialect)).toEqual([]);
        },
      );
    },
  );

  // @add-project-locales @FR3
  f.Scenario("Russian overrides use masculine gender agreement", ({ Then }) => {
    Then("the ru-project dialect values are:", (_ctx: TestContext, table) => {
      expectDialectValues(RU_PROJECT_DIALECT, table);
    });
  });

  // @add-project-locales @FR4
  f.ScenarioOutline(
    "Overrides keep the placeholders of their base phrases",
    ({ Then }, variables) => {
      Then(
        "every <dialect> override contains exactly the placeholders of its base value",
        (_ctx: TestContext) => {
          expect(findPlaceholderMismatches(variables.dialect)).toEqual([]);
        },
      );
    },
  );

  // @add-project-locales @FR4
  f.ScenarioOutline(
    "Overrides keep the plural-suffix structure of their base phrases",
    ({ Then }, variables) => {
      Then(
        "every overridden plural group of <dialect> contains exactly the base suffix set",
        (_ctx: TestContext) => {
          expect(findPluralSuffixMismatches(variables.dialect)).toEqual([]);
        },
      );
    },
  );

  // @add-project-locales @FR5
  f.Scenario(
    "English dialect metadata identifies the terminology variant",
    ({ Then }) => {
      Then("en-project locale metadata is:", (_ctx: TestContext, table) => {
        expectDialectMetadata(EN_PROJECT_DIALECT, table);
      });
    },
  );

  // @add-project-locales @FR5
  f.Scenario(
    "Russian dialect metadata identifies the terminology variant",
    ({ Then }) => {
      Then("ru-project locale metadata is:", (_ctx: TestContext, table) => {
        expectDialectMetadata(RU_PROJECT_DIALECT, table);
      });
    },
  );

  // @add-project-locales @FR7
  f.Scenario(
    "English accessible names follow the terminology substitution",
    ({ Then }) => {
      Then("the en-project dialect values are:", (_ctx: TestContext, table) => {
        expectDialectValues(EN_PROJECT_DIALECT, table);
      });
    },
  );

  // @add-project-locales @FR7
  f.Scenario(
    "Russian accessible names follow the terminology substitution",
    ({ Then }) => {
      Then("the ru-project dialect values are:", (_ctx: TestContext, table) => {
        expectDialectValues(RU_PROJECT_DIALECT, table);
      });
    },
  );

  // @add-project-locales @FR6
  f.Scenario("Base sync status names Supabase unambiguously", ({ Then }) => {
    Then("the base sync-paused wording is:", (_ctx: TestContext, table) => {
      expectBaseSyncPaused(table);
    });
  });
});
