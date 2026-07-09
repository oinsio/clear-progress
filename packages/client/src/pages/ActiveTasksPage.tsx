/**
 * Active tasks page — tasks grouped by time-box (today/week/later).
 * Implements FR2 of refactor-task-pages.
 * Implements FR20 of command-bar.
 */
import { CheckSquare, Inbox } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { CommandBarFilterItem } from "@/components/command-bar";
import { CommandBar } from "@/components/command-bar";
import {
  AllBoxesIcon,
  LaterBoxIcon,
  TodayBoxIcon,
  WeekBoxIcon,
} from "@/components/tasks/BoxIcons";
import { TaskList } from "@/components/tasks/TaskList";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import { TaskSection } from "@/components/tasks/TaskSection";
import {
  BOX,
  BOX_FILTER_ALL,
  BOX_FILTER_I18N_KEYS,
  TASK_BOX_FILTER_ORDER,
} from "@/constants";
import { useActiveTaskHandlers } from "@/hooks/useActiveTaskHandlers";
import { useCategories } from "@/hooks/useCategories";
import { useCompletedTasks } from "@/hooks/useCompletedTasks";
import { useContexts } from "@/hooks/useContexts";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { getCachedDayBoundary } from "@/hooks/useSettings";
import { useShowHidden } from "@/hooks/useShowHidden";
import { useTargetBox } from "@/hooks/useTargetBox";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTasks } from "@/hooks/useTasks";
import { systemClock } from "@/lib/temporal";
import type { BoxFilter } from "@/types/common";
import { getLogicalDate } from "@/utils/getLogicalDate";

const BOX_FILTER_ICONS: Record<BoxFilter, CommandBarFilterItem["icon"]> = {
  today: TodayBoxIcon,
  week: WeekBoxIcon,
  later: LaterBoxIcon,
  all: AllBoxesIcon,
  inbox: Inbox,
};

export default function ActiveTasksPage() {
  const { t } = useTranslation();
  const [activeBox, setActiveBox] = useState<BoxFilter>(BOX_FILTER_ALL);
  const { isFocusMode, focusOpacity } = useFocusMode();
  const { showHidden, toggleShowHidden } = useShowHidden();
  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { completedTasks, reload: reloadCompleted } = useCompletedTasks();
  const today = useTasks(BOX.TODAY);
  const week = useTasks(BOX.WEEK);
  const later = useTasks(BOX.LATER);
  const targetBox = useTargetBox(activeBox);

  const selection = useTaskSelection({
    taskArrays: [today.tasks, week.tasks, later.tasks, completedTasks],
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

  const handleBoxChange = useCallback((value: string) => {
    setActiveBox(value as BoxFilter);
  }, []);

  const boxFilterItems: CommandBarFilterItem[] = TASK_BOX_FILTER_ORDER.map(
    (box) => ({
      value: box,
      icon: BOX_FILTER_ICONS[box],
      label: t(BOX_FILTER_I18N_KEYS[box]),
    }),
  );

  const effectiveBox = targetBox === BOX.INBOX ? BOX.TODAY : targetBox;

  const handleSubmit = useCallback(
    async (name: string) => {
      const createFns: Record<string, (n: string) => Promise<void>> = {
        [BOX.TODAY]: today.createTask,
        [BOX.WEEK]: week.createTask,
        [BOX.LATER]: later.createTask,
      };
      await createFns[effectiveBox](name);
    },
    [effectiveBox, today, week, later],
  );

  const placeholder = t(`commandBar.placeholder.${effectiveBox}`);

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

  const todayCompleted = useMemo(() => {
    const logicalToday = getLogicalDate(systemClock, getCachedDayBoundary());
    return completedTasks.filter(
      (task) => task.completed_at?.slice(0, 10) === logicalToday,
    );
  }, [completedTasks]);

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

  return (
    <div
      data-testid="active-tasks-page"
      className="flex flex-1 flex-col overflow-hidden"
    >
      <TaskPageLayout
        commandBar={
          <CommandBar
            filter={{
              items: boxFilterItems,
              activeValue: activeBox,
              onChange: handleBoxChange,
            }}
            eyeToggle={{
              isVisible: showHidden,
              onToggle: toggleShowHidden,
            }}
            entityIcon={CheckSquare}
            placeholder={placeholder}
            onSubmit={(name) => void handleSubmit(name)}
          />
        }
        sidebarMode="tasks"
        selectedTask={selection.selectedTask}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onUpdateTask={handleUpdateTask}
        onMoveTask={handleMoveTask}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onCloseDetailPanel={selection.handleDetailPanelClose}
      >
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
