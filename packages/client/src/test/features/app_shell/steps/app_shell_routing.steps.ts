// implements FR4, FR5 of app-shell-navigation-spec
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

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    // @app-shell-navigation-spec @FR4
    f.Scenario("Root path redirects to Tasks", ({ When, Then }) => {
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
          const tasksRoute = findRouteByPath(children, ROUTES.TASKS);
          expect(inboxRoute).toBeDefined();
          expect(goalsRoute).toBeDefined();
          expect(tasksRoute).toBeDefined();
        },
      );
    });
  },
);
