import { ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { TaskList } from "@/components/tasks/TaskList";
import { BOX, BOX_FILTER_I18N_KEYS } from "@/constants";
import { useSectionCollapse } from "@/hooks/useSectionCollapse";
import type { Box } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";

const BOX_SECTION_ORDER: Box[] = [BOX.INBOX, BOX.TODAY, BOX.WEEK, BOX.LATER];

const BOX_SECTION_I18N_KEYS: Record<Box, string> = {
  [BOX.INBOX]: BOX_FILTER_I18N_KEYS.inbox,
  [BOX.TODAY]: BOX_FILTER_I18N_KEYS.today,
  [BOX.WEEK]: BOX_FILTER_I18N_KEYS.week,
  [BOX.LATER]: BOX_FILTER_I18N_KEYS.later,
};

const BOX_SECTION_KEYS: Record<Box, string> = {
  [BOX.INBOX]: "inbox",
  [BOX.TODAY]: "today",
  [BOX.WEEK]: "week",
  [BOX.LATER]: "later",
};

interface BoxSectionProps {
  box: Box;
  label: string;
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder?: (taskId: string, newSortOrder: string) => Promise<void>;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
  isFocusMode?: boolean;
  focusDimmedOpacity?: number;
  expandedTaskId?: string | null;
  onExpand?: (id: string | null) => void;
}

function BoxSection({
  box,
  label,
  tasks,
  goals,
  contexts,
  categories,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
  onReorder,
  onSelect,
  selectedTaskId,
  isFocusMode,
  focusDimmedOpacity,
  expandedTaskId,
  onExpand,
}: BoxSectionProps) {
  const { isCollapsed, toggleCollapse } = useSectionCollapse(
    BOX_SECTION_KEYS[box],
  );
  return (
    <section>
      <button
        type="button"
        onClick={toggleCollapse}
        className="w-full flex items-center justify-between px-4 py-2 text-sm font-semibold text-accent bg-white border-b border-gray-100 sticky top-0 z-10"
      >
        <span>
          {label} ({tasks.length})
        </span>
        <ChevronDown
          className={`w-4 h-4 transition-transform duration-200 ${isCollapsed ? "-rotate-90" : ""}`}
        />
      </button>
      {!isCollapsed && (
        <TaskList
          tasks={tasks}
          goals={goals}
          contexts={contexts}
          categories={categories}
          onComplete={onComplete}
          onUpdate={onUpdate}
          onMove={onMove}
          onDelete={onDelete}
          onReorder={onReorder}
          onSelect={onSelect}
          selectedTaskId={selectedTaskId}
          isFocusMode={isFocusMode}
          focusDimmedOpacity={focusDimmedOpacity}
          expandedTaskId={expandedTaskId}
          onExpand={onExpand}
        />
      )}
    </section>
  );
}

interface BoxSectionListProps {
  isLoading: boolean;
  tasksByBox: Record<Box, Task[]>;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onAddPromptClick?: () => void;
  onComplete: (id: string) => void;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => void;
  onReorder?: (box: Box, taskId: string, newSortOrder: string) => Promise<void>;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
  isFocusMode?: boolean;
  focusDimmedOpacity?: number;
  expandedTaskId?: string | null;
  onExpand?: (id: string | null) => void;
}

export function BoxSectionList({
  isLoading,
  tasksByBox,
  goals,
  contexts,
  categories,
  onAddPromptClick,
  onComplete,
  onUpdate,
  onMove,
  onDelete,
  onReorder,
  onSelect,
  selectedTaskId,
  isFocusMode,
  focusDimmedOpacity,
  expandedTaskId,
  onExpand,
}: BoxSectionListProps) {
  const { t } = useTranslation();
  const hasAnyTasks = BOX_SECTION_ORDER.some(
    (box) => tasksByBox[box].length > 0,
  );

  if (!isLoading && !hasAnyTasks) {
    return (
      <p
        data-testid="no-tasks-add-prompt"
        onClick={onAddPromptClick}
        className="w-full text-left px-4 py-3 text-sm text-gray-400"
      >
        {t("task.noTasksPrompt")}
      </p>
    );
  }

  return (
    <>
      {BOX_SECTION_ORDER.map((box) => {
        const boxTasks = tasksByBox[box];
        if (boxTasks.length === 0) return null;
        return (
          <BoxSection
            key={box}
            box={box}
            label={t(BOX_SECTION_I18N_KEYS[box])}
            tasks={boxTasks}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onComplete={onComplete}
            onUpdate={onUpdate}
            onMove={onMove}
            onDelete={onDelete}
            onReorder={
              onReorder
                ? (taskId, newSortOrder) => onReorder(box, taskId, newSortOrder)
                : undefined
            }
            onSelect={onSelect}
            selectedTaskId={selectedTaskId}
            isFocusMode={isFocusMode}
            focusDimmedOpacity={focusDimmedOpacity}
            expandedTaskId={expandedTaskId}
            onExpand={onExpand}
          />
        );
      })}
    </>
  );
}
