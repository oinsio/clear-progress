// implements FR1, FR2, FR8, FR9, FR10, NFR-A1, NFR-A2 of app-shell-navigation-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { cleanup, render, screen } from "@testing-library/react/pure";
import { MemoryRouter } from "react-router-dom";
import { expect, type TestContext } from "vitest";
import { BOTTOM_NAV_ITEMS, BottomNav } from "@/components/layout/BottomNav";
import { ROUTES } from "@/constants";

const feature = await loadFeature("../app_shell_nav_items.feature");

const EXPECTED_NAV_COUNT = 5;

type FeatureContext = Record<string, never>;

function renderBottomNav(initialEntries = ["/"]) {
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

    // @app-shell-navigation-spec @FR1
    f.Scenario("All five navigation items are rendered", ({ When, Then }) => {
      When("BottomNav is rendered", (_ctx: TestContext) => {
        renderBottomNav();
      });

      Then("five navigation links are present", (_ctx: TestContext) => {
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(EXPECTED_NAV_COUNT);
      });
    });

    // @app-shell-navigation-spec @FR1 @FR2
    f.Scenario(
      "Navigation items link to correct routes",
      ({ When, Then, And }) => {
        When("BottomNav is rendered", (_ctx: TestContext) => {
          renderBottomNav();
        });

        Then('Inbox links to "/tasks"', (_ctx: TestContext) => {
          const inboxLink = screen.getByRole("link", { name: /входящие/i });
          expect(inboxLink).toHaveAttribute("href", ROUTES.INBOX);
        });

        And('Today links to "/today"', (_ctx: TestContext) => {
          const todayLink = screen.getByRole("link", { name: /сегодня/i });
          expect(todayLink).toHaveAttribute("href", ROUTES.TODAY);
        });

        And('Goals links to "/goals"', (_ctx: TestContext) => {
          const goalsLink = screen.getByRole("link", { name: /цели/i });
          expect(goalsLink).toHaveAttribute("href", ROUTES.GOALS);
        });

        And('Ideas links to "/ideas"', (_ctx: TestContext) => {
          const ideasLink = screen.getByRole("link", { name: /идеи/i });
          expect(ideasLink).toHaveAttribute("href", ROUTES.IDEAS);
        });

        And('Search links to "/search"', (_ctx: TestContext) => {
          const searchLink = screen.getByRole("link", { name: /поиск/i });
          expect(searchLink).toHaveAttribute("href", ROUTES.SEARCH);
        });
      },
    );

    // @app-shell-navigation-spec @FR1
    f.Scenario("Navigation items appear in correct order", ({ When, Then }) => {
      When("BottomNav is rendered", (_ctx: TestContext) => {
        renderBottomNav();
      });

      Then(
        "items appear in order: Inbox, Today, Goals, Ideas, Search",
        (_ctx: TestContext) => {
          const links = screen.getAllByRole("link");
          const expectedRoutes = [
            ROUTES.INBOX,
            ROUTES.TODAY,
            ROUTES.GOALS,
            ROUTES.IDEAS,
            ROUTES.SEARCH,
          ];
          const actualRoutes = links.map((link) => link.getAttribute("href"));
          expect(actualRoutes).toEqual(expectedRoutes);
        },
      );
    });

    // @app-shell-navigation-spec @FR9 @NFR-A2
    f.Scenario("Navigation item icons have aria-hidden", ({ When, Then }) => {
      When("BottomNav is rendered", (_ctx: TestContext) => {
        renderBottomNav();
      });

      Then(
        "all navigation item icons have aria-hidden true",
        (_ctx: TestContext) => {
          const hiddenElements = screen
            .getAllByRole("link")
            .map((link) => link.querySelector("[aria-hidden='true']"))
            .filter(Boolean);
          expect(hiddenElements).toHaveLength(EXPECTED_NAV_COUNT);
        },
      );
    });

    // @app-shell-navigation-spec @FR10 @NFR-A1
    f.Scenario("Navigation element has aria-label", ({ When, Then }) => {
      When("BottomNav is rendered", (_ctx: TestContext) => {
        renderBottomNav();
      });

      Then(
        "the navigation element has a descriptive aria-label",
        (_ctx: TestContext) => {
          const navElement = screen.getByRole("navigation");
          expect(navElement).toHaveAttribute("aria-label");
          expect(navElement.getAttribute("aria-label")).toBeTruthy();
        },
      );
    });

    // @app-shell-navigation-spec @FR8
    f.Scenario("Navigation labels are translated", ({ When, Then }) => {
      When("BottomNav is rendered", (_ctx: TestContext) => {
        renderBottomNav();
      });

      Then("each item uses a translated label", (_ctx: TestContext) => {
        const links = screen.getAllByRole("link");
        expect(links).toHaveLength(BOTTOM_NAV_ITEMS.length);
        // Each link should have text content (translated label, not a raw key)
        for (const link of links) {
          expect(link.textContent).toBeTruthy();
          expect(link.textContent).not.toContain("nav.");
        }
      });
    });
  },
);
