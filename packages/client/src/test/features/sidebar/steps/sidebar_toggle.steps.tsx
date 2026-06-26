import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";
import type { SidebarEffectiveState } from "@/types/common";

const feature = await loadFeature("../sidebar_toggle.feature");

type FeatureContext = {
  effectiveState: SidebarEffectiveState;
};

function renderSidebar(effectiveState: SidebarEffectiveState) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState={effectiveState}
        isDrawerOpen={false}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      f.context.effectiveState = "collapsed";
    });

    // @improve-sidebar-ux @FR4
    f.Scenario("Collapsed sidebar renders narrow strip", ({ Given, Then }) => {
      Given("sidebar is collapsed", (_ctx: TestContext) => {
        f.context.effectiveState = "collapsed";
        renderSidebar("collapsed");
      });

      Then(
        "sidebar renders a narrow strip with icon-only buttons",
        (_ctx: TestContext) => {
          const collapsed = screen.getByTestId("sidebar-collapsed");
          expect(collapsed.className).toContain("w-14");
        },
      );
    });

    // @improve-sidebar-ux @FR4
    f.Scenario(
      "Collapsed sidebar is not interactive as a whole",
      ({ Given, Then, And }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          f.context.effectiveState = "collapsed";
          renderSidebar("collapsed");
        });

        Then("collapsed sidebar has no role attribute", (_ctx: TestContext) => {
          const collapsed = screen.getByTestId("sidebar-collapsed");
          expect(collapsed.getAttribute("role")).toBeNull();
        });

        And("collapsed sidebar has no tabIndex", (_ctx: TestContext) => {
          const collapsed = screen.getByTestId("sidebar-collapsed");
          expect(collapsed.getAttribute("tabindex")).toBeNull();
        });

        And("collapsed sidebar has no cursor-pointer", (_ctx: TestContext) => {
          const collapsed = screen.getByTestId("sidebar-collapsed");
          expect(collapsed.className).not.toContain("cursor-pointer");
        });
      },
    );

    // @improve-sidebar-ux @FR4
    f.Scenario(
      "Expanded sidebar container is not interactive",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.effectiveState = "expanded";
          renderSidebar("expanded");
        });

        Then(
          "expanded sidebar container has no role attribute",
          (_ctx: TestContext) => {
            const container = screen.getByTestId("sidebar-expanded");
            expect(container.getAttribute("role")).toBeNull();
          },
        );

        And(
          "expanded sidebar container has no tabIndex",
          (_ctx: TestContext) => {
            const container = screen.getByTestId("sidebar-expanded");
            expect(container.getAttribute("tabindex")).toBeNull();
          },
        );
      },
    );

    // @improve-sidebar-ux @FR4
    f.Scenario(
      "Clicking empty area in expanded sidebar does nothing",
      ({ Given, When, Then }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.effectiveState = "expanded";
          renderSidebar("expanded");
        });

        When(
          "user clicks the expanded container",
          async (_ctx: TestContext) => {
            const user = userEvent.setup();
            const container = screen.getByTestId("sidebar-expanded");
            await user.click(container);
          },
        );

        Then("no navigation or toggle occurs", (_ctx: TestContext) => {
          // Expanded container should still be visible (no state change)
          expect(screen.getByTestId("sidebar-expanded")).toBeInTheDocument();
        });
      },
    );

    // @improve-sidebar-ux @FR4
    f.Scenario("Expanded sidebar has no backdrop", ({ Given, Then }) => {
      Given("sidebar is expanded", (_ctx: TestContext) => {
        f.context.effectiveState = "expanded";
        renderSidebar("expanded");
      });

      Then("no backdrop overlay is rendered", (_ctx: TestContext) => {
        expect(screen.queryByTestId("sidebar-backdrop")).toBeNull();
      });
    });
  },
);
