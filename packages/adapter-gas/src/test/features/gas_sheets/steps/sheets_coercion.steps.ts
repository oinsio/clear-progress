// implements FR9 of gas-adapter-specs-and-bdd
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  coerceSheetBool,
  coerceSheetBox,
  coerceSheetGoalStatus,
  isDateOnlyColumn,
  normalizeToSheetDate,
  toISODateValue,
  toISOStringValue,
} from "../../../../server/helpers/constants";

const feature = await loadFeature("../sheets_coercion.feature");

type FeatureContext = Record<string, never>;

let boolResult: boolean;
let stringResult: string;
let isDateOnly: boolean;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Boolean true from native boolean", ({ When, Then }) => {
      When("coercing native boolean true", (_ctx: TestContext) => {
        boolResult = coerceSheetBool(true);
      });
      Then("boolean result is true", (_ctx: TestContext) => {
        expect(boolResult).toBe(true);
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Boolean true from sheet string TRUE", ({ When, Then }) => {
      When('coercing sheet string "TRUE"', (_ctx: TestContext) => {
        boolResult = coerceSheetBool("TRUE");
      });
      Then("boolean result is true", (_ctx: TestContext) => {
        expect(boolResult).toBe(true);
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Boolean false from native boolean false", ({ When, Then }) => {
      When("coercing native boolean false", (_ctx: TestContext) => {
        boolResult = coerceSheetBool(false);
      });
      Then("boolean result is false", (_ctx: TestContext) => {
        expect(boolResult).toBe(false);
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Boolean false from empty value", ({ When, Then }) => {
      When("coercing empty string", (_ctx: TestContext) => {
        boolResult = coerceSheetBool("");
      });
      Then("boolean result is false", (_ctx: TestContext) => {
        expect(boolResult).toBe(false);
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Boolean false from null", ({ When, Then }) => {
      When("coercing null value", (_ctx: TestContext) => {
        boolResult = coerceSheetBool(null);
      });
      Then("boolean result is false", (_ctx: TestContext) => {
        expect(boolResult).toBe(false);
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Timestamp from Date object", ({ When, Then }) => {
      When("converting Date object to ISO string", (_ctx: TestContext) => {
        stringResult = toISOStringValue(new Date("2025-01-15T10:30:00.000Z"));
      });
      Then("ISO string has milliseconds suffix", (_ctx: TestContext) => {
        expect(stringResult).toBe("2025-01-15T10:30:00.000Z");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Timestamp normalizes missing fractional seconds",
      ({ When, Then }) => {
        When(
          "converting timestamp without fractional seconds",
          (_ctx: TestContext) => {
            stringResult = toISOStringValue("2025-01-15T10:30:00Z");
          },
        );
        Then(
          "fractional seconds are padded to three digits",
          (_ctx: TestContext) => {
            expect(stringResult).toBe("2025-01-15T10:30:00.000Z");
          },
        );
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Timestamp preserves already normalized value",
      ({ When, Then }) => {
        When("converting already normalized timestamp", (_ctx: TestContext) => {
          stringResult = toISOStringValue("2025-01-15T10:30:00.123Z");
        });
        Then("timestamp is returned unchanged", (_ctx: TestContext) => {
          expect(stringResult).toBe("2025-01-15T10:30:00.123Z");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Timestamp from empty value returns empty", ({ When, Then }) => {
      When("converting empty value to ISO string", (_ctx: TestContext) => {
        stringResult = toISOStringValue("");
      });
      Then("ISO string result is empty", (_ctx: TestContext) => {
        expect(stringResult).toBe("");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Date-only from Date object", ({ When, Then }) => {
      When("converting Date object to ISO date", (_ctx: TestContext) => {
        stringResult = toISODateValue(new Date("2025-01-15T10:30:00.000Z"));
      });
      Then("ISO date contains only date part", (_ctx: TestContext) => {
        expect(stringResult).toBe("2025-01-15");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Date-only strips apostrophe prefix", ({ When, Then }) => {
      When(
        "converting apostrophe-prefixed date string",
        (_ctx: TestContext) => {
          stringResult = toISODateValue("'2025-01-15");
        },
      );
      Then("apostrophe is removed from date", (_ctx: TestContext) => {
        expect(stringResult).toBe("2025-01-15");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Date-only from ISO timestamp extracts date",
      ({ When, Then }) => {
        When("converting ISO timestamp to date-only", (_ctx: TestContext) => {
          stringResult = toISODateValue("2025-01-15T10:30:00.000Z");
        });
        Then("only date portion is returned", (_ctx: TestContext) => {
          expect(stringResult).toBe("2025-01-15");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Date-only from empty returns empty", ({ When, Then }) => {
      When("converting empty value to ISO date", (_ctx: TestContext) => {
        stringResult = toISODateValue("");
      });
      Then("ISO date result is empty", (_ctx: TestContext) => {
        expect(stringResult).toBe("");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Normalize date adds apostrophe for sheet storage",
      ({ When, Then }) => {
        When("normalizing ISO date for sheet storage", (_ctx: TestContext) => {
          stringResult = normalizeToSheetDate("2025-01-15");
        });
        Then("result has leading apostrophe", (_ctx: TestContext) => {
          expect(stringResult).toBe("'2025-01-15");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Normalize date preserves existing apostrophe",
      ({ When, Then }) => {
        When(
          "normalizing already apostrophe-prefixed date",
          (_ctx: TestContext) => {
            stringResult = normalizeToSheetDate("'2025-01-15");
          },
        );
        Then("apostrophe-prefixed date is unchanged", (_ctx: TestContext) => {
          expect(stringResult).toBe("'2025-01-15");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Normalize date from empty returns empty", ({ When, Then }) => {
      When("normalizing empty value for sheet date", (_ctx: TestContext) => {
        stringResult = normalizeToSheetDate("");
      });
      Then("normalized date result is empty", (_ctx: TestContext) => {
        expect(stringResult).toBe("");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Normalize date from null returns empty", ({ When, Then }) => {
      When("normalizing null for sheet date", (_ctx: TestContext) => {
        stringResult = normalizeToSheetDate(null);
      });
      Then("normalized date result is empty", (_ctx: TestContext) => {
        expect(stringResult).toBe("");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Box coercion with valid value", ({ When, Then }) => {
      When('coercing valid box value "today"', (_ctx: TestContext) => {
        stringResult = coerceSheetBox("today");
      });
      Then('box result is "today"', (_ctx: TestContext) => {
        expect(stringResult).toBe("today");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Box coercion with invalid value falls back to default",
      ({ When, Then }) => {
        When(
          'coercing invalid box value "nonexistent"',
          (_ctx: TestContext) => {
            stringResult = coerceSheetBox("nonexistent");
          },
        );
        Then('box result is "inbox"', (_ctx: TestContext) => {
          expect(stringResult).toBe("inbox");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Box coercion with missing value falls back to default",
      ({ When, Then }) => {
        When("coercing missing box value", (_ctx: TestContext) => {
          stringResult = coerceSheetBox(undefined);
        });
        Then('box result is "inbox"', (_ctx: TestContext) => {
          expect(stringResult).toBe("inbox");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario("Goal status coercion with valid value", ({ When, Then }) => {
      When('coercing valid goal status "in_progress"', (_ctx: TestContext) => {
        stringResult = coerceSheetGoalStatus("in_progress");
      });
      Then('goal status result is "in_progress"', (_ctx: TestContext) => {
        expect(stringResult).toBe("in_progress");
      });
    });

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Goal status coercion with invalid value falls back to default",
      ({ When, Then }) => {
        When('coercing invalid goal status "unknown"', (_ctx: TestContext) => {
          stringResult = coerceSheetGoalStatus("unknown");
        });
        Then('goal status result is "planning"', (_ctx: TestContext) => {
          expect(stringResult).toBe("planning");
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Date-only column detection for Tasks sheet",
      ({ When, Then }) => {
        When(
          'checking if "next_date" is date-only in "Tasks"',
          (_ctx: TestContext) => {
            isDateOnly = isDateOnlyColumn("Tasks", "next_date");
          },
        );
        Then("column is date-only", (_ctx: TestContext) => {
          expect(isDateOnly).toBe(true);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Non-date column detection for Tasks sheet",
      ({ When, Then }) => {
        When(
          'checking if "name" is date-only in "Tasks"',
          (_ctx: TestContext) => {
            isDateOnly = isDateOnlyColumn("Tasks", "name");
          },
        );
        Then("column is not date-only", (_ctx: TestContext) => {
          expect(isDateOnly).toBe(false);
        });
      },
    );

    // @gas-adapter-specs-and-bdd @FR9
    f.Scenario(
      "Date-only column detection for sheet without date columns",
      ({ When, Then }) => {
        When(
          'checking if "name" is date-only in "Goals"',
          (_ctx: TestContext) => {
            isDateOnly = isDateOnlyColumn("Goals", "name");
          },
        );
        Then("column is not date-only", (_ctx: TestContext) => {
          expect(isDateOnly).toBe(false);
        });
      },
    );
  },
);
