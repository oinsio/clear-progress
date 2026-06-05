/**
 * Completed tasks page — tasks grouped by date (today/yesterday/week/month/earlier).
 * Implements FR3 of refactor-task-pages.
 */
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import { TaskSection } from "@/components/tasks/TaskSection";
import { BOX } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTaskHandlers } from "@/hooks/useCompletedTaskHandlers";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { getCachedDayBoundary } from "@/hooks/useSettings";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTasks } from "@/hooks/useTasks";
import { groupCompletedTasks } from "@/shared/lib/utils";

export default function CompletedPage() {
  const { t } = useTranslation();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const { completedTasks, reload: reloadCompleted } = useCompletedTasks();

  const inbox = useTasks(BOX.INBOX);
  const today = useTasks(BOX.TODAY);
  const week = useTasks(BOX.WEEK);
  const later = useTasks(BOX.LATER);

  const {
    selectedTaskId,
    expandedTaskId,
    selectedTask,
    setSelectedTaskId,
    setExpandedTaskId,
    handleTaskSelect,
    handleTaskExpand,
    handleDetailPanelClose,
  } = useTaskSelection({ taskArrays: [completedTasks] });

  const handleComplete = useTaskCompletion({
    completeFn: today.completeTask,
    selectedTaskId,
    expandedTaskId,
    setSelectedTaskId,
    setExpandedTaskId,
    afterComplete: reloadCompleted,
  });

  const {
    handleUpdateTask,
    handleMoveTask,
    handleDeleteTask,
    handleDuplicateTask,
  } = useCompletedTaskHandlers({
    completedTasks,
    inbox,
    today,
    week,
    later,
    selectedTask,
    setSelectedTaskId,
  });

  const {
    todayTasks: todayCompletedTasks,
    yesterdayTasks: yesterdayCompletedTasks,
    weekTasks: weekCompletedTasks,
    monthTasks: monthCompletedTasks,
    earlierTasks: earlierCompletedTasks,
  } = useMemo(
    () =>
      groupCompletedTasks(completedTasks, undefined, getCachedDayBoundary()),
    [completedTasks],
  );

  const sharedSelectProps = {
    onSelect: handleTaskSelect,
    selectedTaskId,
    isFocusMode,
    focusDimmedOpacity: focusOpacity,
    expandedTaskId,
    onExpand: handleTaskExpand,
  };

  const sharedSectionProps = {
    goals,
    contexts,
    categories,
    onComplete: handleComplete,
    onUpdate: handleUpdateTask,
    onMove: handleMoveTask,
    onDelete: today.deleteTask,
    hideEmptyState: true as const,
    ...sharedSelectProps,
  };

  const hasCompletedTasks = completedTasks.length > 0;

  return (
    <div
      data-testid="completed-page"
      className="flex flex-1 flex-col overflow-hidden"
    >
      <TaskPageLayout
        sidebarMode="completed"
        selectedTask={selectedTask}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onUpdateTask={handleUpdateTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onCloseDetailPanel={handleDetailPanelClose}
      >
        {hasCompletedTasks ? (
          <>
            {todayCompletedTasks.length > 0 && (
              <TaskSection
                key="completed_today"
                sectionKey="completed_today"
                label={t("section.today")}
                tasks={todayCompletedTasks}
                {...sharedSectionProps}
              />
            )}
            {yesterdayCompletedTasks.length > 0 && (
              <TaskSection
                key="completed_yesterday"
                sectionKey="completed_yesterday"
                label={t("section.completedYesterday")}
                tasks={yesterdayCompletedTasks}
                {...sharedSectionProps}
              />
            )}
            {weekCompletedTasks.length > 0 && (
              <TaskSection
                key="completed_week"
                sectionKey="completed_week"
                label={t("section.completedWeek")}
                tasks={weekCompletedTasks}
                {...sharedSectionProps}
              />
            )}
            {monthCompletedTasks.length > 0 && (
              <TaskSection
                key="completed_month"
                sectionKey="completed_month"
                label={t("section.completedMonth")}
                tasks={monthCompletedTasks}
                {...sharedSectionProps}
              />
            )}
            {earlierCompletedTasks.length > 0 && (
              <TaskSection
                key="completed_earlier"
                sectionKey="completed_earlier"
                label={t("section.completedEarlier")}
                tasks={earlierCompletedTasks}
                {...sharedSectionProps}
              />
            )}
          </>
        ) : (
          <TaskList
            tasks={[]}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onComplete={handleComplete}
            onUpdate={handleUpdateTask}
            onMove={handleMoveTask}
            onDelete={today.deleteTask}
            emptyMessage={t("task.emptyCompleted")}
            {...sharedSelectProps}
          />
        )}
      </TaskPageLayout>
    </div>
  );
}
