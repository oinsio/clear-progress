// implements FR18, NFR-R3 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, within } from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";
import { CommandBar } from "@/components/command-bar";

const mockUseFilterBarPosition = vi.fn();

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => mockUseFilterBarPosition(),
}));

const feature = await loadFeature("../command_bar_position.feature");

type FeatureContext = Record<string, never>;

const PLACEHOLDER_TEXT = "Add a task...";

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

function renderCommandBar() {
  return render(
    React.createElement(CommandBar, {
      entityIcon: StubIcon,
      placeholder: PLACEHOLDER_TEXT,
      onSubmit: vi.fn(),
    }),
  );
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let container: HTMLElement;

    f.BeforeEachScenario(() => {
      cleanup();
      mockUseFilterBarPosition.mockReturnValue({
        filterBarPosition: "bottom",
        setFilterBarPosition: vi.fn(),
      });
    });

    // @command-bar @FR18
    f.Scenario(
      "Bottom position renders with order-last and border-top",
      ({ Given, When, Then, And }) => {
        Given(
          'user preference for position is "bottom"',
          (_ctx: TestContext) => {
            mockUseFilterBarPosition.mockReturnValue({
              filterBarPosition: "bottom",
              setFilterBarPosition: vi.fn(),
            });
          },
        );

        When("CommandBar is rendered", (_ctx: TestContext) => {
          container = renderCommandBar().container;
        });

        Then(
          "CommandBar has order-last class for bottom placement",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(commandBar.className).toContain("order-last");
          },
        );

        And("CommandBar has a top border", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).toContain("border-t");
        });
      },
    );

    // @command-bar @FR18
    f.Scenario(
      "Top position renders with border-bottom",
      ({ Given, When, Then, And }) => {
        Given('user preference for position is "top"', (_ctx: TestContext) => {
          mockUseFilterBarPosition.mockReturnValue({
            filterBarPosition: "top",
            setFilterBarPosition: vi.fn(),
          });
        });

        When("CommandBar is rendered", (_ctx: TestContext) => {
          container = renderCommandBar().container;
        });

        Then(
          "CommandBar does not have order-last class",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(commandBar.className).not.toContain("order-last");
          },
        );

        And("CommandBar has a bottom border", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).toContain("border-b");
        });
      },
    );

    // @command-bar @FR18
    f.Scenario("CommandBar is not fixed positioned", ({ When, Then }) => {
      When("CommandBar is rendered", (_ctx: TestContext) => {
        container = renderCommandBar().container;
      });

      Then(
        "CommandBar does not have fixed positioning",
        (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).not.toContain("fixed");
        },
      );
    });

    // @command-bar @FR18
    f.Scenario(
      "Safe-area-bottom padding applied for bottom position on iOS",
      ({ Given, When, Then }) => {
        Given(
          'user preference for position is "bottom"',
          (_ctx: TestContext) => {
            mockUseFilterBarPosition.mockReturnValue({
              filterBarPosition: "bottom",
              setFilterBarPosition: vi.fn(),
            });
          },
        );

        When("CommandBar is rendered", (_ctx: TestContext) => {
          container = renderCommandBar().container;
        });

        Then("safe-area-bottom padding is applied", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).toContain(
            "pb-[calc(0.5rem+env(safe-area-inset-bottom))]",
          );
        });
      },
    );
  },
);
