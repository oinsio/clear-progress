// implements FR4, FR10 of theme-appearance-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { hexToRgb } from "@/utils/colorHelpers";
import {
  createMetaThemeColorTag,
  removeMetaThemeColorTag,
} from "./theme-test-helpers";

const feature = await loadFeature("../theme_custom_accent.feature");

type FeatureContext = Record<string, never>;

const DEFAULT_CUSTOM_LIGHT = "#fcd34d";
const DEFAULT_CUSTOM_DARK = "#14b8a6";

/**
 * Replicates applyAccentColor logic for custom colors from ThemeProvider.
 * # implements FR4 of theme-appearance-spec
 */
function applyCustomAccentColor(
  customLight?: string,
  customDark?: string,
): void {
  document.documentElement.setAttribute("data-accent", "custom");

  const isDark = document.documentElement.classList.contains("dark");
  const hex = isDark
    ? customDark || DEFAULT_CUSTOM_DARK
    : customLight || DEFAULT_CUSTOM_LIGHT;

  const rgb = hexToRgb(hex);
  document.documentElement.style.setProperty("--color-accent", rgb);

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    metaThemeColor.setAttribute("content", hex);
  }
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(async () => {
      document.documentElement.removeAttribute("data-accent");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.removeProperty("--color-accent");
      removeMetaThemeColorTag();
    });

    // @theme-appearance-spec @FR4 @FR10
    f.Scenario(
      "Apply custom accent color in light mode",
      ({ Given, When, Then, And }) => {
        Given("the document is in light mode", async (_ctx: TestContext) => {
          document.documentElement.classList.remove("dark");
        });

        When(
          'custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"',
          async (_ctx: TestContext) => {
            applyCustomAccentColor("#ff5733", "#00ff00");
          },
        );

        Then(
          'the --color-accent CSS variable is set to "255 87 51"',
          async (_ctx: TestContext) => {
            expect(
              document.documentElement.style.getPropertyValue("--color-accent"),
            ).toBe("255 87 51");
          },
        );

        And(
          'the document has data-accent "custom"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-accent")).toBe(
              "custom",
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR4 @FR10
    f.Scenario(
      "Apply custom accent color in dark mode",
      ({ Given, When, Then, And }) => {
        Given("the document is in dark mode", async (_ctx: TestContext) => {
          document.documentElement.classList.add("dark");
        });

        When(
          'custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"',
          async (_ctx: TestContext) => {
            applyCustomAccentColor("#ff5733", "#00ff00");
          },
        );

        Then(
          'the --color-accent CSS variable is set to "0 255 0"',
          async (_ctx: TestContext) => {
            expect(
              document.documentElement.style.getPropertyValue("--color-accent"),
            ).toBe("0 255 0");
          },
        );

        And(
          'the document has data-accent "custom"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-accent")).toBe(
              "custom",
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR4 @FR10
    f.Scenario(
      "Apply custom accent with default light color",
      ({ Given, When, Then }) => {
        Given("the document is in light mode", async (_ctx: TestContext) => {
          document.documentElement.classList.remove("dark");
        });

        When(
          "custom accent color is applied without custom hex values",
          async (_ctx: TestContext) => {
            applyCustomAccentColor();
          },
        );

        Then(
          'the --color-accent CSS variable is set to "252 211 77"',
          async (_ctx: TestContext) => {
            expect(
              document.documentElement.style.getPropertyValue("--color-accent"),
            ).toBe("252 211 77");
          },
        );
      },
    );

    // @theme-appearance-spec @FR4 @FR10
    f.Scenario(
      "Apply custom accent with default dark color",
      ({ Given, When, Then }) => {
        Given("the document is in dark mode", async (_ctx: TestContext) => {
          document.documentElement.classList.add("dark");
        });

        When(
          "custom accent color is applied without custom hex values",
          async (_ctx: TestContext) => {
            applyCustomAccentColor();
          },
        );

        Then(
          'the --color-accent CSS variable is set to "20 184 166"',
          async (_ctx: TestContext) => {
            expect(
              document.documentElement.style.getPropertyValue("--color-accent"),
            ).toBe("20 184 166");
          },
        );
      },
    );

    // @theme-appearance-spec @FR4 @FR10
    f.Scenario(
      "Meta theme-color updated for custom accent",
      ({ Given, And, When, Then }) => {
        Given("a meta theme-color tag exists", async (_ctx: TestContext) => {
          createMetaThemeColorTag();
        });

        And("the document is in light mode", async (_ctx: TestContext) => {
          document.documentElement.classList.remove("dark");
        });

        When(
          'custom accent color is applied with light hex "#ff5733" and dark hex "#00ff00"',
          async (_ctx: TestContext) => {
            applyCustomAccentColor("#ff5733", "#00ff00");
          },
        );

        Then(
          'the meta theme-color content is "#ff5733"',
          async (_ctx: TestContext) => {
            const metaTag = document.querySelector('meta[name="theme-color"]');
            expect(metaTag?.getAttribute("content")).toBe("#ff5733");
          },
        );
      },
    );
  },
);
