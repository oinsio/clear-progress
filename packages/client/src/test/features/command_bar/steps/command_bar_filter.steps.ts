// implements FR5, FR6, FR8, FR9 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  within,
} from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";
import type { CommandBarFilterConfig } from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";

const feature = await loadFeature("../command_bar_filter.feature");

type FeatureContext = Record<string, never>;

const PLACEHOLDER_TEXT = "Add a task...";

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

function createFilterConfig(
  overrides?: Partial<CommandBarFilterConfig>,
): CommandBarFilterConfig {
  return {
    boxes: ["today", "week", "later", "all"],
    activeBox: "today",
    onBoxChange: vi.fn(),
    ...overrides,
  };
}

function renderWithFilter(filterConfig: CommandBarFilterConfig) {
  return render(
    React.createElement(CommandBar, {
      filter: filterConfig,
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
    let filterConfig: CommandBarFilterConfig;

    f.Background(({ Given, And }) => {
      Given(
        "CommandBar is rendered with filter config",
        (_ctx: TestContext) => {
          cleanup();
          filterConfig = createFilterConfig();
          const renderResult = renderWithFilter(filterConfig);
          container = renderResult.container;
        },
      );

      And('active box is "today"', (_ctx: TestContext) => {
        expect(filterConfig.activeBox).toBe("today");
      });
    });

    // @command-bar @FR5 @FR6
    f.Scenario(
      "Filter collapsed shows active box icon and chevron",
      ({ Then, And }) => {
        Then(
          "collapsed filter shows the active box icon",
          (_ctx: TestContext) => {
            const toggle = within(container).getByTestId(
              "command-bar-filter-toggle",
            );
            expect(within(toggle).getByTestId("box-icon-today")).toBeDefined();
          },
        );

        And(
          "collapsed filter shows a chevron indicator",
          (_ctx: TestContext) => {
            const toggle = within(container).getByTestId(
              "command-bar-filter-toggle",
            );
            expect(within(toggle).getByTestId("filter-chevron")).toBeDefined();
          },
        );
      },
    );

    // @command-bar @FR6
    f.Scenario(
      "Filter expands on tap showing all box icons",
      ({ When, Then }) => {
        When("user taps the collapsed filter", (_ctx: TestContext) => {
          const toggle = within(container).getByTestId(
            "command-bar-filter-toggle",
          );
          fireEvent.click(toggle);
        });

        Then("filter expands to show all box icons", (_ctx: TestContext) => {
          const filterArea = within(container).getByTestId(
            "command-bar-filter-area",
          );
          for (const box of filterConfig.boxes) {
            expect(
              within(filterArea).getByTestId(`box-filter-${box}`),
            ).toBeDefined();
          }
        });
      },
    );

    // @command-bar @FR9
    f.Scenario(
      "Selecting a box collapses filter and calls onBoxChange",
      ({ Given, When, Then, And }) => {
        Given("filter is expanded", (_ctx: TestContext) => {
          const toggle = within(container).getByTestId(
            "command-bar-filter-toggle",
          );
          fireEvent.click(toggle);
        });

        When('user selects "week" box', (_ctx: TestContext) => {
          const weekButton = within(container).getByTestId("box-filter-week");
          fireEvent.click(weekButton);
        });

        Then("filter collapses", (_ctx: TestContext) => {
          expect(
            within(container).getByTestId("command-bar-filter-toggle"),
          ).toBeDefined();
          expect(
            within(container).queryByTestId("command-bar-filter-area"),
          ).toBeNull();
        });

        And('onBoxChange is called with "week"', (_ctx: TestContext) => {
          expect(filterConfig.onBoxChange).toHaveBeenCalledWith("week");
        });
      },
    );

    // @command-bar @FR8
    f.Scenario(
      "Textarea focus collapses expanded filter",
      ({ Given, When, Then, And }) => {
        Given("filter is expanded", (_ctx: TestContext) => {
          const toggle = within(container).getByTestId(
            "command-bar-filter-toggle",
          );
          fireEvent.click(toggle);
        });

        When("user focuses the textarea", (_ctx: TestContext) => {
          const textarea = within(container).getByTestId(
            "command-bar-textarea",
          );
          fireEvent.focus(textarea);
        });

        Then("filter collapses", (_ctx: TestContext) => {
          expect(
            within(container).getByTestId("command-bar-filter-toggle"),
          ).toBeDefined();
          expect(
            within(container).queryByTestId("command-bar-filter-area"),
          ).toBeNull();
        });

        And("active box value is preserved", (_ctx: TestContext) => {
          expect(filterConfig.onBoxChange).not.toHaveBeenCalled();
        });
      },
    );

    // @command-bar @FR8
    f.Scenario(
      "Outside click collapses expanded filter",
      ({ Given, When, Then }) => {
        Given("filter is expanded", (_ctx: TestContext) => {
          const toggle = within(container).getByTestId(
            "command-bar-filter-toggle",
          );
          fireEvent.click(toggle);
        });

        When("user clicks outside the filter", (_ctx: TestContext) => {
          fireEvent.pointerDown(document.body);
        });

        Then("filter collapses", (_ctx: TestContext) => {
          expect(
            within(container).getByTestId("command-bar-filter-toggle"),
          ).toBeDefined();
          expect(
            within(container).queryByTestId("command-bar-filter-area"),
          ).toBeNull();
        });
      },
    );

    // @command-bar @FR5
    f.Scenario(
      "No filter section when filter prop is undefined",
      ({ Given, Then }) => {
        Given(
          "CommandBar is rendered without filter config",
          (_ctx: TestContext) => {
            cleanup();
            const renderResult = render(
              React.createElement(CommandBar, {
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: vi.fn(),
              }),
            );
            container = renderResult.container;
          },
        );

        Then("no filter section is rendered", (_ctx: TestContext) => {
          expect(
            within(container).queryByTestId("command-bar-filter-toggle"),
          ).toBeNull();
          expect(
            within(container).queryByTestId("command-bar-filter-area"),
          ).toBeNull();
        });
      },
    );
  },
);
