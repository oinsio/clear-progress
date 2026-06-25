import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import type { PanelSide } from "@/types/common";

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ userPicture: null, signIn: vi.fn() }),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ syncStatus: "idle", pull: vi.fn() }),
}));

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const feature = await loadFeature("../sidebar_side.feature");

type FeatureContext = {
  isOpen: boolean;
  side: PanelSide;
};

function renderSidebar(isOpen: boolean, side: PanelSide) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        isOpen={isOpen}
        side={side}
        onToggle={vi.fn()}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

function getSidebarPanel(isOpen: boolean) {
  return isOpen
    ? screen.getByTestId("sidebar-expanded")
    : screen.getByTestId("sidebar-toggle");
}

function expectToggleBorder(borderClass: string, isOpen: boolean) {
  const panel = getSidebarPanel(isOpen);
  expect(panel.className).toContain(borderClass);
}

function expectOrderFirstClass(isOpen: boolean) {
  const panel = getSidebarPanel(isOpen);
  const outerWrapper = panel.parentElement as HTMLElement;
  expect(outerWrapper.className).toContain("order-first");
}

function getButtonOrder() {
  const syncButton = screen.getByTestId("sidebar-sync");
  const accountButton = screen.getByTestId("sidebar-account");
  const parent = syncButton.parentElement as HTMLElement;
  const children = Array.from(parent.children);
  return {
    syncIndex: children.indexOf(syncButton),
    accountIndex: children.indexOf(accountButton),
  };
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      f.context.isOpen = true;
      f.context.side = "right";
    });

    const givenExpanded = (_ctx: TestContext) => {
      f.context.isOpen = true;
    };
    const givenCollapsed = (_ctx: TestContext) => {
      f.context.isOpen = false;
    };
    const whenSideIs = (_ctx: TestContext, side: string) => {
      f.context.side = side as PanelSide;
      renderSidebar(f.context.isOpen, side as PanelSide);
    };
    const thenHasOrderFirst = (_ctx: TestContext) => {
      expectOrderFirstClass(f.context.isOpen);
    };
    const thenLeftBorder = (_ctx: TestContext) => {
      expectToggleBorder("border-l", f.context.isOpen);
    };
    const thenRightBorder = (_ctx: TestContext) => {
      expectToggleBorder("border-r", f.context.isOpen);
    };

    // @add-sidebar-specs @FR4
    f.Scenario(
      "Right placement renders default layout",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", givenExpanded);
        And("sidebar side is {string}", whenSideIs);
        Then("sidebar renders with left border", thenLeftBorder);
        And(
          "sync button appears before account button",
          (_ctx: TestContext) => {
            const { syncIndex, accountIndex } = getButtonOrder();
            expect(syncIndex).toBeLessThan(accountIndex);
          },
        );
      },
    );

    // @add-sidebar-specs @FR4
    f.Scenario("Left placement reverses layout", ({ Given, Then, And }) => {
      Given("sidebar is expanded", givenExpanded);
      And("sidebar side is {string}", whenSideIs);
      Then("sidebar renders with right border", thenRightBorder);
      And("sidebar has order-first class", thenHasOrderFirst);
      And("account button appears before sync button", (_ctx: TestContext) => {
        const { syncIndex, accountIndex } = getButtonOrder();
        expect(accountIndex).toBeLessThan(syncIndex);
      });
    });

    // @add-sidebar-specs @FR4
    f.Scenario(
      "Collapsed sidebar respects side placement",
      ({ Given, Then, And }) => {
        Given("sidebar is collapsed", givenCollapsed);
        And("sidebar side is {string}", whenSideIs);
        Then("sidebar has order-first class", thenHasOrderFirst);
        And("sidebar renders with right border", thenRightBorder);
      },
    );
  },
);
