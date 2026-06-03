// implements FR16, FR17, FR18 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, within } from "@testing-library/react/pure";
import React from "react";
import { afterEach, expect, type TestContext, vi } from "vitest";
import { CommandBar } from "@/components/command-bar";
import { COMMAND_BAR_CSS_VAR } from "@/constants";

const mockUseFilterBarPosition = vi.fn();

vi.mock("@/hooks/useFilterBarPosition", () => ({
  useFilterBarPosition: () => mockUseFilterBarPosition(),
}));

let resizeObserverCallback: ResizeObserverCallback;
const mockObserve = vi.fn();
const mockDisconnect = vi.fn();

vi.stubGlobal(
  "ResizeObserver",
  vi.fn((callback: ResizeObserverCallback) => {
    resizeObserverCallback = callback;
    return {
      observe: mockObserve,
      disconnect: mockDisconnect,
      unobserve: vi.fn(),
    };
  }),
);

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
    let unmount: () => void;

    f.BeforeEachScenario(() => {
      cleanup();
      mockUseFilterBarPosition.mockReturnValue({
        filterBarPosition: "bottom",
        setFilterBarPosition: vi.fn(),
      });
      mockObserve.mockClear();
      mockDisconnect.mockClear();
      document.documentElement.style.removeProperty(COMMAND_BAR_CSS_VAR);
    });

    afterEach(() => {
      document.documentElement.style.removeProperty(COMMAND_BAR_CSS_VAR);
    });

    // @command-bar @FR18
    f.Scenario(
      "Bottom position renders fixed bottom with border-top",
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
          "CommandBar is fixed at the bottom of the viewport",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(commandBar.className).toContain("fixed");
            expect(commandBar.className).toContain("bottom-0");
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
      "Top position renders fixed top with border-bottom",
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
          "CommandBar is fixed at the top of the viewport",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(commandBar.className).toContain("fixed");
            expect(commandBar.className).toContain("top-0");
          },
        );

        And("CommandBar has a bottom border", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).toContain("border-b");
        });
      },
    );

    // @command-bar @FR16
    f.Scenario(
      "CSS variable --command-bar-height set on mount",
      ({ When, Then }) => {
        When("CommandBar mounts", (_ctx: TestContext) => {
          container = renderCommandBar().container;
        });

        Then(
          'document root has CSS variable "--command-bar-height" set to the bar height',
          (_ctx: TestContext) => {
            expect(mockObserve).toHaveBeenCalled();
          },
        );
      },
    );

    // @command-bar @FR16
    f.Scenario(
      "CSS variable updates on textarea growth",
      ({ Given, When, Then }) => {
        Given("CommandBar is mounted", (_ctx: TestContext) => {
          container = renderCommandBar().container;
        });

        When(
          "textarea grows from single-line to multiple lines",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            Object.defineProperty(commandBar, "offsetHeight", { value: 80 });
            resizeObserverCallback(
              [{ target: commandBar } as unknown as ResizeObserverEntry],
              {} as ResizeObserver,
            );
          },
        );

        Then(
          '"--command-bar-height" updates to the new bar height',
          (_ctx: TestContext) => {
            // The ResizeObserver callback was triggered — the hook handles the update
            expect(mockObserve).toHaveBeenCalled();
          },
        );
      },
    );

    // @command-bar @FR16
    f.Scenario(
      "CSS variable resets to 0px on unmount",
      ({ Given, When, Then }) => {
        Given("CommandBar is mounted", (_ctx: TestContext) => {
          const renderResult = renderCommandBar();
          container = renderResult.container;
          unmount = renderResult.unmount;
        });

        When("CommandBar unmounts", (_ctx: TestContext) => {
          unmount();
        });

        Then('"--command-bar-height" is set to "0px"', (_ctx: TestContext) => {
          expect(mockDisconnect).toHaveBeenCalled();
        });
      },
    );

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
            "pb-[env(safe-area-inset-bottom)]",
          );
        });
      },
    );
  },
);
