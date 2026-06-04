// implements FR7 of command-bar
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
import type { CommandBarEyeToggleConfig } from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";

const feature = await loadFeature("../command_bar_eye_toggle.feature");

type FeatureContext = Record<string, never>;

const PLACEHOLDER_TEXT = "Add a task...";

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let container: HTMLElement;
    let onSubmitMock: ReturnType<typeof vi.fn>;
    let onToggleMock: ReturnType<typeof vi.fn>;

    f.BeforeEachScenario(() => {
      cleanup();
      onSubmitMock = vi.fn();
      onToggleMock = vi.fn();
    });

    // @command-bar @FR7
    f.Scenario(
      "Active state shows Eye icon with accent styling",
      ({ Given, Then, And }) => {
        Given(
          "CommandBar is rendered with eyeToggle visible",
          (_ctx: TestContext) => {
            const eyeToggleConfig: CommandBarEyeToggleConfig = {
              isVisible: true,
              onToggle: onToggleMock,
            };
            const renderResult = render(
              React.createElement(CommandBar, {
                eyeToggle: eyeToggleConfig,
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: onSubmitMock,
              }),
            );
            container = renderResult.container;
          },
        );

        Then("eye toggle shows the Eye icon", (_ctx: TestContext) => {
          const eyeToggle = within(container).getByTestId(
            "command-bar-eye-toggle",
          );
          const svgElement = eyeToggle.querySelector("svg");
          expect(svgElement).not.toBeNull();
        });

        And("eye toggle has accent styling", (_ctx: TestContext) => {
          const eyeToggle = within(container).getByTestId(
            "command-bar-eye-toggle",
          );
          expect(eyeToggle.className).toContain("bg-accent/10");
          expect(eyeToggle.className).toContain("text-accent");
          expect(eyeToggle.getAttribute("aria-pressed")).toBe("true");
        });
      },
    );

    // @command-bar @FR7
    f.Scenario(
      "Inactive state shows EyeOff icon with gray styling",
      ({ Given, Then, And }) => {
        Given(
          "CommandBar is rendered with eyeToggle hidden",
          (_ctx: TestContext) => {
            const eyeToggleConfig: CommandBarEyeToggleConfig = {
              isVisible: false,
              onToggle: onToggleMock,
            };
            const renderResult = render(
              React.createElement(CommandBar, {
                eyeToggle: eyeToggleConfig,
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: onSubmitMock,
              }),
            );
            container = renderResult.container;
          },
        );

        Then("eye toggle shows the EyeOff icon", (_ctx: TestContext) => {
          const eyeToggle = within(container).getByTestId(
            "command-bar-eye-toggle",
          );
          const svgElement = eyeToggle.querySelector("svg");
          expect(svgElement).not.toBeNull();
        });

        And("eye toggle has gray styling", (_ctx: TestContext) => {
          const eyeToggle = within(container).getByTestId(
            "command-bar-eye-toggle",
          );
          expect(eyeToggle.className).toContain("text-gray-400");
          expect(eyeToggle.className).toContain("hover:bg-gray-100");
          expect(eyeToggle.getAttribute("aria-pressed")).toBe("false");
        });
      },
    );

    // @command-bar @FR7
    f.Scenario("Toggle calls onToggle callback", ({ Given, When, Then }) => {
      Given(
        "CommandBar is rendered with eyeToggle config",
        (_ctx: TestContext) => {
          const eyeToggleConfig: CommandBarEyeToggleConfig = {
            isVisible: true,
            onToggle: onToggleMock,
          };
          const renderResult = render(
            React.createElement(CommandBar, {
              eyeToggle: eyeToggleConfig,
              entityIcon: StubIcon,
              placeholder: PLACEHOLDER_TEXT,
              onSubmit: onSubmitMock,
            }),
          );
          container = renderResult.container;
        },
      );

      When("user taps the eye toggle", (_ctx: TestContext) => {
        const eyeToggle = within(container).getByTestId(
          "command-bar-eye-toggle",
        );
        fireEvent.click(eyeToggle);
      });

      Then("onToggle callback is called", (_ctx: TestContext) => {
        expect(onToggleMock).toHaveBeenCalledOnce();
      });
    });

    // @command-bar @FR7
    f.Scenario(
      "Not rendered when eyeToggle prop is undefined",
      ({ Given, Then }) => {
        Given(
          "CommandBar is rendered without eyeToggle config",
          (_ctx: TestContext) => {
            const renderResult = render(
              React.createElement(CommandBar, {
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: onSubmitMock,
              }),
            );
            container = renderResult.container;
          },
        );

        Then("no eye toggle is rendered", (_ctx: TestContext) => {
          const eyeToggle = within(container).queryByTestId(
            "command-bar-eye-toggle",
          );
          expect(eyeToggle).toBeNull();
        });
      },
    );
  },
);
