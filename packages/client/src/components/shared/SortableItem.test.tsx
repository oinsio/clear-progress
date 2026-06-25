// implements FR15, FR16 of swipeable-item
import { cleanup, render, screen } from "@testing-library/react/pure";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const SORTABLE_REST_OPACITY = 1;
const SORTABLE_DRAGGING_OPACITY = 0.5;
const VERTICAL_OFFSET_PX = 120;
const TEST_ITEM_ID = "test-item-42";

const { mockUseSortable } = vi.hoisted(() => ({
  mockUseSortable: vi.fn(),
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: mockUseSortable,
}));

import type { DragHandleProps } from "@/components/shared/SortableItem";
import { SortableItem } from "@/components/shared/SortableItem";

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

function renderSortableItem(id = TEST_ITEM_ID) {
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

function getWrapper() {
  const childElement = screen.getByTestId("child");
  const wrapper = childElement.parentElement;
  if (!wrapper) throw new Error("Wrapper element not found");
  return wrapper;
}

describe("SortableItem", () => {
  beforeEach(() => {
    capturedIsDragging = undefined;
    capturedDragHandleProps = undefined;
    mockUseSortable.mockReturnValue({ ...DEFAULT_SORTABLE_RETURN });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("should pass id to useSortable", () => {
    renderSortableItem(TEST_ITEM_ID);
    expect(mockUseSortable).toHaveBeenCalledWith({ id: TEST_ITEM_ID });
  });

  it("should pass isDragging false to children at rest", () => {
    renderSortableItem();
    expect(capturedIsDragging).toBe(false);
  });

  it("should pass isDragging true to children during drag", () => {
    mockUseSortable.mockReturnValue({
      ...DEFAULT_SORTABLE_RETURN,
      isDragging: true,
    });
    renderSortableItem();
    expect(capturedIsDragging).toBe(true);
  });

  it("should pass dragHandleProps with ref, attributes, and listeners", () => {
    renderSortableItem();
    expect(capturedDragHandleProps).toBeDefined();
    expect(capturedDragHandleProps?.ref).toBe(
      DEFAULT_SORTABLE_RETURN.setActivatorNodeRef,
    );
    expect(capturedDragHandleProps?.attributes).toBe(
      DEFAULT_SORTABLE_RETURN.attributes,
    );
    expect(capturedDragHandleProps?.listeners).toBe(
      DEFAULT_SORTABLE_RETURN.listeners,
    );
  });

  it("should apply translate3d with vertical offset when transform exists", () => {
    mockUseSortable.mockReturnValue({
      ...DEFAULT_SORTABLE_RETURN,
      transform: { x: 0, y: VERTICAL_OFFSET_PX, scaleX: 1, scaleY: 1 },
      transition: "transform 200ms ease",
    });
    renderSortableItem();
    const wrapper = getWrapper();
    expect(wrapper.style.transform).toBe(
      `translate3d(0, ${VERTICAL_OFFSET_PX}px, 0)`,
    );
  });

  it("should have no transform at rest", () => {
    renderSortableItem();
    const wrapper = getWrapper();
    expect(wrapper.style.transform).toBe("");
  });

  it("should have full opacity at rest", () => {
    renderSortableItem();
    const wrapper = getWrapper();
    expect(wrapper.style.opacity).toBe(String(SORTABLE_REST_OPACITY));
  });

  it("should have reduced opacity while dragging", () => {
    mockUseSortable.mockReturnValue({
      ...DEFAULT_SORTABLE_RETURN,
      isDragging: true,
    });
    renderSortableItem();
    const wrapper = getWrapper();
    expect(wrapper.style.opacity).toBe(String(SORTABLE_DRAGGING_OPACITY));
  });
});
