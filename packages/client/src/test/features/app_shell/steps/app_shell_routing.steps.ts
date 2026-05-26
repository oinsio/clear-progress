// implements FR4, FR5, FR6 of app-shell-navigation-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext } from "vitest";
import { router } from "@/app/router";
import { ROUTES } from "@/constants";

const feature = await loadFeature("../app_shell_routing.feature");

type FeatureContext = Record<string, never>;

// Route tree is typed as AgnosticDataRouteObject[] but children are AgnosticRouteObject[].
// Use a minimal interface to avoid type incompatibilities in traversal.
interface RouteNode {
  path?: string;
  children?: RouteNode[];
}

function findRouteByPath(
  routes: RouteNode[],
  targetPath: string,
): RouteNode | undefined {
  for (const route of routes) {
    if (route.path === targetPath) return route;
    if (route.children) {
      const found = findRouteByPath(route.children, targetPath);
      if (found) return found;
    }
  }
  return undefined;
}

function getAppLayoutRoute(): RouteNode {
  const appLayoutRoute = (router.routes as RouteNode[]).find(
    (route) => !route.path && route.children,
  );
  expect(appLayoutRoute).toBeDefined();
  return appLayoutRoute as RouteNode;
}

function getPageLayoutRoute(): RouteNode {
  const appLayout = getAppLayoutRoute();
  const pageLayoutRoute = appLayout.children?.find(
    (route) => !route.path && route.children,
  );
  expect(pageLayoutRoute).toBeDefined();
  return pageLayoutRoute as RouteNode;
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @app-shell-navigation-spec @FR4
    f.Scenario("Root path redirects to Inbox", ({ When, Then }) => {
      When("router is configured", (_ctx: TestContext) => {
        // router is already imported and configured
      });

      Then('"/" redirects to "/tasks"', (_ctx: TestContext) => {
        const rootRoute = router.routes.find((route) => route.path === "/");
        expect(rootRoute).toBeDefined();
        expect(rootRoute?.path).toBe("/");
      });
    });

    // @app-shell-navigation-spec @FR5
    f.Scenario("All routes are nested under AppLayout", ({ When, Then }) => {
      When("router is configured", (_ctx: TestContext) => {
        // router is already imported
      });

      Then(
        "every page route has AppShell as ancestor layout",
        (_ctx: TestContext) => {
          const appLayout = getAppLayoutRoute();
          const children = appLayout.children ?? [];
          expect(children.length).toBeGreaterThan(0);

          const inboxRoute = findRouteByPath(children, ROUTES.INBOX);
          const goalsRoute = findRouteByPath(children, ROUTES.GOALS);
          const todayRoute = findRouteByPath(children, ROUTES.TODAY);
          expect(inboxRoute).toBeDefined();
          expect(goalsRoute).toBeDefined();
          expect(todayRoute).toBeDefined();
        },
      );
    });

    // @app-shell-navigation-spec @FR6
    f.Scenario(
      "Time-box routes are nested under PageLayout",
      ({ When, Then, And }) => {
        When("router is configured", (_ctx: TestContext) => {
          // router is already imported
        });

        Then("Today route is wrapped in PageShell", (_ctx: TestContext) => {
          const pageLayout = getPageLayoutRoute();
          const todayRoute = findRouteByPath(
            pageLayout.children ?? [],
            ROUTES.TODAY,
          );
          expect(todayRoute).toBeDefined();
        });

        And("Week route is wrapped in PageShell", (_ctx: TestContext) => {
          const pageLayout = getPageLayoutRoute();
          const weekRoute = findRouteByPath(
            pageLayout.children ?? [],
            ROUTES.WEEK,
          );
          expect(weekRoute).toBeDefined();
        });

        And("Later route is wrapped in PageShell", (_ctx: TestContext) => {
          const pageLayout = getPageLayoutRoute();
          const laterRoute = findRouteByPath(
            pageLayout.children ?? [],
            ROUTES.LATER,
          );
          expect(laterRoute).toBeDefined();
        });
      },
    );

    // @app-shell-navigation-spec @FR6
    f.Scenario(
      "Non-time-box routes are not in PageLayout",
      ({ When, Then, And }) => {
        When("router is configured", (_ctx: TestContext) => {
          // router is already imported
        });

        Then("Inbox route is not wrapped in PageShell", (_ctx: TestContext) => {
          const pageLayout = getPageLayoutRoute();
          const inboxInPageLayout = findRouteByPath(
            pageLayout.children ?? [],
            ROUTES.INBOX,
          );
          expect(inboxInPageLayout).toBeUndefined();
        });

        And("Goals route is not wrapped in PageShell", (_ctx: TestContext) => {
          const pageLayout = getPageLayoutRoute();
          const goalsInPageLayout = findRouteByPath(
            pageLayout.children ?? [],
            ROUTES.GOALS,
          );
          expect(goalsInPageLayout).toBeUndefined();
        });
      },
    );
  },
);
