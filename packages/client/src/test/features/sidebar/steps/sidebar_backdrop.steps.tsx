// implements FR3, NFR-A2, NFR-R1 of improve-sidebar-ux
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import {
  cleanup,
  fireEvent,
  render,
  screen,
} from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import type { TestContext } from "vitest";
import { expect, vi } from "vitest";

import "./sidebarTestSetup";

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: () => "not_configured",
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const mockOnToggle = vi.fn();

function renderSidebar(isOpen: boolean) {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        isOpen={isOpen}
        onToggle={mockOnToggle}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

const feature = await loadFeature("../sidebar_backdrop.feature");

type FeatureContext = Record<string, never>;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
    });

    // @improve-sidebar-ux @FR3
    // Backdrop is rendered with md:hidden — always in DOM when open, CSS hides on desktop
    f.Scenario(
      "Backdrop visible on mobile when sidebar expanded",
      ({ Given, And, Then }) => {
        Given("user is on mobile", (_ctx: TestContext) => {
          // Backdrop uses md:hidden CSS class; mobile visibility verified by element existence
        });

        And("sidebar is open", (_ctx: TestContext) => {
          renderSidebar(true);
        });

        Then("a backdrop overlay is visible", (_ctx: TestContext) => {
          const backdrop = screen.getByTestId("sidebar-backdrop");
          expect(backdrop).toBeInTheDocument();
          expect(backdrop).toHaveClass("md:hidden");
        });
      },
    );

    // @improve-sidebar-ux @FR3
    f.Scenario("Backdrop not visible on desktop", ({ Given, And, Then }) => {
      Given("user is on desktop", (_ctx: TestContext) => {
        // Backdrop has md:hidden class — hidden on desktop via CSS
      });

      And("sidebar is open", (_ctx: TestContext) => {
        renderSidebar(true);
      });

      Then("no backdrop overlay is visible", (_ctx: TestContext) => {
        const backdrop = screen.getByTestId("sidebar-backdrop");
        expect(backdrop).toHaveClass("md:hidden");
      });
    });

    // @improve-sidebar-ux @FR3
    f.Scenario(
      "Tap on backdrop closes sidebar",
      ({ Given, And, When, Then }) => {
        Given("user is on mobile", (_ctx: TestContext) => {
          // Mobile context
        });

        And("sidebar is open", (_ctx: TestContext) => {
          renderSidebar(true);
        });

        When("user taps the backdrop", (_ctx: TestContext) => {
          const backdrop = screen.getByTestId("sidebar-backdrop");
          fireEvent.click(backdrop);
        });

        Then("sidebar closes", (_ctx: TestContext) => {
          expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });
      },
    );
  },
);
