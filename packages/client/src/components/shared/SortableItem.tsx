// implements FR15, FR16 of swipeable-item
import type {
  DraggableAttributes,
  DraggableSyntheticListeners,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import type React from "react";

const SORTABLE_REST_OPACITY = 1;
const SORTABLE_DRAGGING_OPACITY = 0.5;

/** Implements FR15, FR16 of swipeable-item */
export interface DragHandleProps {
  ref: (node: HTMLElement | null) => void;
  attributes: DraggableAttributes;
  listeners: DraggableSyntheticListeners;
}

/** Implements FR15, FR16 of swipeable-item */
interface SortableItemProps {
  id: string;
  children: (props: {
    isDragging: boolean;
    dragHandleProps: DragHandleProps;
  }) => React.ReactNode;
}

/** Implements FR15, FR16 of swipeable-item */
export function SortableItem({ id, children }: SortableItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? SORTABLE_DRAGGING_OPACITY : SORTABLE_REST_OPACITY,
  };

  const dragHandleProps: DragHandleProps = {
    ref: setActivatorNodeRef,
    attributes,
    listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      {children({ isDragging, dragHandleProps })}
    </div>
  );
}
