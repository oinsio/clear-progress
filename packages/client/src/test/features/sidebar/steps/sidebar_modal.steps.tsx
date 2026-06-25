// implements FR4, FR5, FR6 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import { STORAGE_KEYS } from "@/constants";

const mockOnToggle = vi.fn();
const mockOnCollapsedClick = vi.fn();
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

const feature = await loadFeature("../sidebar_modal.feature");

type FeatureContext = {
  isOpen: boolean;
};

function renderSidebar(
  isOpen: boolean,
  options?: {
    onCollapsedClick?: () => void;
    onAutoCollapse?: () => void;
  },
) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        isOpen={isOpen}
        onToggle={mockOnToggle}
        onCollapsedClick={options?.onCollapsedClick}
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
      f.context.isOpen = false;
    });

    // @improve-sidebar-ux @FR4
    f.Scenario(
      "Modal opens without persisting",
      ({ Given, When, Then, And }) => {
        Given("sidebar is persistently closed", (_ctx: TestContext) => {
          localStorage.setItem(STORAGE_KEYS.PANEL_OPEN, "false");
          f.context.isOpen = false;
          renderSidebar(false, { onCollapsedClick: mockOnCollapsedClick });
        });

        When("user clicks the collapsed strip", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          const toggle = screen.getByTestId("sidebar-toggle");
          await user.click(toggle);
        });

        Then("sidebar opens in modal mode", (_ctx: TestContext) => {
          expect(mockOnCollapsedClick).toHaveBeenCalledTimes(1);
          expect(mockOnToggle).not.toHaveBeenCalled();
        });

        And(
          "localStorage still has panel open as false",
          (_ctx: TestContext) => {
            expect(localStorage.getItem(STORAGE_KEYS.PANEL_OPEN)).toBe("false");
          },
        );
      },
    );

    // @improve-sidebar-ux @FR6
    f.Scenario("Modal closes on nav click", ({ Given, When, Then }) => {
      Given("sidebar is open in modal mode", (_ctx: TestContext) => {
        f.context.isOpen = true;
        renderSidebar(true, { onAutoCollapse: mockOnAutoCollapse });
      });

      When("user clicks a nav item", async (_ctx: TestContext) => {
        const user = userEvent.setup();
        const inboxButton = screen.getByTestId("sidebar-filter-inbox");
        await user.click(inboxButton);
      });

      Then("sidebar collapses", (_ctx: TestContext) => {
        expect(mockOnAutoCollapse).toHaveBeenCalledTimes(1);
      });
    });

    // @improve-sidebar-ux @FR5
    f.Scenario("Standard stays open on nav click", ({ Given, When, Then }) => {
      Given("sidebar is persistently open", (_ctx: TestContext) => {
        f.context.isOpen = true;
        renderSidebar(true);
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
