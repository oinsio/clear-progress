/**
 * Active tasks page — tasks grouped by time-box (today/week/later).
 * Implements FR2 of refactor-task-pages.
 */
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AddTaskInput } from "@/components/tasks/AddTaskInput";
import { BoxFilterBar } from "@/components/tasks/BoxFilterBar";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import { TaskSection } from "@/components/tasks/TaskSection";
import { BOX, BOX_FILTER_ALL } from "@/constants";
import { useActiveTaskHandlers } from "@/hooks/useActiveTaskHandlers";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTasks } from "@/hooks/useTasks";
import type { BoxFilter } from "@/types/common";

export default function ActiveTasksPage() {
  const { t } = useTranslation();
  const [activeBox, setActiveBox] = useState<BoxFilter>(BOX_FILTER_ALL);
  const [isAddingTask, setIsAddingTask] = useState(false);
  const { filterBarPosition } = useFilterBarPosition();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { completedTasks, reload: reloadCompleted } = useCompletedTasks();
  const today = useTasks(BOX.TODAY);
  const week = useTasks(BOX.WEEK);
  const later = useTasks(BOX.LATER);

  const selection = useTaskSelection({
    taskArrays: [today.tasks, week.tasks, later.tasks, completedTasks],
    isFocusMode,
  });

  const {
    handleMoveTask,
    handleUpdateTask,
    handleDuplicateTask,
    handleDeleteTask,
  } = useActiveTaskHandlers({
    today,
    week,
    later,
    selectedTask: selection.selectedTask,
    setSelectedTaskId: selection.setSelectedTaskId,
  });

  const completionOpts = {
    selectedTaskId: selection.selectedTaskId,
    expandedTaskId: selection.expandedTaskId,
    setSelectedTaskId: selection.setSelectedTaskId,
    setExpandedTaskId: selection.setExpandedTaskId,
  };
  const completeToday = useTaskCompletion({
    completeFn: today.completeTask,
    ...completionOpts,
    afterComplete: reloadCompleted,
  });
  const completeWeek = useTaskCompletion({
    completeFn: week.completeTask,
    ...completionOpts,
    afterComplete: reloadCompleted,
  });
  const completeLater = useTaskCompletion({
    completeFn: later.completeTask,
    ...completionOpts,
    afterComplete: reloadCompleted,
  });

  const handleBoxChange = useCallback((box: BoxFilter) => {
    setActiveBox(box);
    setIsAddingTask(false);
  }, []);
  const handleAddTask = useCallback(() => setIsAddingTask(true), []);
  const handleAddTaskCancel = useCallback(() => setIsAddingTask(false), []);
  const targetBox = activeBox === BOX_FILTER_ALL ? BOX.TODAY : activeBox;

  const handleAddTaskSubmit = useCallback(
    async (name: string) => {
      const createFns: Record<string, (n: string) => Promise<void>> = {
        [BOX.TODAY]: today.createTask,
        [BOX.WEEK]: week.createTask,
        [BOX.LATER]: later.createTask,
      };
      await createFns[targetBox](name);
      setIsAddingTask(false);
    },
    [targetBox, today, week, later],
  );

  const sharedProps = {
    goals,
    contexts,
    categories,
    onUpdate: handleUpdateTask,
    onMove: handleMoveTask,
    onSelect: selection.handleTaskSelect,
    selectedTaskId: selection.selectedTaskId,
    isFocusMode,
    focusDimmedOpacity: focusOpacity,
    expandedTaskId: selection.expandedTaskId,
    onExpand: selection.handleTaskExpand,
  };

  const todayCompleted = useMemo(
    () =>
      completedTasks.filter(
        (task) =>
          task.completed_at?.slice(0, 10) ===
          new Date().toISOString().slice(0, 10),
      ),
    [completedTasks],
  );

  const sections = [
    {
      key: "today",
      label: t("section.today"),
      data: today,
      onComplete: completeToday,
      emptyMessage: t("task.emptyToday"),
    },
    {
      key: "week",
      label: t("section.week"),
      data: week,
      onComplete: completeWeek,
      hideEmptyState: true,
    },
    {
      key: "later",
      label: t("section.later"),
      data: later,
      onComplete: completeLater,
      hideEmptyState: true,
    },
  ];

  const boxConfig: Record<
    string,
    { data: typeof today; onComplete: (id: string) => Promise<void> }
  > = {
    [BOX.TODAY]: { data: today, onComplete: completeToday },
    [BOX.WEEK]: { data: week, onComplete: completeWeek },
    [BOX.LATER]: { data: later, onComplete: completeLater },
  };

  const addTaskInput = isAddingTask && (
    <AddTaskInput
      targetBox={t(`box.${targetBox}`)}
      onAdd={handleAddTaskSubmit}
      onCancel={handleAddTaskCancel}
    />
  );

  const filterBar = (
    <BoxFilterBar
      activeBox={activeBox}
      onBoxChange={handleBoxChange}
      onAddTask={handleAddTask}
      position={filterBarPosition === "top" ? "top" : "bottom"}
    />
  );

  return (
    <div data-testid="active-tasks-page" className="flex flex-1 flex-col">
      <TaskPageLayout
        sidebarMode="tasks"
        selectedTask={selection.selectedTask}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onCloseDetailPanel={selection.handleDetailPanelClose}
        topToolbar={filterBarPosition === "top" ? filterBar : undefined}
        bottomToolbar={filterBarPosition === "bottom" ? filterBar : undefined}
      >
        {addTaskInput}
        {activeBox === BOX_FILTER_ALL ? (
          <>
            {sections.map((section) => (
              <TaskSection
                key={section.key}
                sectionKey={section.key}
                label={section.label}
                tasks={section.data.tasks.filter((task) => !task.is_completed)}
                onComplete={section.onComplete}
                onDelete={section.data.deleteTask}
                onReorder={section.data.reorderTasks}
                emptyMessage={section.emptyMessage}
                hideEmptyState={section.hideEmptyState}
                {...sharedProps}
              />
            ))}
            {todayCompleted.length > 0 && (
              <TaskSection
                key="completed_today"
                sectionKey="completed_today"
                label={t("section.completedToday")}
                tasks={todayCompleted}
                onComplete={completeToday}
                onDelete={today.deleteTask}
                {...sharedProps}
              />
            )}
          </>
        ) : (
          boxConfig[activeBox] && (
            <TaskList
              tasks={boxConfig[activeBox].data.tasks.filter(
                (task) => !task.is_completed,
              )}
              onComplete={boxConfig[activeBox].onComplete}
              onDelete={boxConfig[activeBox].data.deleteTask}
              onReorder={boxConfig[activeBox].data.reorderTasks}
              {...sharedProps}
            />
          )
        )}
      </TaskPageLayout>
    </div>
  );
}
