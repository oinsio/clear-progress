import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDndSensors } from "@/hooks/useDndSensors";
import { generateKeyBetween } from "@/services/SortOrderService";
import type { Box } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { TaskItem } from "./TaskItem";

interface SortableTaskItemProps {
  task: Task;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
  expandedTaskId?: string | null;
  onExpand?: (id: string | null) => void;
  isFocusDimmed?: boolean;
  focusDimmedOpacity?: number;
}

function SortableTaskItem({
  task,
  goals,
  contexts,
  categories,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
  onSelect,
  selectedTaskId,
  expandedTaskId,
  onExpand,
  isFocusDimmed = false,
  focusDimmedOpacity,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <TaskItem
        task={task}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onComplete={onComplete}
        onUpdate={onUpdate}
        onMove={onMove}
        onDelete={onDelete}
        dragHandleProps={{
          ref: setActivatorNodeRef,
          attributes,
          listeners,
        }}
        onSelect={onSelect}
        isSelected={selectedTaskId === task.id}
        isExpanded={expandedTaskId === task.id}
        onExpand={onExpand}
        isFocusDimmed={isFocusDimmed}
        focusDimmedOpacity={focusDimmedOpacity}
      />
    </li>
  );
}

interface TaskListProps {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder?: (taskId: string, newSortOrder: string) => Promise<void>;
  emptyMessage?: string;
  onEmptyClick?: () => void;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
  isFocusMode?: boolean;
  focusDimmedOpacity?: number;
  expandedTaskId?: string | null;
  onExpand?: (id: string | null) => void;
}

export function TaskList({
  tasks,
  goals,
  contexts,
  categories,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
  onReorder,
  emptyMessage,
  onEmptyClick,
  onSelect,
  selectedTaskId,
  isFocusMode = false,
  focusDimmedOpacity,
  expandedTaskId: controlledExpandedTaskId,
  onExpand: controlledOnExpand,
}: TaskListProps) {
  const { t } = useTranslation();
  const [localExpandedTaskId, setLocalExpandedTaskId] = useState<string | null>(
    null,
  );

  const isControlled = controlledExpandedTaskId !== undefined;
  const expandedTaskId = isControlled
    ? controlledExpandedTaskId
    : localExpandedTaskId;
  const setExpandedTaskId = controlledOnExpand ?? setLocalExpandedTaskId;

  // Reset expandedTaskId when the expanded task is no longer in the list
  // (e.g., after completing a task in focus mode)
  useEffect(() => {
    if (isControlled) return;
    if (expandedTaskId && !tasks.some((task) => task.id === expandedTaskId)) {
      setExpandedTaskId(null);
    }
  }, [isControlled, expandedTaskId, tasks, setExpandedTaskId]);

  const hasFocusedTask =
    isFocusMode && (selectedTaskId != null || expandedTaskId != null);

  const sensors = useDndSensors();

  if (tasks.length === 0) {
    if (onEmptyClick) {
      return (
        <button
          type="button"
          data-testid="task-list-empty"
          onClick={onEmptyClick}
          className={`w-full flex flex-col items-center justify-center text-gray-400 hover:text-accent transition-colors ${emptyMessage ? "py-3" : "py-16"}`}
        >
          <p className="text-sm">{emptyMessage ?? t("task.empty")}</p>
        </button>
      );
    }
    return (
      <div
        data-testid="task-list-empty"
        className={`flex flex-col items-center justify-center text-gray-400 ${emptyMessage ? "py-3" : "py-16"}`}
      >
        <p className="text-sm">{emptyMessage ?? t("task.empty")}</p>
      </div>
    );
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id || !onReorder) return;
    const oldIndex = tasks.findIndex((task) => task.id === active.id);
    const newIndex = tasks.findIndex((task) => task.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    // List is sorted DESC: index 0 = highest key, last index = lowest key
    // upper = higher key (lower index), lower = lower key (higher index)
    const upperNeighbor =
      newIndex > 0 ? String(tasks[newIndex - 1].sort_order) : null;
    const lowerNeighbor =
      newIndex < tasks.length - 1
        ? String(tasks[newIndex + 1].sort_order)
        : null;

    // If moving down, the displaced item moves up, so neighbors shift
    const upperKey =
      oldIndex < newIndex ? String(tasks[newIndex].sort_order) : upperNeighbor;
    const lowerKey =
      oldIndex > newIndex ? String(tasks[newIndex].sort_order) : lowerNeighbor;

    const newSortOrder = generateKeyBetween(lowerKey, upperKey);
    void onReorder(String(active.id), newSortOrder);
  };

  if (!onReorder) {
    return (
      <ul data-testid="task-list">
        {tasks.map((task) => (
          <li key={task.id}>
            <TaskItem
              task={task}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
              onSelect={onSelect}
              isSelected={selectedTaskId === task.id}
              isExpanded={expandedTaskId === task.id}
              onExpand={setExpandedTaskId}
              isFocusDimmed={
                hasFocusedTask &&
                selectedTaskId !== task.id &&
                expandedTaskId !== task.id
              }
              focusDimmedOpacity={focusDimmedOpacity}
            />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={tasks.map((task) => task.id)}
        strategy={verticalListSortingStrategy}
      >
        <ul data-testid="task-list">
          {tasks.map((task) => (
            <SortableTaskItem
              key={task.id}
              task={task}
              goals={goals}
              contexts={contexts}
              categories={categories}
              onComplete={onComplete}
              onUpdate={onUpdate}
              onMove={onMove}
              onDelete={onDelete}
              onSelect={onSelect}
              selectedTaskId={selectedTaskId}
              expandedTaskId={expandedTaskId}
              onExpand={setExpandedTaskId}
              isFocusDimmed={
                hasFocusedTask &&
                selectedTaskId !== task.id &&
                expandedTaskId !== task.id
              }
              focusDimmedOpacity={focusDimmedOpacity}
            />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
