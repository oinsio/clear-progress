// implements FR2, FR18 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import { SIDEBAR_MODES } from "@/constants";
import type { SidebarMode } from "@/types/common";

import "./sidebarTestSetup";

import { SidebarControlPopover } from "@/components/tasks/SidebarControlPopover";
import { SidebarFilterNav } from "@/components/tasks/SidebarFilterNav";

vi.mock("@/components/tasks/FocusedGoalsBlock", () => ({
  FocusedGoalsBlock: () => <div data-testid="focused-goals-block" />,
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

const feature = await loadFeature("../sidebar_control.feature");

type FeatureContext = {
  onModeChange: ReturnType<typeof vi.fn>;
  onClose: ReturnType<typeof vi.fn>;
  currentMode: SidebarMode;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      f.context.onModeChange = vi.fn();
      f.context.onClose = vi.fn();
      f.context.currentMode = "expanded";
    });

    // @improve-sidebar-ux @FR2
    f.Scenario("Popover shows three mode options", ({ Given, Then }) => {
      Given(
        "sidebar control popover is open with mode {string}",
        (_ctx: TestContext, mode: string) => {
          f.context.currentMode = mode as SidebarMode;
          render(
            <SidebarControlPopover
              currentMode={f.context.currentMode}
              onModeChange={f.context.onModeChange}
              isOpen={true}
              onClose={f.context.onClose}
            />,
          );
        },
      );
      Then(
        "popover displays Expanded, Collapsed, and Expand on hover options",
        (_ctx: TestContext) => {
          for (const mode of SIDEBAR_MODES) {
            expect(
              screen.getByTestId(`sidebar-mode-option-${mode}`),
            ).toBeInTheDocument();
          }
        },
      );
    });

    // @improve-sidebar-ux @FR2
    f.Scenario("Active mode is visually indicated", ({ Given, Then, And }) => {
      Given(
        "sidebar control popover is open with mode {string}",
        (_ctx: TestContext, mode: string) => {
          f.context.currentMode = mode as SidebarMode;
          render(
            <SidebarControlPopover
              currentMode={f.context.currentMode}
              onModeChange={f.context.onModeChange}
              isOpen={true}
              onClose={f.context.onClose}
            />,
          );
        },
      );
      Then(
        "the {string} option has aria-selected {string}",
        (_ctx: TestContext, mode: string, value: string) => {
          const option = screen.getByTestId(`sidebar-mode-option-${mode}`);
          expect(option).toHaveAttribute("aria-selected", value);
        },
      );
      And(
        "the {string} option has aria-selected {string}",
        (_ctx: TestContext, mode: string, value: string) => {
          const option = screen.getByTestId(`sidebar-mode-option-${mode}`);
          expect(option).toHaveAttribute("aria-selected", value);
        },
      );
    });

    // @improve-sidebar-ux @FR2
    f.Scenario(
      "User switches sidebar mode via popover",
      ({ Given, When, Then, And }) => {
        Given(
          "sidebar control popover is open with mode {string}",
          (_ctx: TestContext, mode: string) => {
            f.context.currentMode = mode as SidebarMode;
            render(
              <SidebarControlPopover
                currentMode={f.context.currentMode}
                onModeChange={f.context.onModeChange}
                isOpen={true}
                onClose={f.context.onClose}
              />,
            );
          },
        );
        When(
          "user selects the {string} mode option",
          async (_ctx: TestContext, mode: string) => {
            const user = userEvent.setup();
            await user.click(screen.getByTestId(`sidebar-mode-option-${mode}`));
          },
        );
        Then(
          "onModeChange is called with {string}",
          (_ctx: TestContext, mode: string) => {
            expect(f.context.onModeChange).toHaveBeenCalledWith(mode);
          },
        );
        And("popover onClose is called", (_ctx: TestContext) => {
          expect(f.context.onClose).toHaveBeenCalled();
        });
      },
    );

    // @improve-sidebar-ux @FR2 @FR18
    f.Scenario(
      "Sidebar control is hidden when not visible",
      ({ Given, Then }) => {
        Given("sidebar control popover is not visible", (_ctx: TestContext) => {
          render(
            <MemoryRouter>
              <SidebarFilterNav
                isExpanded={true}
                mode={null}
                visibleFilterItems={[]}
                onModeChange={vi.fn()}
                isControlVisible={false}
              />
            </MemoryRouter>,
          );
        });
        Then("sidebar control trigger is not rendered", (_ctx: TestContext) => {
          expect(
            screen.queryByTestId("sidebar-control-trigger"),
          ).not.toBeInTheDocument();
        });
      },
    );
  },
);
