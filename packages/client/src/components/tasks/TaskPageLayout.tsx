/**
 * Implements FR6 of refactor-task-pages.
 * Implements FR8, FR14-FR17 of improve-sidebar-ux.
 *
 * Shared layout component providing split-pane + Sidebar + TaskDetailPanel
 * for all task pages. Manages drawer state for mobile (narrow, no hover).
 */

import { Pin } from "lucide-react";
import type * as React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDetailPanelPinned } from "@/hooks/useDetailPanelPinned";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSidebarHover } from "@/hooks/useSidebarHover";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useSidebarState } from "@/hooks/useSidebarState";
import { useSidebarSwipe } from "@/hooks/useSidebarSwipe";
import { cn } from "@/shared/lib/cn";
import type { Box } from "@/types/common";
import type { Category, Context, Goal, Task } from "@/types/entities";
import { Sidebar, type SidebarMode } from "./Sidebar";
import { TaskDetailPanel } from "./TaskDetailPanel";

export interface TaskPageLayoutProps {
  children: React.ReactNode;
  commandBar?: React.ReactNode;
  sidebarMode: SidebarMode;
  selectedTask: Task | null;
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  onUpdateTask: (id: string, changes: Partial<Task>) => Promise<void>;
  onMoveTask: (id: string, box: Box) => Promise<void>;
  onDeleteTask: (id: string) => void;
  onDuplicateTask: (id: string) => Promise<void>;
  onCloseDetailPanel: () => void;
  onModeChange?: (newMode: SidebarMode) => void;
}

/** Implements FR8, FR14-FR17 of improve-sidebar-ux */
export function TaskPageLayout({
  children,
  commandBar,
  sidebarMode,
  selectedTask,
  goals,
  contexts,
  categories,
  onUpdateTask,
  onMoveTask,
  onDeleteTask,
  onDuplicateTask,
  onCloseDetailPanel,
  onModeChange: externalModeChange,
}: TaskPageLayoutProps) {
  const { ratio, containerRef, handleResizeMouseDown } = usePanelSplit();
  const { panelSide } = usePanelSide();
  const {
    effectiveState,
    sidebarMode: sidebarBehaviorMode,
    setSidebarMode: setSidebarBehaviorMode,
    isNarrow,
    hasHover,
  } = useSidebarState();

  // FR14-FR17: Drawer state for mobile (narrow + no hover)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const sidebarRef = useRef<HTMLDivElement>(null);
  const { sidebarTranslateX } = useSidebarSwipe({
    sidebarRef,
    side: panelSide,
    isOpen: isDrawerOpen,
    isDesktop: !isNarrow || hasHover,
    onOpen: openDrawer,
    onClose: closeDrawer,
  });
  const { t } = useTranslation();
  const { isDetailPanelPinned } = useDetailPanelPinned();
  const defaultModeChange = useSidebarNavigation();
  const handleModeChange = externalModeChange ?? defaultModeChange;

  const { isHoverExpanded, hoverHandlers } = useSidebarHover(effectiveState);

  // FR11: Auto-collapse only when drawer is open
  const handleAutoCollapse = isDrawerOpen ? closeDrawer : undefined;

  // FR17: Close drawer when transitioning from narrow to wide
  useEffect(() => {
    if (!isNarrow) {
      setIsDrawerOpen(false);
    }
  }, [isNarrow]);

  const isDesktop = !isNarrow;
  const isTaskSelected = selectedTask !== null;
  const showDetailColumn = isDesktop && (isDetailPanelPinned || isTaskSelected);
  const showResizeHandle = showDetailColumn;
  const hideMainOnMobile = !isDesktop && isTaskSelected;

  const mainColumnStyle: React.CSSProperties = showDetailColumn
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
          {commandBar}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:mx-auto xl:max-w-3xl">{children}</div>
          </main>
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
            onMove={onMoveTask}
            onDelete={onDeleteTask}
            onDuplicate={onDuplicateTask}
            onClose={onCloseDetailPanel}
            style={detailPanelStyle}
          />
        )}

        {showDetailColumn && !isTaskSelected && (
          <div
            data-testid="detail-panel-empty-state"
            className="flex flex-col items-center justify-center text-gray-400"
            style={detailPanelStyle}
          >
            <Pin className="mb-2 h-8 w-8" />
            <p className="text-sm">{t("taskDetail.emptyState")}</p>
          </div>
        )}
      </div>

      {/* FR8: Backdrop for drawer mode (narrow + no hover + drawer open) */}
      {isNarrow && !hasHover && isDrawerOpen && (
        <div
          data-testid="sidebar-backdrop"
          className="fixed inset-0 bg-black/40 z-10"
          aria-label={t("filter.closeSidebar")}
          role="button"
          tabIndex={-1}
          onClick={closeDrawer}
        />
      )}

      <Sidebar
        mode={sidebarMode}
        effectiveState={effectiveState}
        isDrawerOpen={isDrawerOpen}
        isHoverExpanded={isHoverExpanded}
        hoverHandlers={hoverHandlers}
        side={panelSide}
        containerRef={sidebarRef}
        sidebarTranslateX={sidebarTranslateX}
        onAutoCollapse={handleAutoCollapse}
        onModeChange={handleModeChange}
        sidebarBehaviorMode={sidebarBehaviorMode}
        onSidebarBehaviorModeChange={setSidebarBehaviorMode}
        isControlVisible={!isNarrow || hasHover}
      />
    </div>
  );
}
