// implements FR15, FR16 of swipeable-item
import type { FeatureDescriibeCallbackParams } from "@amiceli/vitest-cucumber";
import { describeFeature, loadFeature } from "@amiceli/vitest-cucumber";
import { expect, type TestContext, vi } from "vitest";

const SORTABLE_DRAGGING_OPACITY = 0.5;

const { mockUseSortable } = vi.hoisted(() => ({
  mockUseSortable: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: mockUseSortable,
}));

import { cleanup, render, screen } from "@testing-library/react/pure";
import type { DragHandleProps } from "@/components/shared/SortableItem";
import { SortableItem } from "@/components/shared/SortableItem";

const feature = await loadFeature("../sortable_item_render_prop.feature");

type FeatureContext = Record<string, never>;

const DEFAULT_SORTABLE_RETURN = {
  attributes: { role: "button", tabIndex: 0 },
  listeners: { onPointerDown: vi.fn() },
  setNodeRef: vi.fn(),
  setActivatorNodeRef: vi.fn(),
  transform: null,
  transition: undefined,
  isDragging: false,
};

let capturedIsDragging: boolean | undefined;
let capturedDragHandleProps: DragHandleProps | undefined;

function getWrapper() {
  const childElement = screen.getByTestId("child");
  const wrapper = childElement.parentElement;
  if (!wrapper) throw new Error("Wrapper element not found");
  return wrapper;
}

function renderWithCapture(id = "test-id") {
  render(
    <SortableItem id={id}>
      {({ isDragging, dragHandleProps }) => {
        capturedIsDragging = isDragging;
        capturedDragHandleProps = dragHandleProps;
        return <span data-testid="child">Content</span>;
      }}
    </SortableItem>,
  );
}

describeFeature(
  feature,
  (f: FeatureDescriibeCallbackParams<FeatureContext>) => {
    f.BeforeEachScenario(() => {
      cleanup();
      vi.clearAllMocks();
      capturedIsDragging = undefined;
      capturedDragHandleProps = undefined;
      mockUseSortable.mockReturnValue({ ...DEFAULT_SORTABLE_RETURN });
    });

    // @swipeable-item @FR15
    f.Scenario(
      "Children receive isDragging and dragHandleProps",
      ({ When, Then, And }) => {
        When(
          "SortableItem renders with a render-prop child",
          (_ctx: TestContext) => {
            renderWithCapture();
          },
        );

        Then("the child receives isDragging as false", (_ctx: TestContext) => {
          expect(capturedIsDragging).toBe(false);
        });

        And(
          "the child receives dragHandleProps with ref and attributes",
          (_ctx: TestContext) => {
            expect(capturedDragHandleProps).toBeDefined();
            expect(capturedDragHandleProps?.ref).toBeTypeOf("function");
            expect(capturedDragHandleProps?.attributes).toBeDefined();
          },
        );
      },
    );

    // @swipeable-item @FR15
    f.Scenario("isDragging is true during drag", ({ Given, When, Then }) => {
      Given("useSortable returns isDragging true", (_ctx: TestContext) => {
        mockUseSortable.mockReturnValue({
          ...DEFAULT_SORTABLE_RETURN,
          isDragging: true,
        });
      });

      When(
        "SortableItem renders with a render-prop child",
        (_ctx: TestContext) => {
          renderWithCapture();
        },
      );

      Then("the child receives isDragging as true", (_ctx: TestContext) => {
        expect(capturedIsDragging).toBe(true);
      });
    });

    // @swipeable-item @FR15
    f.Scenario(
      "Vertical transform applied during drag",
      ({ Given, When, Then }) => {
        const VERTICAL_OFFSET_PX = 120;

        Given(
          "useSortable returns a vertical transform",
          (_ctx: TestContext) => {
            mockUseSortable.mockReturnValue({
              ...DEFAULT_SORTABLE_RETURN,
              transform: { x: 0, y: VERTICAL_OFFSET_PX, scaleX: 1, scaleY: 1 },
              transition: "transform 200ms ease",
            });
          },
        );

        When(
          "SortableItem renders with a render-prop child",
          (_ctx: TestContext) => {
            renderWithCapture();
          },
        );

        Then(
          "the wrapper has translate3d with the vertical offset",
          (_ctx: TestContext) => {
            const wrapper = getWrapper();
            expect(wrapper.style.transform).toBe(
              `translate3d(0, ${VERTICAL_OFFSET_PX}px, 0)`,
            );
          },
        );
      },
    );

    // @swipeable-item @FR15
    f.Scenario("No transform at rest", ({ When, Then }) => {
      When(
        "SortableItem renders with a render-prop child",
        (_ctx: TestContext) => {
          renderWithCapture();
        },
      );

      Then("the wrapper has no transform applied", (_ctx: TestContext) => {
        const wrapper = getWrapper();
        expect(wrapper.style.transform).toBe("");
      });
    });

    // @swipeable-item @FR15
    f.Scenario("SortableItem uses provided id", ({ When, Then }) => {
      const SPECIFIC_ITEM_ID = "test-item-42";

      When("SortableItem renders with a specific id", (_ctx: TestContext) => {
        renderWithCapture(SPECIFIC_ITEM_ID);
      });

      Then("useSortable is called with that id", (_ctx: TestContext) => {
        expect(mockUseSortable).toHaveBeenCalledWith({ id: SPECIFIC_ITEM_ID });
      });
    });

    // @swipeable-item @FR15
    f.Scenario("Opacity reduced while dragging", ({ Given, When, Then }) => {
      Given("useSortable returns isDragging true", (_ctx: TestContext) => {
        mockUseSortable.mockReturnValue({
          ...DEFAULT_SORTABLE_RETURN,
          isDragging: true,
        });
      });

      When(
        "SortableItem renders with a render-prop child",
        (_ctx: TestContext) => {
          renderWithCapture();
        },
      );

      Then("the wrapper has opacity 0.5", (_ctx: TestContext) => {
        const wrapper = getWrapper();
        expect(wrapper.style.opacity).toBe(String(SORTABLE_DRAGGING_OPACITY));
      });
    });
  },
);
