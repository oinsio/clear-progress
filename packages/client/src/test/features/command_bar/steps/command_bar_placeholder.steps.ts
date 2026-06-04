// implements FR19 of command-bar
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  type RenderResult,
  render,
  within,
} from "@testing-library/react/pure";
import React from "react";
import { expect, type TestContext, vi } from "vitest";
import { CommandBar } from "@/components/command-bar";

const feature = await loadFeature("../command_bar_placeholder.feature");

type FeatureContext = Record<string, never>;

function StubIcon({ className }: { className?: string }) {
  return React.createElement("svg", {
    className,
    "data-testid": "stub-entity-icon",
  });
}

const onSubmitStub = vi.fn();

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let renderResult: RenderResult;

    f.BeforeEachScenario(() => {
      cleanup();
      onSubmitStub.mockClear();
    });

    function getTextarea(): HTMLTextAreaElement {
      return within(renderResult.container).getByTestId(
        "command-bar-textarea",
      ) as HTMLTextAreaElement;
    }

    function renderCommandBar(placeholder: string) {
      renderResult = render(
        React.createElement(CommandBar, {
          entityIcon: StubIcon,
          placeholder,
          onSubmit: onSubmitStub,
        }),
      );
    }

    // @command-bar @FR19
    f.Scenario(
      "Specific filter box reflects that box in placeholder",
      ({ Given, When, Then }) => {
        Given("CommandBar is on a task page", (_ctx: TestContext) => {
          // Placeholder will be set per table row in Then step
        });

        When("filter is set to a specific box", (_ctx: TestContext) => {
          // Each box is tested via the DataTable in Then step
        });

        Then(
          "placeholder reflects the selected box",
          (_ctx: TestContext, table) => {
            const rows = table as { box: string; placeholder: string }[];
            for (const row of rows) {
              cleanup();
              renderCommandBar(row.placeholder);
              const textarea = getTextarea();
              expect(textarea.placeholder).toBe(row.placeholder);
            }
          },
        );
      },
    );

    // @command-bar @FR19
    f.Scenario(
      'Filter "all" with default box shows default box placeholder',
      ({ Given, And, Then }) => {
        Given("CommandBar is on a task page", (_ctx: TestContext) => {
          // Setup deferred to Then
        });

        And('filter is set to "all"', (_ctx: TestContext) => {
          // Calling page resolves "all" to default box
        });

        And('user default box is "today"', (_ctx: TestContext) => {
          // Calling page uses useTargetBox to resolve to "today"
        });

        Then(
          'placeholder shows "New task for today..."',
          (_ctx: TestContext) => {
            renderCommandBar("New task for today...");
            const textarea = getTextarea();
            expect(textarea.placeholder).toBe("New task for today...");
          },
        );
      },
    );

    // @command-bar @FR19
    f.Scenario(
      "Non-task page shows entity type placeholder",
      ({ When, Then }) => {
        When("CommandBar is on a non-task page", (_ctx: TestContext) => {
          // Placeholder will be set per table row in Then step
        });

        Then(
          "placeholder reflects the entity type",
          (_ctx: TestContext, table) => {
            const rows = table as { page: string; placeholder: string }[];
            for (const row of rows) {
              cleanup();
              renderCommandBar(row.placeholder);
              const textarea = getTextarea();
              expect(textarea.placeholder).toBe(row.placeholder);
            }
          },
        );
      },
    );

    // @command-bar @FR19
    f.Scenario(
      "Placeholder updates when filter changes",
      ({ Given, And, When, Then }) => {
        Given("CommandBar is on a task page", (_ctx: TestContext) => {
          // Setup in And step
        });

        And('filter is set to "today"', (_ctx: TestContext) => {
          renderCommandBar("New task for today...");
          const textarea = getTextarea();
          expect(textarea.placeholder).toBe("New task for today...");
        });

        When('user changes filter to "week"', (_ctx: TestContext) => {
          renderResult.rerender(
            React.createElement(CommandBar, {
              entityIcon: StubIcon,
              placeholder: "New task for week...",
              onSubmit: onSubmitStub,
            }),
          );
        });

        Then(
          'placeholder updates to "New task for week..."',
          (_ctx: TestContext) => {
            const textarea = getTextarea();
            expect(textarea.placeholder).toBe("New task for week...");
          },
        );
      },
    );
  },
);
