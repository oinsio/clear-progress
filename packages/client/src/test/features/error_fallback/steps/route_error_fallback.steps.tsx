import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { expect, type TestContext, vi } from "vitest";

const mockRouteError = new Error("Test route error");

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useRouteError: () => mockRouteError };
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

import { RouteErrorFallback } from "@/components/RouteErrorFallback";

const feature = await loadFeature("../route_error_fallback.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  f.BeforeEachScenario(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // @miss-ui-specs @FR3
  f.Scenario(
    "Route error is logged and ErrorFallback is rendered",
    ({ Given, When, Then, And }) => {
      Given("a route error has occurred", (_ctx: TestContext) => {
        // Route error is set up via the mocked useRouteError
        expect(mockRouteError).toBeInstanceOf(Error);
      });

      When("RouteErrorFallback is rendered", (_ctx: TestContext) => {
        render(<RouteErrorFallback />);
      });

      Then("the error is logged to console", (_ctx: TestContext) => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          "[RouteErrorFallback]",
          mockRouteError,
        );
      });

      And("ErrorFallback UI is displayed", (_ctx: TestContext) => {
        const heading = screen.getByRole("heading", { level: 1 });
        expect(heading).toHaveTextContent("error.title");
      });
    },
  );
});
