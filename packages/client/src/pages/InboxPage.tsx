/**
 * InboxPage — displays and manages tasks in the inbox box.
 * Implements FR1 of refactor-task-pages.
 * Implements FR20 of command-bar.
 */
import { CheckSquare } from "lucide-react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { CommandBar } from "@/components/command-bar";
import { TaskPageLayout } from "@/components/tasks/TaskPageLayout";
import { TaskSection } from "@/components/tasks/TaskSection";
import { BOX } from "@/constants";
import { useCategories } from "@/hooks/useCategories";
import { useContexts } from "@/hooks/useContexts";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useGoals } from "@/hooks/useGoals";
import { useShowHidden } from "@/hooks/useShowHidden";
import { useTaskCompletion } from "@/hooks/useTaskCompletion";
import { useTaskSelection } from "@/hooks/useTaskSelection";
import { useTasks } from "@/hooks/useTasks";
import type { Task } from "@/types/entities";

export default function InboxPage() {
  const { t } = useTranslation();

  const {
    tasks: inboxTasks,
    completeTask: completeInbox,
    deleteTask: deleteInbox,
    createTask: createInboxTask,
    updateTask: updateInbox,
    moveTask: moveInbox,
    reorderTasks: reorderInbox,
    duplicateTask: duplicateInbox,
  } = useTasks(BOX.INBOX);

  const { goals } = useGoals();
  const { contexts } = useContexts();
  const { categories } = useCategories();
  const { isFocusMode, focusOpacity } = useFocusMode();
  const { showHidden, toggleShowHidden } = useShowHidden();

  const {
    selectedTaskId,
    expandedTaskId,
    selectedTask,
    setSelectedTaskId,
    setExpandedTaskId,
    handleTaskSelect,
    handleTaskExpand,
    handleDetailPanelClose,
  } = useTaskSelection({
    taskArrays: [inboxTasks],
  });

  const handleCompleteInbox = useTaskCompletion({
    completeFn: completeInbox,
    selectedTaskId,
    expandedTaskId,
    setSelectedTaskId,
    setExpandedTaskId,
  });

  const handleUpdateTask = useCallback(
    async (id: string, changes: Partial<Task>) => {
      if (changes.box && changes.box !== BOX.INBOX) {
        await moveInbox(id, changes.box);
      } else {
        await updateInbox(id, changes);
      }
    },
    [moveInbox, updateInbox],
  );

  const handleDuplicateTask = useCallback(
    async (id: string) => {
      const newTask = await duplicateInbox(id);
      setSelectedTaskId(newTask.id);
    },
    [duplicateInbox, setSelectedTaskId],
  );

  const handleDeleteTask = useCallback(
    (id: string) => {
      setSelectedTaskId(null);
      void deleteInbox(id);
    },
    [deleteInbox, setSelectedTaskId],
  );

  const handleSubmit = useCallback(
    async (name: string) => {
      await createInboxTask(name);
    },
    [createInboxTask],
  );

  const activeTasks = inboxTasks.filter((task) => !task.is_completed);

  return (
    <div
      data-testid="inbox-page"
      className="flex flex-1 flex-col overflow-hidden"
    >
      <TaskPageLayout
        commandBar={
          <CommandBar
            eyeToggle={{
              isVisible: showHidden,
              onToggle: toggleShowHidden,
            }}
            entityIcon={CheckSquare}
            placeholder={t("commandBar.placeholder.inbox")}
            onSubmit={(name) => void handleSubmit(name)}
          />
        }
        sidebarMode="inbox"
        selectedTask={selectedTask}
        goals={goals}
        contexts={contexts}
        categories={categories}
        onUpdateTask={handleUpdateTask}
        onMoveTask={moveInbox}
        onDeleteTask={handleDeleteTask}
        onDuplicateTask={handleDuplicateTask}
        onCloseDetailPanel={handleDetailPanelClose}
      >
        <TaskSection
          key="inbox"
          sectionKey="inbox"
          label={t("section.inbox")}
          tasks={activeTasks}
          goals={goals}
          contexts={contexts}
          categories={categories}
          onComplete={handleCompleteInbox}
          onUpdate={handleUpdateTask}
          onMove={moveInbox}
          onDelete={deleteInbox}
          onReorder={reorderInbox}
          emptyMessage={t("task.emptyInbox")}
          onSelect={handleTaskSelect}
          selectedTaskId={selectedTaskId}
          isFocusMode={isFocusMode}
          focusDimmedOpacity={focusOpacity}
          expandedTaskId={expandedTaskId}
          onExpand={handleTaskExpand}
        />
      </TaskPageLayout>
    </div>
  );
}
