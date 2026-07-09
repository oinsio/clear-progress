/**
 * GoalsPage — displays and manages goals.
 * Implements FR20 of command-bar.
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 * Implements FR3, FR4, FR5, FR10 of goals-filter.
 */
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Check, GripVertical, Pause, Play, Target } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import type { CommandBarFilterItem } from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";
import { GoalItem } from "@/components/goals/GoalItem";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { AllBoxesIcon } from "@/components/tasks/BoxIcons";
import {
  GOAL_FILTER_EMPTY_MESSAGE_KEYS,
  GOAL_FILTER_ORDER,
  GOAL_FILTER_STATUS_MAP,
} from "@/constants";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useGoalFilter } from "@/hooks/useGoalFilter";
import { useGoals } from "@/hooks/useGoals";
import { generateKeyBetween } from "@/services/SortOrderService";
import { TaskService } from "@/services/TaskService";
import type { GoalFilter } from "@/types/common";
import type { Goal } from "@/types/entities";

const GOAL_FILTER_ICONS: Record<
  GoalFilter,
  React.ComponentType<{ className?: string }>
> = {
  active: Play,
  paused: Pause,
  finished: Check,
  all: AllBoxesIcon,
};

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
  const { goalFilter, setGoalFilter } = useGoalFilter();
  const navigate = useNavigate();
  const sensors = useDndSensors();

  const [goalTaskCounts, setGoalTaskCounts] = useState<Record<string, number>>(
    {},
  );

  const goalFilterItems: CommandBarFilterItem[] = GOAL_FILTER_ORDER.map(
    (filter) => ({
      value: filter,
      icon: GOAL_FILTER_ICONS[filter],
      label: t(`goalFilter.${filter}`),
    }),
  );

  const activeGoals = goals.filter((goal) => !goal.is_deleted);
  const filteredGoals = activeGoals.filter((goal) =>
    GOAL_FILTER_STATUS_MAP[goalFilter].includes(goal.status),
  );
  const emptyMessageKey = GOAL_FILTER_EMPTY_MESSAGE_KEYS[goalFilter];

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
      const oldIndex = filteredGoals.findIndex((goal) => goal.id === active.id);
      const newIndex = filteredGoals.findIndex((goal) => goal.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted DESC: index 0 = highest key, last index = lowest key
      // upper = higher key (lower index), lower = lower key (higher index)
      const upperNeighbor =
        newIndex > 0 ? String(filteredGoals[newIndex - 1].sort_order) : null;
      const lowerNeighbor =
        newIndex < filteredGoals.length - 1
          ? String(filteredGoals[newIndex + 1].sort_order)
          : null;

      // If moving down, the displaced item moves up, so neighbors shift
      const upperKey =
        oldIndex < newIndex
          ? String(filteredGoals[newIndex].sort_order)
          : upperNeighbor;
      const lowerKey =
        oldIndex > newIndex
          ? String(filteredGoals[newIndex].sort_order)
          : lowerNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderGoals(String(active.id), newSortOrder);
    },
    [filteredGoals, reorderGoals],
  );

  const handleGoalFilterChange = useCallback(
    (value: string) => {
      setGoalFilter(value as GoalFilter);
    },
    [setGoalFilter],
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
          filter={{
            items: goalFilterItems,
            activeValue: goalFilter,
            onChange: handleGoalFilterChange,
          }}
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
            {!isLoading && filteredGoals.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="empty-goals-message"
              >
                <p className="text-sm">{t(emptyMessageKey)}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredGoals.map((goal) => goal.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {filteredGoals.map((goal) => (
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
