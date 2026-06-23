import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { expect, type TestContext, vi } from "vitest";

const mockReload = vi.fn();
Object.defineProperty(window, "location", {
  value: { reload: mockReload },
  writable: true,
});

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

import { ErrorFallback } from "@/components/ErrorFallback";

const feature = await loadFeature("../error_fallback_display.feature");

describeFeature(feature, (f: FeatureDescriibeCallbackParams) => {
  f.BeforeEachScenario(() => {
    cleanup();
    vi.clearAllMocks();
  });

  // @miss-ui-specs @FR1
  f.Scenario(
    "Error screen displays localized content",
    ({ When, Then, And }) => {
      When("ErrorFallback is rendered", (_ctx: TestContext) => {
        render(<ErrorFallback />);
      });

      Then(
        "a heading with translated error title is visible",
        (_ctx: TestContext) => {
          const heading = screen.getByRole("heading", { level: 1 });
          expect(heading).toHaveTextContent("error.title");
        },
      );

      And(
        "a description with translated error description is visible",
        (_ctx: TestContext) => {
          expect(screen.getByText("error.description")).toBeInTheDocument();
        },
      );

      And(
        "a reload button with translated error reload text is visible",
        (_ctx: TestContext) => {
          const reloadButton = screen.getByRole("button", {
            name: "error.reload",
          });
          expect(reloadButton).toBeInTheDocument();
        },
      );
    },
  );

  // @miss-ui-specs @FR2
  f.Scenario("Reload button reloads the page", ({ When, And, Then }) => {
    When("ErrorFallback is rendered", (_ctx: TestContext) => {
      render(<ErrorFallback />);
    });

    And("user clicks the reload button", async (_ctx: TestContext) => {
      const user = userEvent.setup();
      const reloadButton = screen.getByRole("button", {
        name: "error.reload",
      });
      await user.click(reloadButton);
    });

    Then("window.location.reload is called", (_ctx: TestContext) => {
      expect(mockReload).toHaveBeenCalledTimes(1);
    });
  });

  // @miss-ui-specs @UX1
  f.Scenario("Layout is centered on full screen", ({ When, Then }) => {
    When("ErrorFallback is rendered", (_ctx: TestContext) => {
      render(<ErrorFallback />);
    });

    Then(
      "content container has min-height screen and centering styles",
      (_ctx: TestContext) => {
        const heading = screen.getByRole("heading", { level: 1 });
        const container = heading.closest("div");
        expect(container).not.toBeNull();
        expect(container?.className).toContain("min-h-screen");
        expect(container?.className).toContain("items-center");
        expect(container?.className).toContain("justify-center");
      },
    );
  });
});
