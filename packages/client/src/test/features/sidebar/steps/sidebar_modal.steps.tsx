// implements FR5, FR11 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";

const mockOnAutoCollapse = vi.fn();
const mockOnModeChange = vi.fn();

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({
    menuOrder: [{ mode: "inbox", visible: true }],
  }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";
import type { SidebarEffectiveState } from "@/types/common";

const feature = await loadFeature("../sidebar_modal.feature");

type FeatureContext = {
  effectiveState: SidebarEffectiveState;
};

function renderSidebar(options?: { onAutoCollapse?: () => void }) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState="expanded"
        isDrawerOpen={false}
        onAutoCollapse={options?.onAutoCollapse}
        onModeChange={mockOnModeChange}
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

    // @improve-sidebar-ux @FR11
    f.Scenario(
      "Drawer auto-collapses on nav click",
      ({ Given, When, Then }) => {
        Given("sidebar is open as a drawer", (_ctx: TestContext) => {
          f.context.effectiveState = "expanded";
          renderSidebar({ onAutoCollapse: mockOnAutoCollapse });
        });

        When("user clicks a nav item", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          const inboxButton = screen.getByTestId("sidebar-filter-inbox");
          await user.click(inboxButton);
        });

        Then("sidebar collapses", (_ctx: TestContext) => {
          expect(mockOnAutoCollapse).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @improve-sidebar-ux @FR5
    f.Scenario("Standard stays open on nav click", ({ Given, When, Then }) => {
      Given("sidebar is persistently open", (_ctx: TestContext) => {
        f.context.effectiveState = "expanded";
        renderSidebar();
      });

      When("user clicks a nav item", async (_ctx: TestContext) => {
        const user = userEvent.setup();
        const inboxButton = screen.getByTestId("sidebar-filter-inbox");
        await user.click(inboxButton);
      });

      Then("sidebar remains open", (_ctx: TestContext) => {
        expect(mockOnAutoCollapse).not.toHaveBeenCalled();
      });
    });
  },
);
