import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";

const mockOnToggle = vi.fn();

const { mockUsePanelAlwaysOpen } = vi.hoisted(() => ({
  mockUsePanelAlwaysOpen: vi.fn(),
}));

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

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: mockUsePanelAlwaysOpen,
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const feature = await loadFeature("../sidebar_toggle.feature");

type FeatureContext = {
  isOpen: boolean;
  isPanelAlwaysOpen: boolean;
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
      f.context.isPanelAlwaysOpen = false;
      mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
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

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Sidebar closes from expanded state",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.isOpen = true;
        });

        And("always-open mode is disabled", (_ctx: TestContext) => {
          mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
          renderSidebar(true);
        });

        When("user clicks the panel area", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          const toggle = screen.getByTestId("sidebar-toggle");
          await user.click(toggle);
        });

        Then("sidebar collapses to show icons only", (_ctx: TestContext) => {
          expect(mockOnToggle).toHaveBeenCalledTimes(1);
        });
      },
    );

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

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Expanded sidebar renders full panel",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          f.context.isOpen = true;
        });

        And("always-open mode is disabled", (_ctx: TestContext) => {
          mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
          renderSidebar(true);
        });

        Then(
          "sidebar renders a full panel with icons and labels",
          (_ctx: TestContext) => {
            const toggle = screen.getByTestId("sidebar-toggle");
            expect(toggle.className).toContain("w-52");
          },
        );

        And(
          "sidebar toggle has {string} aria-label",
          (_ctx: TestContext, _label: string) => {
            const toggle = screen.getByTestId("sidebar-toggle");
            expect(toggle).toHaveAttribute("aria-label", "Закрыть панель");
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

    // @add-sidebar-specs @FR2
    f.Scenario("Always-open mode prevents collapse", ({ Given, Then, And }) => {
      Given("always-open mode is enabled", (_ctx: TestContext) => {
        f.context.isPanelAlwaysOpen = true;
        mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: true });
        renderSidebar(false);
      });

      Then("sidebar is expanded", (_ctx: TestContext) => {
        const toggle = screen.getByTestId("sidebar-toggle");
        expect(toggle.className).toContain("w-52");
      });

      And(
        "sidebar toggle does not have role {string}",
        (_ctx: TestContext, _role: string) => {
          const toggle = screen.getByTestId("sidebar-toggle");
          expect(toggle).not.toHaveAttribute("role");
        },
      );

      And(
        "sidebar toggle does not have {string} aria-label",
        (_ctx: TestContext, _label: string) => {
          const toggle = screen.getByTestId("sidebar-toggle");
          expect(toggle).not.toHaveAttribute("aria-label");
        },
      );
    });

    // @add-sidebar-specs @FR2
    f.Scenario(
      "Sidebar toggle is keyboard accessible",
      ({ Given, Then, When, And }) => {
        Given("sidebar is collapsed", (_ctx: TestContext) => {
          f.context.isOpen = false;
        });

        And("always-open mode is disabled", (_ctx: TestContext) => {
          mockUsePanelAlwaysOpen.mockReturnValue({ isPanelAlwaysOpen: false });
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
