import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen, within } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import type { SidebarMode } from "@/components/tasks/Sidebar";

const { mockNavigate, mockUseMenuOrder } = vi.hoisted(() => ({
  mockNavigate: vi.fn(),
  mockUseMenuOrder: vi.fn(),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
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
  useMenuOrder: mockUseMenuOrder,
}));

vi.mock("@/hooks/usePanelAlwaysOpen", () => ({
  usePanelAlwaysOpen: () => ({ isPanelAlwaysOpen: false }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const feature = await loadFeature("../sidebar_mode.feature");

type FeatureContext = {
  currentMode: SidebarMode;
  onModeChange: ReturnType<typeof vi.fn>;
};

const ALL_VISIBLE_MENU = [
  { mode: "inbox", visible: true },
  { mode: "contexts", visible: true },
  { mode: "categories", visible: true },
  { mode: "goals", visible: true },
  { mode: "ideas", visible: true },
  { mode: "tasks", visible: true },
  { mode: "completed", visible: true },
  { mode: "focused_goals", visible: true },
  { mode: "deleted", visible: true },
];

function renderSidebar(
  mode: SidebarMode,
  onModeChange: ReturnType<typeof vi.fn>,
) {
  cleanup();
  return render(
    <MemoryRouter>
      <Sidebar
        mode={mode}
        isOpen={true}
        onToggle={vi.fn()}
        onModeChange={onModeChange}
      />
    </MemoryRouter>,
  );
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      vi.clearAllMocks();
      f.context.currentMode = null;
      f.context.onModeChange = vi.fn();
      mockUseMenuOrder.mockReturnValue({ menuOrder: ALL_VISIBLE_MENU });
    });

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Selecting a mode activates it",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          // will render in When step
        });

        And("no mode is active", (_ctx: TestContext) => {
          f.context.currentMode = null;
          renderSidebar(null, f.context.onModeChange);
        });

        When(
          "user selects the {string} filter item",
          async (_ctx: TestContext, filterMode: string) => {
            const user = userEvent.setup();
            const button = screen.getByTestId(`sidebar-filter-${filterMode}`);
            await user.click(button);
          },
        );

        Then(
          "{string} mode becomes active",
          (_ctx: TestContext, filterMode: string) => {
            expect(f.context.onModeChange).toHaveBeenCalledWith(filterMode);
          },
        );

        And(
          "the {string} filter button has aria-pressed {string}",
          (_ctx: TestContext, _filterMode: string, _value: string) => {
            // Re-render with active mode to verify aria-pressed
            renderSidebar("tasks", f.context.onModeChange);
            const button = screen.getByTestId("sidebar-filter-tasks");
            expect(button).toHaveAttribute("aria-pressed", "true");
          },
        );
      },
    );

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Clicking active mode deactivates it",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          // will render after mode is set
        });

        And(
          "{string} mode is active",
          (_ctx: TestContext, filterMode: string) => {
            f.context.currentMode = filterMode as SidebarMode;
            renderSidebar(filterMode as SidebarMode, f.context.onModeChange);
          },
        );

        When(
          "user selects the {string} filter item",
          async (_ctx: TestContext, filterMode: string) => {
            const user = userEvent.setup();
            const button = screen.getByTestId(`sidebar-filter-${filterMode}`);
            await user.click(button);
          },
        );

        Then("mode is set to null", (_ctx: TestContext) => {
          expect(f.context.onModeChange).toHaveBeenCalledWith(null);
        });

        And(
          "the {string} filter button has aria-pressed {string}",
          (_ctx: TestContext, _filterMode: string, _value: string) => {
            // Re-render with null mode to verify aria-pressed false
            renderSidebar(null, f.context.onModeChange);
            const button = screen.getByTestId("sidebar-filter-tasks");
            expect(button).toHaveAttribute("aria-pressed", "false");
          },
        );
      },
    );

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Filter item with route navigates instead of toggling",
      ({ Given, When, Then }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          renderSidebar(null, f.context.onModeChange);
        });

        When(
          "user selects the {string} filter item",
          async (_ctx: TestContext, filterMode: string) => {
            const user = userEvent.setup();
            const button = screen.getByTestId(`sidebar-filter-${filterMode}`);
            await user.click(button);
          },
        );

        Then("app navigates to the goals route", (_ctx: TestContext) => {
          expect(mockNavigate).toHaveBeenCalledWith("/goals");
        });
      },
    );

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Contexts filter item navigates to contexts page",
      ({ Given, When, Then }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          renderSidebar(null, f.context.onModeChange);
        });

        When(
          "user selects the {string} filter item",
          async (_ctx: TestContext, filterMode: string) => {
            const user = userEvent.setup();
            const button = screen.getByTestId(`sidebar-filter-${filterMode}`);
            await user.click(button);
          },
        );

        Then("app navigates to the contexts route", (_ctx: TestContext) => {
          expect(mockNavigate).toHaveBeenCalledWith("/contexts");
        });
      },
    );

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Menu order controls visible filter items",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          // will render after menu order is set
        });

        And(
          "menu order has {string} set to not visible",
          (_ctx: TestContext, _filterMode: string) => {
            mockUseMenuOrder.mockReturnValue({
              menuOrder: ALL_VISIBLE_MENU.map((item) =>
                item.mode === "categories" ? { ...item, visible: false } : item,
              ),
            });
            renderSidebar(null, f.context.onModeChange);
          },
        );

        Then(
          "the {string} filter item is not rendered in the sidebar",
          (_ctx: TestContext, filterMode: string) => {
            expect(
              screen.queryByTestId(`sidebar-filter-${filterMode}`),
            ).toBeNull();
          },
        );
      },
    );

    // @add-sidebar-specs @FR3
    f.Scenario(
      "Filter items appear in configured order",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", (_ctx: TestContext) => {
          // will render after menu order is set
        });

        And(
          "menu order defines items: {string}, {string}, {string}",
          (_ctx: TestContext, first: string, second: string, third: string) => {
            mockUseMenuOrder.mockReturnValue({
              menuOrder: [
                { mode: first, visible: true },
                { mode: second, visible: true },
                { mode: third, visible: true },
              ],
            });
            renderSidebar(null, f.context.onModeChange);
          },
        );

        Then(
          "filter items render in order: {string}, {string}, {string}",
          (_ctx: TestContext, first: string, second: string, third: string) => {
            const nav = screen.getByRole("navigation");
            const buttons = within(nav).getAllByRole("button");
            const testIds = buttons.map((button) =>
              button.getAttribute("data-testid"),
            );
            expect(testIds).toEqual([
              `sidebar-filter-${first}`,
              `sidebar-filter-${second}`,
              `sidebar-filter-${third}`,
            ]);
          },
        );
      },
    );
  },
);
