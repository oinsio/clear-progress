// implements FR1, FR2, FR8 of theme-appearance-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { COLOR_SCHEMES, DEFAULT_COLOR_SCHEME, STORAGE_KEYS } from "@/constants";
import type { ColorScheme } from "@/types/common";

const feature = await loadFeature("../theme_color_scheme.feature");

type FeatureContext = Record<string, never>;

/**
 * Replicates applyColorScheme logic from ThemeProvider.
 * The original function is module-private.
 * # implements FR1 of theme-appearance-spec
 */
function applyColorScheme(scheme: ColorScheme): void {
  const isDark =
    scheme === "dark" ||
    (scheme === "system" &&
      window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
}

/**
 * Replicates getInitialColorScheme logic from ThemeProvider.
 * # implements FR8 of theme-appearance-spec
 */
function getInitialColorScheme(): ColorScheme {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.COLOR_SCHEME);
    if (cached && COLOR_SCHEMES.includes(cached as ColorScheme)) {
      return cached as ColorScheme;
    }
  } catch {
    // localStorage unavailable — use default
  }
  return DEFAULT_COLOR_SCHEME;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let resolvedScheme: ColorScheme;

    f.BeforeEachScenario(async () => {
      document.documentElement.classList.remove("dark");
      localStorage.clear();
      resolvedScheme = DEFAULT_COLOR_SCHEME;
    });

    // @theme-appearance-spec @FR1
    f.Scenario(
      "Apply light color scheme removes dark class",
      ({ Given, When, Then }) => {
        Given(
          'the document has the "dark" class',
          async (_ctx: TestContext) => {
            document.documentElement.classList.add("dark");
          },
        );

        When('color scheme "light" is applied', async (_ctx: TestContext) => {
          applyColorScheme("light");
        });

        Then(
          'the document does not have the "dark" class',
          async (_ctx: TestContext) => {
            expect(document.documentElement.classList.contains("dark")).toBe(
              false,
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR1
    f.Scenario(
      "Apply dark color scheme adds dark class",
      ({ Given, When, Then }) => {
        Given(
          'the document does not have the "dark" class',
          async (_ctx: TestContext) => {
            document.documentElement.classList.remove("dark");
          },
        );

        When('color scheme "dark" is applied', async (_ctx: TestContext) => {
          applyColorScheme("dark");
        });

        Then('the document has the "dark" class', async (_ctx: TestContext) => {
          expect(document.documentElement.classList.contains("dark")).toBe(
            true,
          );
        });
      },
    );

    // @theme-appearance-spec @FR1 @FR2
    f.Scenario(
      "Apply system color scheme with dark preference",
      ({ Given, When, Then }) => {
        Given("the system prefers dark mode", async (_ctx: TestContext) => {
          Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (query: string) => ({
              matches: query === "(prefers-color-scheme: dark)",
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
            }),
          });
        });

        When('color scheme "system" is applied', async (_ctx: TestContext) => {
          applyColorScheme("system");
        });

        Then('the document has the "dark" class', async (_ctx: TestContext) => {
          expect(document.documentElement.classList.contains("dark")).toBe(
            true,
          );
        });
      },
    );

    // @theme-appearance-spec @FR1 @FR2
    f.Scenario(
      "Apply system color scheme with light preference",
      ({ Given, When, Then }) => {
        Given("the system prefers light mode", async (_ctx: TestContext) => {
          Object.defineProperty(window, "matchMedia", {
            writable: true,
            value: (query: string) => ({
              matches: false,
              media: query,
              onchange: null,
              addListener: () => {},
              removeListener: () => {},
              addEventListener: () => {},
              removeEventListener: () => {},
              dispatchEvent: () => false,
            }),
          });
        });

        When('color scheme "system" is applied', async (_ctx: TestContext) => {
          applyColorScheme("system");
        });

        Then(
          'the document does not have the "dark" class',
          async (_ctx: TestContext) => {
            expect(document.documentElement.classList.contains("dark")).toBe(
              false,
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR8
    f.Scenario(
      "Initialize color scheme from valid localStorage cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "dark" for the color scheme key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, "dark");
          },
        );

        When(
          "the initial color scheme is resolved",
          async (_ctx: TestContext) => {
            resolvedScheme = getInitialColorScheme();
          },
        );

        Then(
          'the resolved color scheme is "dark"',
          async (_ctx: TestContext) => {
            expect(resolvedScheme).toBe("dark");
          },
        );
      },
    );

    // @theme-appearance-spec @FR8
    f.Scenario(
      "Initialize color scheme with missing cache",
      ({ Given, When, Then }) => {
        Given(
          "localStorage has no value for the color scheme key",
          async (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.COLOR_SCHEME);
          },
        );

        When(
          "the initial color scheme is resolved",
          async (_ctx: TestContext) => {
            resolvedScheme = getInitialColorScheme();
          },
        );

        Then(
          'the resolved color scheme is "system"',
          async (_ctx: TestContext) => {
            expect(resolvedScheme).toBe("system");
          },
        );
      },
    );

    // @theme-appearance-spec @FR8
    f.Scenario(
      "Initialize color scheme with invalid cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "invalid_scheme" for the color scheme key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.COLOR_SCHEME, "invalid_scheme");
          },
        );

        When(
          "the initial color scheme is resolved",
          async (_ctx: TestContext) => {
            resolvedScheme = getInitialColorScheme();
          },
        );

        Then(
          'the resolved color scheme is "system"',
          async (_ctx: TestContext) => {
            expect(resolvedScheme).toBe("system");
          },
        );
      },
    );
  },
);
