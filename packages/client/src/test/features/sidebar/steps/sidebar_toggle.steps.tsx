import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";

const mockOnToggle = vi.fn();

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

const feature = await loadFeature("../sidebar_toggle.feature");

type FeatureContext = {
  isOpen: boolean;
};

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

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      f.context.isOpen = false;
    });

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Sidebar opens from collapsed state",
      ({ Given, When, Then }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          f.context.isOpen = false;
          renderSidebar(false);
        });

        When("user clicks the collapsed strip", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          const toggle = screen.getByTestId("sidebar-toggle");
          await user.click(toggle);
        });

        Then(
          "sidebar expands to show icons and labels",
          (_ctx: TestContext) => {
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
          },
        );
      },
    );

    // @improve-sidebar-ux @FR1
    f.Scenario("Sidebar closes via toggle button", ({ Given, When, Then }) => {
      Given("sidebar is expanded", (_ctx: TestContext) => {
        f.context.isOpen = true;
        renderSidebar(true);
      });

      When("user clicks the toggle button", async (_ctx: TestContext) => {
        const user = userEvent.setup();
        const toggleButton = screen.getByTestId("sidebar-toggle-button");
        await user.click(toggleButton);
      });

      Then("sidebar collapses to show icons only", (_ctx: TestContext) => {
        expect(mockOnToggle).toHaveBeenCalledTimes(1);
      });
    });

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Collapsed sidebar renders narrow strip",
      ({ Given, Then, And }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          f.context.isOpen = false;
          renderSidebar(false);
        });

        Then(
          "sidebar renders a narrow strip with icon-only buttons",
          (_ctx: TestContext) => {
            const toggle = screen.getByTestId("sidebar-toggle");
            expect(toggle.className).toContain("w-14");
          },
        );

        And(
          "sidebar toggle has {string} aria-label",
          (_ctx: TestContext, _label: string) => {
            const toggle = screen.getByTestId("sidebar-toggle");
            expect(toggle).toHaveAttribute("aria-label", "Открыть панель");
          },
        );

        And(
          "sidebar toggle has role {string}",
          (_ctx: TestContext, _role: string) => {
            const toggle = screen.getByTestId("sidebar-toggle");
            expect(toggle).toHaveAttribute("role", "button");
          },
        );
      },
    );

    // @improve-sidebar-ux @FR1
    f.Scenario(
      "Expanded sidebar container is not interactive",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.isOpen = true;
          renderSidebar(true);
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

    // @improve-sidebar-ux @FR1
    f.Scenario(
      "Clicking empty area in expanded sidebar does nothing",
      ({ Given, When, Then }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.isOpen = true;
          renderSidebar(true);
        });

        When(
          "user clicks the expanded container",
          async (_ctx: TestContext) => {
            const user = userEvent.setup();
            const container = screen.getByTestId("sidebar-expanded");
            await user.click(container);
          },
        );

        Then("sidebar remains expanded", (_ctx: TestContext) => {
          expect(mockOnToggle).not.toHaveBeenCalled();
        });
      },
    );

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Sidebar toggle is keyboard accessible",
      ({ Given, Then, When }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          f.context.isOpen = false;
          renderSidebar(false);
        });

        Then("sidebar toggle has tabIndex 0", (_ctx: TestContext) => {
          const toggle = screen.getByTestId("sidebar-toggle");
          expect(toggle).toHaveAttribute("tabindex", "0");
        });

        When(
          "user presses Enter on the toggle area",
          async (_ctx: TestContext) => {
            const user = userEvent.setup();
            const toggle = screen.getByTestId("sidebar-toggle");
            toggle.focus();
            await user.keyboard("{Enter}");
          },
        );

        Then(
          "sidebar expands to show icons and labels",
          (_ctx: TestContext) => {
            expect(mockOnToggle).toHaveBeenCalledTimes(1);
          },
        );
      },
    );
  },
);
