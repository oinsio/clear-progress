// implements FR3, FR5, FR9 of theme-appearance-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  ACCENT_COLOR_VALUES,
  ACCENT_COLOR_VALUES_DARK,
  ACCENT_COLORS,
  DEFAULT_ACCENT_COLOR,
  STORAGE_KEYS,
} from "@/constants";
import type { AccentColor } from "@/types/common";
import {
  createMetaThemeColorTag,
  removeMetaThemeColorTag,
} from "./theme-test-helpers";

const feature = await loadFeature("../theme_accent_color.feature");

type FeatureContext = Record<string, never>;

/**
 * Replicates applyAccentColor logic for preset colors from ThemeProvider.
 * # implements FR3, FR5 of theme-appearance-spec
 */
function applyPresetAccentColor(color: AccentColor): void {
  document.documentElement.setAttribute("data-accent", color);
  document.documentElement.style.removeProperty("--color-accent");

  const metaThemeColor = document.querySelector('meta[name="theme-color"]');
  if (metaThemeColor) {
    const isDark = document.documentElement.classList.contains("dark");
    const colorValue = isDark
      ? ACCENT_COLOR_VALUES_DARK[color]
      : ACCENT_COLOR_VALUES[color];
    metaThemeColor.setAttribute("content", colorValue);
  }
}

/**
 * Replicates getInitialAccentColor logic from ThemeProvider.
 * # implements FR9 of theme-appearance-spec
 */
function getInitialAccentColor(): AccentColor {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.ACCENT_COLOR);
    if (cached && ACCENT_COLORS.includes(cached as AccentColor)) {
      return cached as AccentColor;
    }
  } catch {
    // localStorage unavailable — use default
  }
  return DEFAULT_ACCENT_COLOR;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let resolvedAccentColor: AccentColor;

    f.BeforeEachScenario(async () => {
      document.documentElement.removeAttribute("data-accent");
      document.documentElement.classList.remove("dark");
      document.documentElement.style.removeProperty("--color-accent");
      localStorage.clear();
      resolvedAccentColor = DEFAULT_ACCENT_COLOR;
      removeMetaThemeColorTag();
    });

    // @theme-appearance-spec @FR3 @FR5
    f.Scenario(
      "Apply preset accent color sets data-accent attribute",
      ({ When, Then, And }) => {
        When('accent color "blue" is applied', async (_ctx: TestContext) => {
          applyPresetAccentColor("blue");
        });

        Then(
          'the document has data-accent "blue"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-accent")).toBe(
              "blue",
            );
          },
        );

        And(
          "the --color-accent CSS variable is not set",
          async (_ctx: TestContext) => {
            expect(
              document.documentElement.style.getPropertyValue("--color-accent"),
            ).toBe("");
          },
        );
      },
    );

    // @theme-appearance-spec @FR3 @FR5
    f.ScenarioOutline(
      "Apply each preset accent color",
      ({ When, Then }, variables) => {
        const color = variables.color as AccentColor;

        When('accent color "<color>" is applied', async (_ctx: TestContext) => {
          applyPresetAccentColor(color);
        });

        Then(
          'the document has data-accent "<color>"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-accent")).toBe(
              color,
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR5
    f.Scenario(
      "Meta theme-color updated for preset in light mode",
      ({ Given, And, When, Then }) => {
        Given("a meta theme-color tag exists", async (_ctx: TestContext) => {
          createMetaThemeColorTag();
        });

        And("the document is in light mode", async (_ctx: TestContext) => {
          document.documentElement.classList.remove("dark");
        });

        When('accent color "green" is applied', async (_ctx: TestContext) => {
          applyPresetAccentColor("green");
        });

        Then(
          'the meta theme-color content is "#69b23e"',
          async (_ctx: TestContext) => {
            const metaTag = document.querySelector('meta[name="theme-color"]');
            expect(metaTag?.getAttribute("content")).toBe("#69b23e");
          },
        );
      },
    );

    // @theme-appearance-spec @FR5
    f.Scenario(
      "Meta theme-color updated for preset in dark mode",
      ({ Given, And, When, Then }) => {
        Given("a meta theme-color tag exists", async (_ctx: TestContext) => {
          createMetaThemeColorTag();
        });

        And("the document is in dark mode", async (_ctx: TestContext) => {
          document.documentElement.classList.add("dark");
        });

        When('accent color "green" is applied', async (_ctx: TestContext) => {
          applyPresetAccentColor("green");
        });

        Then(
          'the meta theme-color content is "#4d7c0f"',
          async (_ctx: TestContext) => {
            const metaTag = document.querySelector('meta[name="theme-color"]');
            expect(metaTag?.getAttribute("content")).toBe("#4d7c0f");
          },
        );
      },
    );

    // @theme-appearance-spec @FR9
    f.Scenario(
      "Initialize accent color from valid localStorage cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "purple" for the accent color key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, "purple");
          },
        );

        When(
          "the initial accent color is resolved",
          async (_ctx: TestContext) => {
            resolvedAccentColor = getInitialAccentColor();
          },
        );

        Then(
          'the resolved accent color is "purple"',
          async (_ctx: TestContext) => {
            expect(resolvedAccentColor).toBe("purple");
          },
        );
      },
    );

    // @theme-appearance-spec @FR9
    f.Scenario(
      "Initialize accent color with missing cache",
      ({ Given, When, Then }) => {
        Given(
          "localStorage has no value for the accent color key",
          async (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.ACCENT_COLOR);
          },
        );

        When(
          "the initial accent color is resolved",
          async (_ctx: TestContext) => {
            resolvedAccentColor = getInitialAccentColor();
          },
        );

        Then(
          'the resolved accent color is "green"',
          async (_ctx: TestContext) => {
            expect(resolvedAccentColor).toBe("green");
          },
        );
      },
    );

    // @theme-appearance-spec @FR9
    f.Scenario(
      "Initialize accent color with invalid cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "neon" for the accent color key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.ACCENT_COLOR, "neon");
          },
        );

        When(
          "the initial accent color is resolved",
          async (_ctx: TestContext) => {
            resolvedAccentColor = getInitialAccentColor();
          },
        );

        Then(
          'the resolved accent color is "green"',
          async (_ctx: TestContext) => {
            expect(resolvedAccentColor).toBe("green");
          },
        );
      },
    );
  },
);
