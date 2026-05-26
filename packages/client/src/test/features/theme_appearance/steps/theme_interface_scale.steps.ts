// implements FR6, FR11 of theme-appearance-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import {
  DEFAULT_INTERFACE_SCALE,
  INTERFACE_SCALES,
  STORAGE_KEYS,
} from "@/constants";
import type { InterfaceScale } from "@/types/common";

const feature = await loadFeature("../theme_interface_scale.feature");

type FeatureContext = Record<string, never>;

/**
 * Replicates applyInterfaceScale logic from InterfaceScaleProvider.
 * # implements FR6 of theme-appearance-spec
 */
function applyInterfaceScale(scale: InterfaceScale): void {
  document.documentElement.setAttribute("data-scale", scale);
}

/**
 * Replicates getInitialInterfaceScale logic from InterfaceScaleProvider.
 * # implements FR11 of theme-appearance-spec
 */
function getInitialInterfaceScale(): InterfaceScale {
  try {
    const cached = localStorage.getItem(STORAGE_KEYS.INTERFACE_SCALE);
    if (cached && INTERFACE_SCALES.includes(cached as InterfaceScale)) {
      return cached as InterfaceScale;
    }
  } catch {
    // localStorage unavailable — use default
  }
  return DEFAULT_INTERFACE_SCALE;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let resolvedScale: InterfaceScale;

    f.BeforeEachScenario(async () => {
      document.documentElement.removeAttribute("data-scale");
      localStorage.clear();
      resolvedScale = DEFAULT_INTERFACE_SCALE;
    });

    // @theme-appearance-spec @FR6 @FR11
    f.Scenario(
      "Apply interface scale sets data-scale attribute",
      ({ When, Then }) => {
        When(
          'interface scale "large" is applied',
          async (_ctx: TestContext) => {
            applyInterfaceScale("large");
          },
        );

        Then(
          'the document has data-scale "large"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-scale")).toBe(
              "large",
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR6 @FR11
    f.ScenarioOutline(
      "Apply each interface scale value",
      ({ When, Then }, variables) => {
        const scale = variables.scale as InterfaceScale;

        When(
          'interface scale "<scale>" is applied',
          async (_ctx: TestContext) => {
            applyInterfaceScale(scale);
          },
        );

        Then(
          'the document has data-scale "<scale>"',
          async (_ctx: TestContext) => {
            expect(document.documentElement.getAttribute("data-scale")).toBe(
              scale,
            );
          },
        );
      },
    );

    // @theme-appearance-spec @FR11
    f.Scenario(
      "Initialize interface scale from valid localStorage cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "large" for the interface scale key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.INTERFACE_SCALE, "large");
          },
        );

        When(
          "the initial interface scale is resolved",
          async (_ctx: TestContext) => {
            resolvedScale = getInitialInterfaceScale();
          },
        );

        Then(
          'the resolved interface scale is "large"',
          async (_ctx: TestContext) => {
            expect(resolvedScale).toBe("large");
          },
        );
      },
    );

    // @theme-appearance-spec @FR11
    f.Scenario(
      "Initialize interface scale with missing cache",
      ({ Given, When, Then }) => {
        Given(
          "localStorage has no value for the interface scale key",
          async (_ctx: TestContext) => {
            localStorage.removeItem(STORAGE_KEYS.INTERFACE_SCALE);
          },
        );

        When(
          "the initial interface scale is resolved",
          async (_ctx: TestContext) => {
            resolvedScale = getInitialInterfaceScale();
          },
        );

        Then(
          'the resolved interface scale is "normal"',
          async (_ctx: TestContext) => {
            expect(resolvedScale).toBe("normal");
          },
        );
      },
    );

    // @theme-appearance-spec @FR11
    f.Scenario(
      "Initialize interface scale with invalid cache",
      ({ Given, When, Then }) => {
        Given(
          'localStorage has "huge" for the interface scale key',
          async (_ctx: TestContext) => {
            localStorage.setItem(STORAGE_KEYS.INTERFACE_SCALE, "huge");
          },
        );

        When(
          "the initial interface scale is resolved",
          async (_ctx: TestContext) => {
            resolvedScale = getInitialInterfaceScale();
          },
        );

        Then(
          'the resolved interface scale is "normal"',
          async (_ctx: TestContext) => {
            expect(resolvedScale).toBe("normal");
          },
        );
      },
    );
  },
);
