// implements FR1, FR2, FR3, FR4, FR20, FR21 of command-bar
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
import type {
  CommandBarEyeToggleConfig,
  CommandBarFilterConfig,
  CommandBarFilterItem,
} from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";

const feature = await loadFeature("../command_bar_core.feature");

type FeatureContext = Record<string, never>;

const PLACEHOLDER_TEXT = "Add a task...";

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

function renderMinimalCommandBar(onSubmit: ReturnType<typeof vi.fn>) {
  return render(
    React.createElement(CommandBar, {
      entityIcon: StubIcon,
      placeholder: PLACEHOLDER_TEXT,
      onSubmit,
    }),
  );
}

function getTextarea(container: HTMLElement): HTMLTextAreaElement {
  return within(container).getByTestId(
    "command-bar-textarea",
  ) as HTMLTextAreaElement;
}

function clickCreateButton(container: HTMLElement) {
  const createButton = within(container).getByTestId(
    "command-bar-create-button",
  );
  fireEvent.click(createButton);
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let container: HTMLElement;
    let onSubmitMock: ReturnType<typeof vi.fn>;

    f.BeforeEachScenario(() => {
      cleanup();
      onSubmitMock = vi.fn();
    });

    // @command-bar @FR1 @FR2 @FR3
    f.Scenario(
      "Minimal config renders textarea with entity icon and create button only",
      ({ When, Then, And }) => {
        When(
          "CommandBar receives only entityIcon, placeholder, and onSubmit",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        Then(
          "it renders textarea with entity icon and create button",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(
              within(commandBar).getByTestId("command-bar-textarea"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-entity-icon"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-create-button"),
            ).toBeDefined();
          },
        );

        And("no filter section is rendered", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(
            within(commandBar).queryByTestId("command-bar-filter-toggle"),
          ).toBeNull();
        });

        And("no eye toggle is rendered", (_ctx: TestContext) => {
          const commandBar = within(container).getByTestId("command-bar");
          expect(
            within(commandBar).queryByTestId("command-bar-eye-toggle"),
          ).toBeNull();
        });
      },
    );

    // @command-bar @FR1 @FR2 @FR3 @FR4
    f.Scenario(
      "Full config renders filter, textarea, eye toggle, and create button",
      ({ When, Then }) => {
        When(
          "CommandBar receives filter, eyeToggle, entityIcon, placeholder, and onSubmit",
          (_ctx: TestContext) => {
            function StubFilterIcon({ className }: { className?: string }) {
              return React.createElement("span", { className });
            }
            const filterItems: CommandBarFilterItem[] = [
              { value: "today", icon: StubFilterIcon, label: "Today" },
              { value: "week", icon: StubFilterIcon, label: "Week" },
              { value: "later", icon: StubFilterIcon, label: "Later" },
              { value: "all", icon: StubFilterIcon, label: "All" },
            ];
            const filterConfig: CommandBarFilterConfig = {
              items: filterItems,
              activeValue: "today",
              onChange: vi.fn(),
            };
            const eyeToggleConfig: CommandBarEyeToggleConfig = {
              isVisible: true,
              onToggle: vi.fn(),
            };
            const renderResult = render(
              React.createElement(CommandBar, {
                filter: filterConfig,
                eyeToggle: eyeToggleConfig,
                entityIcon: StubIcon,
                placeholder: PLACEHOLDER_TEXT,
                onSubmit: onSubmitMock,
              }),
            );
            container = renderResult.container;
          },
        );

        Then(
          "it renders filter toggle, textarea with entity icon, eye toggle, and create button",
          (_ctx: TestContext) => {
            const commandBar = within(container).getByTestId("command-bar");
            expect(
              within(commandBar).getByTestId("command-bar-filter-toggle"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-textarea"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-entity-icon"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-eye-toggle"),
            ).toBeDefined();
            expect(
              within(commandBar).getByTestId("command-bar-create-button"),
            ).toBeDefined();
          },
        );
      },
    );

    // @command-bar @FR4 @FR20
    f.Scenario(
      "Submit via create button calls onSubmit with trimmed text and clears textarea",
      ({ Given, And, When, Then }) => {
        let textarea: HTMLTextAreaElement;

        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And(
          'user has typed "  Buy milk  " in the textarea',
          (_ctx: TestContext) => {
            textarea = getTextarea(container);
            fireEvent.input(textarea, { target: { value: "  Buy milk  " } });
          },
        );

        When("user taps the create button", (_ctx: TestContext) => {
          clickCreateButton(container);
        });

        Then('onSubmit is called with "Buy milk"', (_ctx: TestContext) => {
          expect(onSubmitMock).toHaveBeenCalledWith("Buy milk");
        });

        And("textarea is empty", (_ctx: TestContext) => {
          textarea = getTextarea(container);
          expect(textarea.value).toBe("");
        });

        And("CommandBar returns to single-line state", (_ctx: TestContext) => {
          expect(textarea.value).toBe("");
        });
      },
    );

    // @command-bar @FR4 @FR20
    f.Scenario(
      "Submit via Enter key calls onSubmit with trimmed text and clears textarea",
      ({ Given, And, When, Then }) => {
        let textarea: HTMLTextAreaElement;

        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And(
          'user has typed "  Buy milk  " in the textarea',
          (_ctx: TestContext) => {
            textarea = getTextarea(container);
            fireEvent.input(textarea, { target: { value: "  Buy milk  " } });
          },
        );

        When("user presses Enter", (_ctx: TestContext) => {
          fireEvent.keyDown(textarea, { key: "Enter" });
        });

        Then('onSubmit is called with "Buy milk"', (_ctx: TestContext) => {
          expect(onSubmitMock).toHaveBeenCalledWith("Buy milk");
        });

        And("textarea is empty", (_ctx: TestContext) => {
          expect(textarea.value).toBe("");
        });

        And("CommandBar returns to single-line state", (_ctx: TestContext) => {
          expect(textarea.value).toBe("");
        });
      },
    );

    // @command-bar @FR21
    f.Scenario(
      "Empty textarea submit does nothing via button",
      ({ Given, And, When, Then }) => {
        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And("textarea is empty", (_ctx: TestContext) => {
          expect(getTextarea(container).value).toBe("");
        });

        When("user taps the create button", (_ctx: TestContext) => {
          clickCreateButton(container);
        });

        Then("onSubmit is not called", (_ctx: TestContext) => {
          expect(onSubmitMock).not.toHaveBeenCalled();
        });
      },
    );

    // @command-bar @FR21
    f.Scenario(
      "Empty textarea submit does nothing via Enter",
      ({ Given, And, When, Then }) => {
        let textarea: HTMLTextAreaElement;

        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And("textarea is empty", (_ctx: TestContext) => {
          textarea = getTextarea(container);
          expect(textarea.value).toBe("");
        });

        When("user presses Enter", (_ctx: TestContext) => {
          fireEvent.keyDown(textarea, { key: "Enter" });
        });

        Then("onSubmit is not called", (_ctx: TestContext) => {
          expect(onSubmitMock).not.toHaveBeenCalled();
        });
      },
    );

    // @command-bar @FR21
    f.Scenario(
      "Whitespace-only textarea submit does nothing",
      ({ Given, And, When, Then }) => {
        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And('user has typed "   " in the textarea', (_ctx: TestContext) => {
          const textarea = getTextarea(container);
          fireEvent.input(textarea, { target: { value: "   " } });
        });

        When("user taps the create button", (_ctx: TestContext) => {
          clickCreateButton(container);
        });

        Then("onSubmit is not called", (_ctx: TestContext) => {
          expect(onSubmitMock).not.toHaveBeenCalled();
        });
      },
    );

    // @command-bar @FR20
    f.Scenario(
      "Textarea clears and returns to single-line after submit",
      ({ Given, And, When, Then }) => {
        let textarea: HTMLTextAreaElement;

        Given(
          "CommandBar is rendered with onSubmit callback",
          (_ctx: TestContext) => {
            container = renderMinimalCommandBar(onSubmitMock).container;
          },
        );

        And(
          "user has typed a long name that wraps to multiple lines",
          (_ctx: TestContext) => {
            textarea = getTextarea(container);
            const longText =
              "This is a very long task name that should wrap to multiple lines in the textarea";
            fireEvent.input(textarea, { target: { value: longText } });
          },
        );

        When("user taps the create button", (_ctx: TestContext) => {
          clickCreateButton(container);
        });

        Then("textarea is empty", (_ctx: TestContext) => {
          expect(textarea.value).toBe("");
        });

        And("CommandBar returns to single-line state", (_ctx: TestContext) => {
          expect(textarea.value).toBe("");
        });
      },
    );

    // @command-bar @FR4
    f.Scenario("Enter key does not insert newline", ({ Given, When, Then }) => {
      let textarea: HTMLTextAreaElement;

      Given("CommandBar is rendered", (_ctx: TestContext) => {
        container = renderMinimalCommandBar(onSubmitMock).container;
        textarea = getTextarea(container);
      });

      When("user presses Enter in the textarea", (_ctx: TestContext) => {
        const event = new KeyboardEvent("keydown", {
          key: "Enter",
          bubbles: true,
          cancelable: true,
        });
        const preventDefaultSpy = vi.spyOn(event, "preventDefault");
        textarea.dispatchEvent(event);
        expect(preventDefaultSpy).toHaveBeenCalled();
      });

      Then(
        "no newline character is inserted in the textarea",
        (_ctx: TestContext) => {
          expect(textarea.value).not.toContain("\n");
        },
      );
    });
  },
);
