import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { MenuItemConfig } from "@clear-progress/contract";
import { expect, type TestContext } from "vitest";
import {
  _resetForTesting,
  getSnapshot,
  setMenuOrder,
  subscribe,
} from "@/stores/menuOrderStore";

const feature = await loadFeature("../menu_order_reactivity.feature");

type FeatureContext = {
  subscriberSnapshot: MenuItemConfig[];
  subscriberCallCount: number;
  unsubscribe: () => void;
};

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    const REORDERED_MENU: MenuItemConfig[] = [
      { mode: "goals", visible: true },
      { mode: "inbox", visible: true },
      { mode: "contexts", visible: true },
      { mode: "categories", visible: true },
      { mode: "ideas", visible: true },
      { mode: "tasks", visible: true },
      { mode: "completed", visible: true },
      { mode: "focused_goals", visible: true },
      { mode: "deleted", visible: false },
    ];

    f.BeforeEachScenario(() => {
      localStorage.clear();
      _resetForTesting();
      f.context.subscriberCallCount = 0;
      f.context.subscriberSnapshot = [];
    });

    function setupSubscriber() {
      f.context.unsubscribe = subscribe(() => {
        f.context.subscriberSnapshot = getSnapshot();
        f.context.subscriberCallCount++;
      });
    }

    // @fix-menu-order-reactivity @FR1
    f.Scenario(
      "Menu order changed in one instance reflected in another",
      ({ Given, When, Then }) => {
        Given(
          "two independent consumers of menu order",
          (_ctx: TestContext) => {
            setupSubscriber();
          },
        );

        When(
          "the first consumer changes the menu order",
          (_ctx: TestContext) => {
            setMenuOrder(REORDERED_MENU);
          },
        );

        Then(
          "the second consumer receives the updated menu order",
          (_ctx: TestContext) => {
            const subscriberModes = f.context.subscriberSnapshot.map(
              (item) => item.mode,
            );
            expect(subscriberModes[0]).toBe("goals");
            expect(subscriberModes[1]).toBe("inbox");
            expect(f.context.subscriberCallCount).toBe(1);
            f.context.unsubscribe();
          },
        );
      },
    );

    // @fix-menu-order-reactivity @FR1
    f.Scenario(
      "Menu item visibility toggled reflected across instances",
      ({ Given, When, Then }) => {
        Given(
          "two independent consumers of menu order",
          (_ctx: TestContext) => {
            setupSubscriber();
          },
        );

        When("the first consumer hides a menu item", (_ctx: TestContext) => {
          setMenuOrder((prev) =>
            prev.map((item) =>
              item.mode === "ideas" ? { ...item, visible: false } : item,
            ),
          );
        });

        Then(
          "the second consumer sees the item as hidden",
          (_ctx: TestContext) => {
            const ideasItem = f.context.subscriberSnapshot.find(
              (item) => item.mode === "ideas",
            );
            expect(ideasItem?.visible).toBe(false);
            f.context.unsubscribe();
          },
        );
      },
    );

    // @fix-menu-order-reactivity @FR1
    f.Scenario(
      "Multiple rapid changes all reflected",
      ({ Given, When, Then }) => {
        Given(
          "two independent consumers of menu order",
          (_ctx: TestContext) => {
            setupSubscriber();
          },
        );

        When(
          "the first consumer makes three rapid order changes",
          (_ctx: TestContext) => {
            setMenuOrder(REORDERED_MENU);

            setMenuOrder([
              { mode: "tasks", visible: true },
              { mode: "inbox", visible: true },
            ]);

            setMenuOrder([
              { mode: "completed", visible: true },
              { mode: "goals", visible: true },
            ]);
          },
        );

        Then(
          "the second consumer reflects the final order",
          (_ctx: TestContext) => {
            const subscriberModes = f.context.subscriberSnapshot.map(
              (item) => item.mode,
            );
            expect(subscriberModes).toEqual(["completed", "goals"]);
            expect(f.context.subscriberCallCount).toBe(3);
            f.context.unsubscribe();
          },
        );
      },
    );
  },
);
