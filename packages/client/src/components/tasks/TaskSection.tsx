/**
 * Collapsible task section with header showing label and task count.
 * Uses useSectionCollapse for persistence of collapse state.
 *
 * Implements FR7 of refactor-task-pages.
 */
import { ChevronDown } from "lucide-react";
import { TaskList } from "@/components/tasks/TaskList";
import type { useCategories } from "@/hooks/useCategories";
import type { useContexts } from "@/hooks/useContexts";
import type { useGoals } from "@/hooks/useGoals";
import { useSectionCollapse } from "@/hooks/useSectionCollapse";
import type { Box } from "@/types/common";
import type { Task } from "@/types/entities";

export interface TaskSectionProps {
  sectionKey: string;
  label: string;
  tasks: Task[];
  goals: ReturnType<typeof useGoals>["goals"];
  contexts: ReturnType<typeof useContexts>["contexts"];
  categories: ReturnType<typeof useCategories>["categories"];
  onComplete: (id: string) => Promise<void>;
  onUpdate: (id: string, changes: Partial<Task>) => Promise<void>;
  onMove: (id: string, box: Box) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder?: (taskId: string, newSortOrder: string) => Promise<void>;
  emptyMessage?: string;
  hideEmptyState?: boolean;
  onEmptyClick?: () => void;
  onSelect?: (id: string) => void;
  selectedTaskId?: string | null;
  isFocusMode?: boolean;
  focusDimmedOpacity?: number;
  expandedTaskId?: string | null;
  onExpand?: (id: string | null) => void;
}

export function TaskSection({
  sectionKey,
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
  emptyMessage,
  hideEmptyState,
  onEmptyClick,
  onSelect,
  selectedTaskId,
  isFocusMode,
  focusDimmedOpacity,
  expandedTaskId,
  onExpand,
}: TaskSectionProps) {
  const { isCollapsed, toggleCollapse } = useSectionCollapse(sectionKey);

  const shouldShowTaskList =
    !isCollapsed && (!hideEmptyState || tasks.length > 0);

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
      {shouldShowTaskList && (
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
          emptyMessage={emptyMessage}
          onEmptyClick={onEmptyClick}
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
