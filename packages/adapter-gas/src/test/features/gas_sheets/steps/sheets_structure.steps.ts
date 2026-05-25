// implements FR8 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  colMap,
  DATE_ONLY_COLUMNS,
  SHEET_HEADERS,
  SHEET_NAMES,
} from "../../../../server/helpers/constants";

const feature = await loadFeature("../sheets_structure.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Eight sheet names are defined", ({ Then }) => {
      Then("SHEET_NAMES contains exactly 8 entries", (_ctx: TestContext) => {
        expect(Object.keys(SHEET_NAMES)).toHaveLength(8);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Tasks sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.TASKS equals "Tasks"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.TASKS).toBe("Tasks");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Goals sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.GOALS equals "Goals"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.GOALS).toBe("Goals");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Contexts sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.CONTEXTS equals "Contexts"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.CONTEXTS).toBe("Contexts");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Categories sheet name matches constant", ({ Then }) => {
      Then(
        'SHEET_NAMES.CATEGORIES equals "Categories"',
        (_ctx: TestContext) => {
          expect(SHEET_NAMES.CATEGORIES).toBe("Categories");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Checklist Items sheet name matches constant", ({ Then }) => {
      Then(
        'SHEET_NAMES.CHECKLIST_ITEMS equals "Checklist_Items"',
        (_ctx: TestContext) => {
          expect(SHEET_NAMES.CHECKLIST_ITEMS).toBe("Checklist_Items");
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Ideas sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.IDEAS equals "Ideas"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.IDEAS).toBe("Ideas");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Settings sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.SETTINGS equals "Settings"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.SETTINGS).toBe("Settings");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Meta sheet name matches constant", ({ Then }) => {
      Then('SHEET_NAMES.META equals "Meta"', (_ctx: TestContext) => {
        expect(SHEET_NAMES.META).toBe("Meta");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Tasks sheet has 19 columns", ({ Then }) => {
      Then('"Tasks" sheet has 19 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.TASKS]).toHaveLength(19);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Tasks sheet starts with id column", ({ Then }) => {
      Then('"Tasks" sheet first header is "id"', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.TASKS][0]).toBe("id");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Tasks sheet ends with revision column", ({ Then }) => {
      Then('"Tasks" sheet last header is "revision"', (_ctx: TestContext) => {
        const headers = SHEET_HEADERS[SHEET_NAMES.TASKS];
        expect(headers[headers.length - 1]).toBe("revision");
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Goals sheet has 10 columns", ({ Then }) => {
      Then('"Goals" sheet has 10 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.GOALS]).toHaveLength(10);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Contexts sheet has 7 columns", ({ Then }) => {
      Then('"Contexts" sheet has 7 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.CONTEXTS]).toHaveLength(7);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Categories sheet has 7 columns", ({ Then }) => {
      Then('"Categories" sheet has 7 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.CATEGORIES]).toHaveLength(7);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Checklist Items sheet has 9 columns", ({ Then }) => {
      Then('"Checklist_Items" sheet has 9 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.CHECKLIST_ITEMS]).toHaveLength(9);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Ideas sheet has 8 columns", ({ Then }) => {
      Then('"Ideas" sheet has 8 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.IDEAS]).toHaveLength(8);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Settings sheet has 3 columns", ({ Then }) => {
      Then('"Settings" sheet has 3 headers', (_ctx: TestContext) => {
        expect(SHEET_HEADERS[SHEET_NAMES.SETTINGS]).toHaveLength(3);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("colMap returns correct index for Tasks id", ({ Then }) => {
      Then('colMap for "Tasks" maps "id" to index 0', (_ctx: TestContext) => {
        const taskColMap = colMap(SHEET_NAMES.TASKS);
        expect(taskColMap.id).toBe(0);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("colMap returns correct index for Tasks box", ({ Then }) => {
      Then('colMap for "Tasks" maps "box" to index 3', (_ctx: TestContext) => {
        const taskColMap = colMap(SHEET_NAMES.TASKS);
        expect(taskColMap.box).toBe(3);
      });
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario(
      "colMap returns correct index for Tasks revision",
      ({ Then }) => {
        Then(
          'colMap for "Tasks" maps "revision" to index 18',
          (_ctx: TestContext) => {
            const taskColMap = colMap(SHEET_NAMES.TASKS);
            expect(taskColMap.revision).toBe(18);
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("Date-only columns configured for Tasks", ({ Then }) => {
      Then(
        'DATE_ONLY_COLUMNS for "Tasks" contains "next_date" and "appear_date"',
        (_ctx: TestContext) => {
          const taskDateColumns = DATE_ONLY_COLUMNS[SHEET_NAMES.TASKS];
          expect(taskDateColumns).toContain("next_date");
          expect(taskDateColumns).toContain("appear_date");
          expect(taskDateColumns).toHaveLength(2);
        },
      );
    });

    // @gas-adapter-specs-and-bdd @FR8
    f.Scenario("No date-only columns for Goals", ({ Then }) => {
      Then(
        'DATE_ONLY_COLUMNS has no entry for "Goals"',
        (_ctx: TestContext) => {
          expect(DATE_ONLY_COLUMNS[SHEET_NAMES.GOALS]).toBeUndefined();
        },
      );
    });
  },
);
