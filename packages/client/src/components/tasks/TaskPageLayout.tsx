/**
 * Implements FR6 of refactor-task-pages.
 *
 * Shared layout component providing split-pane + Sidebar + TaskDetailPanel
 * for all task pages.
 */
import type * as React from "react";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { cn } from "@/shared/lib/cn";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { Sidebar, type SidebarMode } from "./Sidebar";
import { TaskDetailPanel } from "./TaskDetailPanel";

export interface TaskPageLayoutProps {
  children: React.ReactNode;
  sidebarMode: SidebarMode;
  selectedTask: Task | null;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onUpdateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (id: string) => Promise<void>;
  onCloseDetailPanel: () => void;
  onModeChange?: (newMode: SidebarMode) => void;
  topToolbar?: React.ReactNode;
  bottomToolbar?: React.ReactNode;
}

export function TaskPageLayout({
  children,
  sidebarMode,
  selectedTask,
  goals,
  contexts,
  categories,
  onUpdateTask,
  onDeleteTask,
  onDuplicateTask,
  onCloseDetailPanel,
  onModeChange: externalModeChange,
  topToolbar,
  bottomToolbar,
}: TaskPageLayoutProps) {
  const { ratio, containerRef, handleResizeMouseDown } = usePanelSplit();
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const isDesktop = useIsDesktop();
  const defaultModeChange = useSidebarNavigation();
  const handleModeChange = externalModeChange ?? defaultModeChange;

  const isTaskSelected = selectedTask !== null;
  const showResizeHandle = isDesktop && isTaskSelected;
  const hideMainOnMobile = !isDesktop && isTaskSelected;

  const mainColumnStyle: React.CSSProperties =
    isDesktop && isTaskSelected
      ? { width: `${ratio * 100}%`, flexShrink: 0 }
      : { flex: "1 1 0" };

  const detailPanelStyle: React.CSSProperties = isDesktop
    ? { width: `${(1 - ratio) * 100}%`, flexShrink: 0 }
    : { flex: "1 1 0" };

  return (
    <div
      data-testid="task-page-layout"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      <div ref={containerRef} className="flex flex-1 overflow-hidden">
        <div
          data-testid="main-column"
          className={cn(
            "flex flex-col overflow-hidden",
            hideMainOnMobile && "hidden",
          )}
          style={mainColumnStyle}
        >
          {topToolbar}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:mx-auto xl:max-w-3xl">{children}</div>
          </main>
          {bottomToolbar}
        </div>

        {showResizeHandle && (
          <div
            data-testid="resize-handle"
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 transition-colors hover:bg-accent/30 active:bg-accent/50"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {isTaskSelected && (
          <TaskDetailPanel
            task={selectedTask}
            goals={goals}
            contexts={contexts}
            categories={categories}
            onUpdate={onUpdateTask}
            onDelete={onDeleteTask}
            onDuplicate={onDuplicateTask}
            onClose={onCloseDetailPanel}
            style={detailPanelStyle}
          />
        )}
      </div>

      <Sidebar
        mode={sidebarMode}
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
