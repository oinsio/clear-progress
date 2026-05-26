// implements FR4, FR5, FR6, FR7 of drag-and-drop-spec
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import type { DragEndEvent } from "@dnd-kit/core";
import { arrayMove } from "@dnd-kit/sortable";
import { expect, type TestContext, vi } from "vitest";

const feature = await loadFeature("../drag_and_drop_handler.feature");

interface SimpleItem {
  id: string;
  name: string;
}

/**
 * Implements FR4-FR7 of drag-and-drop-spec.
 * Replicates the handleDragEnd pattern used across all entity list pages.
 */
function handleDragEnd(
  items: SimpleItem[],
  event: DragEndEvent,
  onReorder: (reordered: SimpleItem[]) => void,
): void {
  const { active, over } = event;
  if (!over || active.id === over.id) return;
  const oldIndex = items.findIndex((item) => item.id === active.id);
  const newIndex = items.findIndex((item) => item.id === over.id);
  const reorderedItems = arrayMove(items, oldIndex, newIndex);
  onReorder(reorderedItems);
}

function buildDragEndEvent(
  activeId: string,
  overId: string | null,
): DragEndEvent {
  return {
    active: { id: activeId } as DragEndEvent["active"],
    over: overId ? ({ id: overId } as DragEndEvent["over"]) : null,
    activatorEvent: new Event("pointer"),
    collisions: null,
    delta: { x: 0, y: 0 },
  };
}

type FeatureContext = Record<string, never>;

const EXPECTED_CALL_COUNT_ONCE = 1;

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    let items: SimpleItem[];
    let reorderCallback: ReturnType<
      typeof vi.fn<(reordered: SimpleItem[]) => void>
    >;

    f.BeforeEachScenario(() => {
      items = [];
      reorderCallback = vi.fn<(reordered: SimpleItem[]) => void>();
    });

    function seedItems(...names: string[]): void {
      items = names.map((name) => ({ id: name, name }));
    }

    // @drag-and-drop-spec @FR4
    f.Scenario(
      "Drop outside valid zone is ignored",
      ({ Given, When, Then }) => {
        Given("a list of items A, B, C", (_ctx: TestContext) => {
          seedItems("A", "B", "C");
        });

        When("user drops an item with no valid target", (_ctx: TestContext) => {
          const event = buildDragEndEvent("A", null);
          handleDragEnd(items, event, reorderCallback);
        });

        Then("the reorder callback is not called", (_ctx: TestContext) => {
          expect(reorderCallback).not.toHaveBeenCalled();
        });
      },
    );

    // @drag-and-drop-spec @FR5
    f.Scenario("Drop on same position is ignored", ({ Given, When, Then }) => {
      Given("a list of items A, B, C", (_ctx: TestContext) => {
        seedItems("A", "B", "C");
      });

      When("user drops item A onto item A", (_ctx: TestContext) => {
        const event = buildDragEndEvent("A", "A");
        handleDragEnd(items, event, reorderCallback);
      });

      Then("the reorder callback is not called", (_ctx: TestContext) => {
        expect(reorderCallback).not.toHaveBeenCalled();
      });
    });

    // @drag-and-drop-spec @FR6
    f.Scenario(
      "Item moved from position 0 to position 2",
      ({ Given, When, Then }) => {
        Given("a list of items A, B, C", (_ctx: TestContext) => {
          seedItems("A", "B", "C");
        });

        When("user drags A and drops onto C", (_ctx: TestContext) => {
          const event = buildDragEndEvent("A", "C");
          handleDragEnd(items, event, reorderCallback);
        });

        Then(
          "the reorder callback receives items B, C, A",
          (_ctx: TestContext) => {
            const receivedNames = reorderCallback.mock.calls[0][0].map(
              (item: SimpleItem) => item.name,
            );
            expect(receivedNames).toEqual(["B", "C", "A"]);
          },
        );
      },
    );

    // @drag-and-drop-spec @FR6
    f.Scenario(
      "Item moved from position 2 to position 0",
      ({ Given, When, Then }) => {
        Given("a list of items A, B, C", (_ctx: TestContext) => {
          seedItems("A", "B", "C");
        });

        When("user drags C and drops onto A", (_ctx: TestContext) => {
          const event = buildDragEndEvent("C", "A");
          handleDragEnd(items, event, reorderCallback);
        });

        Then(
          "the reorder callback receives items C, A, B",
          (_ctx: TestContext) => {
            const receivedNames = reorderCallback.mock.calls[0][0].map(
              (item: SimpleItem) => item.name,
            );
            expect(receivedNames).toEqual(["C", "A", "B"]);
          },
        );
      },
    );

    // @drag-and-drop-spec @FR7
    f.Scenario(
      "Reorder callback receives reordered items",
      ({ Given, When, Then, And }) => {
        Given("a list of items A, B, C", (_ctx: TestContext) => {
          seedItems("A", "B", "C");
        });

        When("user drags B and drops onto A", (_ctx: TestContext) => {
          const event = buildDragEndEvent("B", "A");
          handleDragEnd(items, event, reorderCallback);
        });

        Then(
          "the reorder callback receives items B, A, C",
          (_ctx: TestContext) => {
            const receivedNames = reorderCallback.mock.calls[0][0].map(
              (item: SimpleItem) => item.name,
            );
            expect(receivedNames).toEqual(["B", "A", "C"]);
          },
        );

        And(
          "the reorder callback is called exactly once",
          (_ctx: TestContext) => {
            expect(reorderCallback).toHaveBeenCalledTimes(
              EXPECTED_CALL_COUNT_ONCE,
            );
          },
        );
      },
    );
  },
);
