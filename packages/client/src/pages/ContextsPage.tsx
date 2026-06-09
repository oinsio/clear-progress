/**
 * ContextsPage — displays and manages contexts.
 * Implements FR20 of command-bar.
 */
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, MapPin } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CommandBar } from "@/components/command-bar";
import { Sidebar } from "@/components/tasks/Sidebar";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { useContexts } from "@/hooks/useContexts";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { generateKeyBetween } from "@/services/SortOrderService";
import { TaskService } from "@/services/TaskService";
import { cn } from "@/shared/lib/cn";
import type { Context } from "@/types/entities";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  new AttachmentRepository(),
);

function SortableContextItem({
  context,
  taskCount,
  onNavigate,
}: {
  context: Context;
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
  } = useSortable({ id: context.id });
  const isUnsynced = useIsUnsynced(context);
  const { panelSide } = usePanelSide();

  const style = {
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={cn(
        panelSide === "left"
          ? "flex items-center border-b border-gray-100 bg-white border-l-2 transition-colors hover:bg-gray-50"
          : "flex items-center border-b border-gray-100 bg-white border-l-[4px] md:border-l-2 transition-colors hover:bg-gray-50",
        isUnsynced ? "border-l-amber-400" : "border-l-transparent",
      )}
    >
      <button
        type="button"
        onClick={() => onNavigate(context.id)}
        className="flex-1 text-left px-4 py-3"
      >
        <span className="text-gray-800 text-sm">{context.name}</span>
        {taskCount > 0 && (
          <span className="block text-xs text-gray-400 mt-0.5">
            {t("context.taskCount")} {taskCount}
          </span>
        )}
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("context.drag")}
        className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function ContextsPage() {
  const { t } = useTranslation();
  const { contexts, isLoading, createContext, reorderContexts } = useContexts();
  const { panelSide } = usePanelSide();
  const navigate = useNavigate();

  const sensors = useDndSensors();

  const [contextTaskCounts, setContextTaskCounts] = useState<
    Record<string, number>
  >({});
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();

  const activeContexts = contexts.filter((context) => !context.is_deleted);

  useEffect(() => {
    void defaultTaskService.getContextTaskCounts().then(setContextTaskCounts);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeContexts.findIndex((c) => c.id === active.id);
      const newIndex = activeContexts.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted ASC: index 0 = lowest key, last index = highest key
      const lowerNeighbor =
        newIndex > 0 ? String(activeContexts[newIndex - 1].sort_order) : null;
      const upperNeighbor =
        newIndex < activeContexts.length - 1
          ? String(activeContexts[newIndex + 1].sort_order)
          : null;

      const lowerKey =
        oldIndex < newIndex
          ? String(activeContexts[newIndex].sort_order)
          : lowerNeighbor;
      const upperKey =
        oldIndex > newIndex
          ? String(activeContexts[newIndex].sort_order)
          : upperNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderContexts(String(active.id), newSortOrder);
    },
    [activeContexts, reorderContexts],
  );

  const handleModeChange = useSidebarNavigation();

  const handleSubmit = useCallback(
    (name: string) => {
      void createContext(name);
    },
    [createContext],
  );

  return (
    <div
      data-testid="contexts-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CommandBar
          entityIcon={MapPin}
          placeholder={t("commandBar.placeholder.context")}
          onSubmit={handleSubmit}
        />

        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">
            {t("filter.contexts")}
          </h1>
        </header>

        {/* Scrollable context list */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {!isLoading && activeContexts.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="empty-contexts-message"
              >
                <p className="text-sm">{t("context.empty")}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeContexts.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {activeContexts.map((context) => (
                      <SortableContextItem
                        key={context.id}
                        context={context}
                        taskCount={contextTaskCounts[context.id] ?? 0}
                        onNavigate={(id) => navigate(`/contexts/${id}`)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {/* Right filter panel */}
      <Sidebar
        mode="contexts"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
