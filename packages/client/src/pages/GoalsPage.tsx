/**
 * GoalsPage — displays and manages goals.
 * Implements FR20 of command-bar.
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 */
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Target } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CommandBar } from "@/components/command-bar";
import { GoalItem } from "@/components/goals/GoalItem";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useGoals } from "@/hooks/useGoals";
import { generateKeyBetween } from "@/services/SortOrderService";
import { TaskService } from "@/services/TaskService";
import type { Goal } from "@/types/entities";

function SortableGoalItem({
  goal,
  taskCount,
  onNavigate,
}: {
  goal: Goal;
  taskCount: number;
  onNavigate: (id: string) => void;
}) {
  const { t } = useTranslation();
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: goal.id });

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t("goal.drag")}
      className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  return (
    <GoalItem
      goal={goal}
      taskCount={taskCount}
      onNavigate={onNavigate}
      nodeRef={setNodeRef}
      style={style}
      dragHandle={dragHandle}
    />
  );
}

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  new AttachmentRepository(),
);

export default function GoalsPage() {
  const { t } = useTranslation();
  const { goals, isLoading, createGoal, reorderGoals } = useGoals();
  const navigate = useNavigate();
  const sensors = useDndSensors();

  const [goalTaskCounts, setGoalTaskCounts] = useState<Record<string, number>>(
    {},
  );

  const activeGoals = goals.filter((goal) => !goal.is_deleted);

  useEffect(() => {
    void defaultTaskService.getGoalTaskCounts().then(setGoalTaskCounts);
  }, []);

  const handleGoalNavigate = useCallback(
    (id: string) => {
      navigate(`/goals/${id}`);
    },
    [navigate],
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = activeGoals.findIndex((goal) => goal.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted ASC: index 0 = lowest key, last index = highest key
      const lowerNeighbor =
        newIndex > 0 ? String(activeGoals[newIndex - 1].sort_order) : null;
      const upperNeighbor =
        newIndex < activeGoals.length - 1
          ? String(activeGoals[newIndex + 1].sort_order)
          : null;

      // When moving down, displaced item moves up, so neighbors shift
      const lowerKey =
        oldIndex < newIndex
          ? String(activeGoals[newIndex].sort_order)
          : lowerNeighbor;
      const upperKey =
        oldIndex > newIndex
          ? String(activeGoals[newIndex].sort_order)
          : upperNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderGoals(String(active.id), newSortOrder);
    },
    [activeGoals, reorderGoals],
  );

  const handleSubmit = useCallback(
    (name: string) => {
      void createGoal({ name });
    },
    [createGoal],
  );

  return (
    <SidebarShell mode="goals" data-testid="goals-page">
      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CommandBar
          entityIcon={Target}
          placeholder={t("commandBar.placeholder.goal")}
          onSubmit={handleSubmit}
        />

        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">
            {t("goal.pageName")}
          </h1>
        </header>

        {/* Scrollable goal list */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {!isLoading && activeGoals.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="empty-goals-message"
              >
                <p className="text-sm">{t("goal.empty")}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeGoals.map((goal) => goal.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {activeGoals.map((goal) => (
                      <SortableGoalItem
                        key={goal.id}
                        goal={goal}
                        taskCount={goalTaskCounts[goal.id] ?? 0}
                        onNavigate={handleGoalNavigate}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </div>
    </SidebarShell>
  );
}
