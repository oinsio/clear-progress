// implements FR13, FR14, FR15 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, within } from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";
import type {
  CommandBarEyeToggleConfig,
  CommandBarFilterConfig,
} from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";
import { COMMAND_BAR_STACKED_CLASS } from "@/constants";

const mockUseHandedness = vi.fn();

vi.mock("@/hooks/useHandedness", () => ({
  useHandedness: () => mockUseHandedness(),
}));

const feature = await loadFeature("../command_bar_handedness.feature");

type FeatureContext = Record<string, never>;

const PLACEHOLDER_TEXT = "Add a task...";

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

function createFilterConfig(): CommandBarFilterConfig {
  return {
    boxes: ["today", "week", "later", "all"],
    activeBox: "today",
    onBoxChange: vi.fn(),
  };
}

function createEyeToggleConfig(): CommandBarEyeToggleConfig {
  return {
    isVisible: true,
    onToggle: vi.fn(),
  };
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let container: HTMLElement;

    f.BeforeEachScenario(() => {
      cleanup();
      mockUseHandedness.mockReturnValue({
        handedness: "right",
        setHandedness: vi.fn(),
      });
    });

    // @command-bar @FR13
    f.Scenario("Right-handed default layout order", ({ Given, When, Then }) => {
      Given('handedness is "right"', (_ctx: TestContext) => {
        mockUseHandedness.mockReturnValue({
          handedness: "right",
          setHandedness: vi.fn(),
        });
      });

      When(
        "CommandBar is rendered with filter and eyeToggle",
        (_ctx: TestContext) => {
          const renderResult = render(
            React.createElement(CommandBar, {
              filter: createFilterConfig(),
              eyeToggle: createEyeToggleConfig(),
              entityIcon: StubIcon,
              placeholder: PLACEHOLDER_TEXT,
              onSubmit: vi.fn(),
            }),
          );
          container = renderResult.container;
        },
      );

      Then(
        "layout order is Filter, Textarea, Eye, Create",
        (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(commandBar.className).not.toContain("flex-row-reverse");
          const actionsContainer = within(container).getByTestId(
            "command-bar-actions",
          );
          expect(actionsContainer.className).not.toContain("flex-row-reverse");
        },
      );
    });

    // @command-bar @FR13
    f.Scenario(
      "Left-handed layout reverses element order",
      ({ Given, When, Then }) => {
        Given('handedness is "left"', (_ctx: TestContext) => {
          mockUseHandedness.mockReturnValue({
            handedness: "left",
            setHandedness: vi.fn(),
          });
        });

        When(
          "CommandBar is rendered with filter and eyeToggle",
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(CommandBar, {
                filter: createFilterConfig(),
                eyeToggle: createEyeToggleConfig(),
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: vi.fn(),
              }),
            );
            container = renderResult.container;
          },
        );

        Then(
          "layout order is Create, Eye, Textarea, Filter",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(commandBar.className).toContain("flex-row-reverse");
            const actionsContainer = within(container).getByTestId(
              "command-bar-actions",
            );
            expect(actionsContainer.className).toContain("flex-row-reverse");
          },
        );
      },
    );

    // @command-bar @FR14
    f.Scenario(
      "Entity icon not mirrored for left-handed layout",
      ({ Given, When, Then }) => {
        Given('handedness is "left"', (_ctx: TestContext) => {
          mockUseHandedness.mockReturnValue({
            handedness: "left",
            setHandedness: vi.fn(),
          });
        });

        When("CommandBar is rendered", (_ctx: TestContext) => {
          const renderResult = render(
            React.createElement(CommandBar, {
              entityIcon: StubIcon,
              placeholder: PLACEHOLDER_TEXT,
              onSubmit: vi.fn(),
            }),
          );
          container = renderResult.container;
        });

        Then(
          "entity icon remains on the left inside the textarea",
          (_ctx: TestContext) => {
            const entityIcon = within(container).getByTestId(
              "command-bar-entity-icon",
            );
            expect(entityIcon.className).toContain("left-2.5");
            expect(entityIcon.className).not.toContain("right-");
          },
        );
      },
    );

    // @command-bar @FR15
    f.Scenario(
      "Stack order unchanged with left-handedness",
      ({ Given, And, When, Then }) => {
        Given('handedness is "left"', (_ctx: TestContext) => {
          mockUseHandedness.mockReturnValue({
            handedness: "left",
            setHandedness: vi.fn(),
          });
        });

        And(
          "user has typed text that wraps to multiple visual lines",
          (_ctx: TestContext) => {
            // Will be handled after render in When step
          },
        );

        When("buttons are stacked vertically", (_ctx: TestContext) => {
          const renderResult = render(
            React.createElement(CommandBar, {
              eyeToggle: createEyeToggleConfig(),
              entityIcon: StubIcon,
              placeholder: PLACEHOLDER_TEXT,
              onSubmit: vi.fn(),
            }),
          );
          container = renderResult.container;
          const actionsContainer = within(container).getByTestId(
            "command-bar-actions",
          );
          actionsContainer.classList.add(COMMAND_BAR_STACKED_CLASS);
        });

        Then(
          "create button is at the bottom of the stack",
          (_ctx: TestContext) => {
            const actionsContainer = within(container).getByTestId(
              "command-bar-actions",
            );
            const children = Array.from(actionsContainer.children);
            const createButton = within(container).getByTestId(
              "command-bar-create-button",
            );
            const lastChild = children[children.length - 1];
            expect(lastChild).toBe(createButton);
          },
        );
      },
    );
  },
);
