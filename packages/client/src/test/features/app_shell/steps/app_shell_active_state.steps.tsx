// implements FR3 of app-shell-navigation-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext } from "vitest";
import { BottomNav } from "@/components/layout/BottomNav";

const feature = await loadFeature("../app_shell_active_state.feature");

type FeatureContext = Record<string, never>;

function renderBottomNav(initialEntries: string[]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <BottomNav />
    </MemoryRouter>,
  );
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
    });

    // @app-shell-navigation-spec @FR3
    f.Scenario(
      "Active item has aria-current page on Inbox route",
      ({ Given, When, Then }) => {
        let currentRoute: string;

        Given('user is on the "/tasks" route', (_ctx: TestContext) => {
          currentRoute = "/tasks";
        });

        When("BottomNav is rendered", (_ctx: TestContext) => {
          renderBottomNav([currentRoute]);
        });

        Then(
          'Inbox navigation item has aria-current "page"',
          (_ctx: TestContext) => {
            const inboxLink = screen.getByRole("link", {
              name: /входящие/i,
            });
            expect(inboxLink).toHaveAttribute("aria-current", "page");
          },
        );
      },
    );

    // @app-shell-navigation-spec @FR3
    f.Scenario(
      "Non-active items lack aria-current",
      ({ Given, When, Then }) => {
        let currentRoute: string;

        Given('user is on the "/tasks" route', (_ctx: TestContext) => {
          currentRoute = "/tasks";
        });

        When("BottomNav is rendered", (_ctx: TestContext) => {
          renderBottomNav([currentRoute]);
        });

        Then(
          "Today navigation item does not have aria-current",
          (_ctx: TestContext) => {
            const todayLink = screen.getByRole("link", {
              name: /сегодня/i,
            });
            expect(todayLink).not.toHaveAttribute("aria-current");
          },
        );
      },
    );

    // @app-shell-navigation-spec @FR3
    f.Scenario(
      "Active item has aria-current page on Goals route",
      ({ Given, When, Then }) => {
        let currentRoute: string;

        Given('user is on the "/goals" route', (_ctx: TestContext) => {
          currentRoute = "/goals";
        });

        When("BottomNav is rendered", (_ctx: TestContext) => {
          renderBottomNav([currentRoute]);
        });

        Then(
          'Goals navigation item has aria-current "page"',
          (_ctx: TestContext) => {
            const goalsLink = screen.getByRole("link", {
              name: /цели/i,
            });
            expect(goalsLink).toHaveAttribute("aria-current", "page");
          },
        );
      },
    );

    // @app-shell-navigation-spec @FR3
    f.Scenario(
      "Active item has aria-current page on Today route",
      ({ Given, When, Then }) => {
        let currentRoute: string;

        Given('user is on the "/today" route', (_ctx: TestContext) => {
          currentRoute = "/today";
        });

        When("BottomNav is rendered", (_ctx: TestContext) => {
          renderBottomNav([currentRoute]);
        });

        Then(
          'Today navigation item has aria-current "page"',
          (_ctx: TestContext) => {
            const todayLink = screen.getByRole("link", {
              name: /сегодня/i,
            });
            expect(todayLink).toHaveAttribute("aria-current", "page");
          },
        );
      },
    );
  },
);
