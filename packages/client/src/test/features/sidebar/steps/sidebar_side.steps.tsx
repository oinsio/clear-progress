import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import type { PanelSide, SidebarEffectiveState } from "@/types/common";

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "synced",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const feature = await loadFeature("../sidebar_side.feature");

type FeatureContext = {
  effectiveState: SidebarEffectiveState;
  side: PanelSide;
};

function renderSidebar(effectiveState: SidebarEffectiveState, side: PanelSide) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState={effectiveState}
        isDrawerOpen={false}
        side={side}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

function getSidebarPanel(effectiveState: SidebarEffectiveState) {
  return effectiveState === "collapsed"
    ? screen.getByTestId("sidebar-collapsed")
    : screen.getByTestId("sidebar-expanded");
}

function expectToggleBorder(
  borderClass: string,
  effectiveState: SidebarEffectiveState,
) {
  const panel = getSidebarPanel(effectiveState);
  expect(panel.className).toContain(borderClass);
}

function expectOrderFirstClass(effectiveState: SidebarEffectiveState) {
  const panel = getSidebarPanel(effectiveState);
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
      f.context.effectiveState = "expanded";
      f.context.side = "right";
    });

    const givenExpanded = (_ctx: TestContext) => {
      f.context.effectiveState = "expanded";
    };
    const givenCollapsed = (_ctx: TestContext) => {
      f.context.effectiveState = "collapsed";
    };
    const whenSideIs = (_ctx: TestContext, side: string) => {
      f.context.side = side as PanelSide;
      renderSidebar(f.context.effectiveState, side as PanelSide);
    };
    const thenHasOrderFirst = (_ctx: TestContext) => {
      expectOrderFirstClass(f.context.effectiveState);
    };
    const thenLeftBorder = (_ctx: TestContext) => {
      expectToggleBorder("border-l", f.context.effectiveState);
    };
    const thenRightBorder = (_ctx: TestContext) => {
      expectToggleBorder("border-r", f.context.effectiveState);
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
