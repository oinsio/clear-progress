// implements FR7, FR12 of theme-appearance-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { hexToRgb } from "@/utils/colorHelpers";

const feature = await loadFeature("../theme_hex_to_rgb.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let conversionResult: string;
    let thrownError: Error | undefined;

    f.BeforeEachScenario(async () => {
      conversionResult = "";
      thrownError = undefined;
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Convert valid hex with hash prefix", ({ When, Then }) => {
      When('hexToRgb is called with "#ff5733"', async (_ctx: TestContext) => {
        conversionResult = hexToRgb("#ff5733");
      });

      Then('the result is "255 87 51"', async (_ctx: TestContext) => {
        expect(conversionResult).toBe("255 87 51");
      });
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Convert valid hex without hash prefix", ({ When, Then }) => {
      When('hexToRgb is called with "ff5733"', async (_ctx: TestContext) => {
        conversionResult = hexToRgb("ff5733");
      });

      Then('the result is "255 87 51"', async (_ctx: TestContext) => {
        expect(conversionResult).toBe("255 87 51");
      });
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Convert black color", ({ When, Then }) => {
      When('hexToRgb is called with "#000000"', async (_ctx: TestContext) => {
        conversionResult = hexToRgb("#000000");
      });

      Then('the result is "0 0 0"', async (_ctx: TestContext) => {
        expect(conversionResult).toBe("0 0 0");
      });
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Convert white color", ({ When, Then }) => {
      When('hexToRgb is called with "#ffffff"', async (_ctx: TestContext) => {
        conversionResult = hexToRgb("#ffffff");
      });

      Then('the result is "255 255 255"', async (_ctx: TestContext) => {
        expect(conversionResult).toBe("255 255 255");
      });
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Convert uppercase hex", ({ When, Then }) => {
      When('hexToRgb is called with "#FF5733"', async (_ctx: TestContext) => {
        conversionResult = hexToRgb("#FF5733");
      });

      Then('the result is "255 87 51"', async (_ctx: TestContext) => {
        expect(conversionResult).toBe("255 87 51");
      });
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Reject invalid hex string", ({ When, Then }) => {
      When('hexToRgb is called with "xyz"', async (_ctx: TestContext) => {
        try {
          hexToRgb("xyz");
        } catch (e) {
          thrownError = e as Error;
        }
      });

      Then(
        'an error is thrown containing "Invalid hex color format"',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError?.message).toContain("Invalid hex color format");
        },
      );
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Reject short hex format", ({ When, Then }) => {
      When('hexToRgb is called with "#fff"', async (_ctx: TestContext) => {
        try {
          hexToRgb("#fff");
        } catch (e) {
          thrownError = e as Error;
        }
      });

      Then(
        'an error is thrown containing "Invalid hex color format"',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError?.message).toContain("Invalid hex color format");
        },
      );
    });

    // @theme-appearance-spec @FR7 @FR12
    f.Scenario("Reject empty string", ({ When, Then }) => {
      When('hexToRgb is called with ""', async (_ctx: TestContext) => {
        try {
          hexToRgb("");
        } catch (e) {
          thrownError = e as Error;
        }
      });

      Then(
        'an error is thrown containing "Invalid hex color format"',
        async (_ctx: TestContext) => {
          expect(thrownError).toBeDefined();
          expect(thrownError?.message).toContain("Invalid hex color format");
        },
      );
    });
  },
);
