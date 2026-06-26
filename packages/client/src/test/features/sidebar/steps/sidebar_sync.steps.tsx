import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext, vi } from "vitest";
import { SETTINGS_SECTION_IDS } from "@/constants";

const { mockNavigate, mockUseConnectionStatus, mockSignIn } = vi.hoisted(
  () => ({
    mockNavigate: vi.fn(),
    mockUseConnectionStatus: vi.fn(),
    mockSignIn: vi.fn(),
  }),
);

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("@/app/providers/AuthProvider", () => ({
  useAuth: () => ({ userPicture: null, signIn: mockSignIn }),
}));

vi.mock("@/app/providers/SyncProvider", () => ({
  useSync: () => ({ syncStatus: "idle", pull: vi.fn() }),
}));

vi.mock("@/hooks/useConnectionStatus", () => ({
  useConnectionStatus: mockUseConnectionStatus,
}));

vi.mock("@/hooks/useMenuOrder", () => ({
  useMenuOrder: () => ({ menuOrder: [] }),
}));

import { Sidebar } from "@/components/tasks/Sidebar";

const feature = await loadFeature("../sidebar_sync.feature");

type FeatureContext = Record<string, never>;

function renderSidebar() {
  return render(
    <MemoryRouter>
      <Sidebar
        mode={null}
        effectiveState="expanded"
        isDrawerOpen={false}
        onModeChange={vi.fn()}
      />
    </MemoryRouter>,
  );
}

function givenSidebarIsExpanded(_ctx: TestContext) {
  // render after connection status is set
}

function andConnectionStatusIs(_ctx: TestContext, status: string) {
  mockUseConnectionStatus.mockReturnValue(status);
  renderSidebar();
}

function thenSyncButtonShowsRedErrorBadge(_ctx: TestContext) {
  const syncButton = screen.getByTestId("sidebar-sync");
  expect(syncButton.querySelector(".bg-red-500")).toBeTruthy();
}

function thenSyncButtonIsNotDisplayed(_ctx: TestContext) {
  expect(screen.queryByTestId("sidebar-sync")).toBeNull();
}

function thenSignInButtonIsDisplayed(_ctx: TestContext) {
  expect(screen.getByTestId("sidebar-sign-in")).toBeInTheDocument();
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      mockUseConnectionStatus.mockReturnValue("synced");
    });

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Synced state shows static sync button",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        Then("sync button is displayed", (_ctx: TestContext) => {
          expect(screen.getByTestId("sidebar-sync")).toBeInTheDocument();
        });

        And("sync icon is not spinning", (_ctx: TestContext) => {
          const syncButton = screen.getByTestId("sidebar-sync");
          const icon = syncButton.querySelector("svg");
          expect(icon?.getAttribute("class")).not.toContain("animate-spin");
        });
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario("Syncing state shows spinning icon", ({ Given, Then, And }) => {
      Given("sidebar is expanded", givenSidebarIsExpanded);
      And("connection status is {string}", andConnectionStatusIs);

      Then("sync button is displayed", (_ctx: TestContext) => {
        expect(screen.getByTestId("sidebar-sync")).toBeInTheDocument();
      });

      And("sync icon is spinning", (_ctx: TestContext) => {
        const syncButton = screen.getByTestId("sidebar-sync");
        const icon = syncButton.querySelector("svg");
        expect(icon?.getAttribute("class")).toContain("animate-spin");
      });
    });

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Offline state shows error badge and no connection text",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        Then(
          "sync button shows a red error badge",
          thenSyncButtonShowsRedErrorBadge,
        );

        And(
          "sidebar shows {string} text",
          (_ctx: TestContext, _expectedText: string) => {
            const syncButton = screen.getByTestId("sidebar-sync");
            expect(syncButton.textContent).toContain("Нет связи");
          },
        );
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Server error state shows error badge and error text",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        Then(
          "sync button shows a red error badge",
          thenSyncButtonShowsRedErrorBadge,
        );

        And(
          "sidebar shows {string} text",
          (_ctx: TestContext, _expectedText: string) => {
            const syncButton = screen.getByTestId("sidebar-sync");
            expect(syncButton.textContent).toContain("Ошибка сервера");
          },
        );
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Configure server button when not configured",
      ({ Given, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        Then("a configure server button is displayed", (_ctx: TestContext) => {
          expect(screen.getByTestId("sidebar-login")).toBeInTheDocument();
        });

        And("sync button is not displayed", thenSyncButtonIsNotDisplayed);
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Configure server button navigates to settings",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        When(
          "user clicks the configure server button",
          async (_ctx: TestContext) => {
            const user = userEvent.setup();
            await user.click(screen.getByTestId("sidebar-login"));
          },
        );

        Then("app navigates to settings", (_ctx: TestContext) => {
          expect(mockNavigate).toHaveBeenCalledWith("/settings", {
            state: { expandSection: SETTINGS_SECTION_IDS.ACCOUNT_SYNC },
          });
        });
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario("Sign-in button when unauthorized", ({ Given, Then, And }) => {
      Given("sidebar is expanded", givenSidebarIsExpanded);
      And("connection status is {string}", andConnectionStatusIs);

      Then("a sign-in button is displayed", thenSignInButtonIsDisplayed);
      And("sync button is not displayed", thenSyncButtonIsNotDisplayed);
    });

    // @add-sidebar-specs @FR5
    f.Scenario("Sign-in button when no auth", ({ Given, Then, And }) => {
      Given("sidebar is expanded", givenSidebarIsExpanded);
      And("connection status is {string}", andConnectionStatusIs);

      Then("a sign-in button is displayed", thenSignInButtonIsDisplayed);
    });

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Clicking sign-in invokes auth flow",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        When("user clicks the sign-in button", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          await user.click(screen.getByTestId("sidebar-sign-in"));
        });

        Then("the sign-in function is called", (_ctx: TestContext) => {
          expect(mockSignIn).toHaveBeenCalledTimes(1);
        });
      },
    );

    // @add-sidebar-specs @FR5
    f.Scenario(
      "Account button navigates to settings",
      ({ Given, When, Then, And }) => {
        Given("sidebar is expanded", givenSidebarIsExpanded);
        And("connection status is {string}", andConnectionStatusIs);

        When("user clicks the account button", async (_ctx: TestContext) => {
          const user = userEvent.setup();
          await user.click(screen.getByTestId("sidebar-account"));
        });

        Then("app navigates to settings", (_ctx: TestContext) => {
          expect(mockNavigate).toHaveBeenCalledWith("/settings");
        });
      },
    );
  },
);
