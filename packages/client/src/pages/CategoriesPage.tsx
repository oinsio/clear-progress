/**
 * CategoriesPage — displays and manages categories.
 * Implements FR20 of command-bar.
 */
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Tag } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { CommandBar } from "@/components/command-bar";
import { Sidebar } from "@/components/tasks/Sidebar";
import { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { useCategories } from "@/hooks/useCategories";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { usePanelSide } from "@/hooks/usePanelSide";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useSidebarState } from "@/hooks/useSidebarState";
import { generateKeyBetween } from "@/services/SortOrderService";
import { TaskService } from "@/services/TaskService";
import { cn } from "@/shared/lib/cn";
import type { Category } from "@/types/entities";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
  undefined,
  new AttachmentRepository(),
);

function SortableCategoryItem({
  category,
  taskCount,
  onNavigate,
}: {
  category: Category;
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
  } = useSortable({ id: category.id });
  const isUnsynced = useIsUnsynced(category);
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
        onClick={() => onNavigate(category.id)}
        className="flex-1 text-left px-4 py-3"
      >
        <span className="text-gray-800 text-sm">{category.name}</span>
        {taskCount > 0 && (
          <span className="block text-xs text-gray-400 mt-0.5">
            {t("category.taskCount")} {taskCount}
          </span>
        )}
      </button>
      <button
        type="button"
        ref={setActivatorNodeRef}
        {...attributes}
        {...listeners}
        aria-label={t("category.drag")}
        className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
      >
        <GripVertical className="w-4 h-4" aria-hidden="true" />
      </button>
    </li>
  );
}

export default function CategoriesPage() {
  const { t } = useTranslation();
  const { categories, isLoading, createCategory, reorderCategories } =
    useCategories();
  const { panelSide } = usePanelSide();
  const navigate = useNavigate();

  const sensors = useDndSensors();

  const [categoryTaskCounts, setCategoryTaskCounts] = useState<
    Record<string, number>
  >({});
  const { effectiveState, isNarrow, hasHover } = useSidebarState();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  // FR17: Close drawer when transitioning from narrow to wide
  useEffect(() => {
    if (!isNarrow) {
      setIsDrawerOpen(false);
    }
  }, [isNarrow]);

  const activeCategories = categories.filter(
    (category) => !category.is_deleted,
  );

  useEffect(() => {
    void defaultTaskService.getCategoryTaskCounts().then(setCategoryTaskCounts);
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeCategories.findIndex((c) => c.id === active.id);
      const newIndex = activeCategories.findIndex((c) => c.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted ASC: index 0 = lowest key, last index = highest key
      const lowerNeighbor =
        newIndex > 0 ? String(activeCategories[newIndex - 1].sort_order) : null;
      const upperNeighbor =
        newIndex < activeCategories.length - 1
          ? String(activeCategories[newIndex + 1].sort_order)
          : null;

      const lowerKey =
        oldIndex < newIndex
          ? String(activeCategories[newIndex].sort_order)
          : lowerNeighbor;
      const upperKey =
        oldIndex > newIndex
          ? String(activeCategories[newIndex].sort_order)
          : upperNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderCategories(String(active.id), newSortOrder);
    },
    [activeCategories, reorderCategories],
  );

  const handleModeChange = useSidebarNavigation();
  const handleAutoCollapse = isDrawerOpen ? closeDrawer : undefined;

  const handleSubmit = useCallback(
    (name: string) => {
      void createCategory(name);
    },
    [createCategory],
  );

  return (
    <div
      data-testid="categories-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <CommandBar
          entityIcon={Tag}
          placeholder={t("commandBar.placeholder.category")}
          onSubmit={handleSubmit}
        />

        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">
            {t("filter.categories")}
          </h1>
        </header>

        {/* Scrollable category list */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {!isLoading && activeCategories.length === 0 ? (
              <div
                className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                data-testid="empty-categories-message"
              >
                <p className="text-sm">{t("category.empty")}</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={activeCategories.map((c) => c.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <ul>
                    {activeCategories.map((category) => (
                      <SortableCategoryItem
                        key={category.id}
                        category={category}
                        taskCount={categoryTaskCounts[category.id] ?? 0}
                        onNavigate={(id) => navigate(`/categories/${id}`)}
                      />
                    ))}
                  </ul>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </main>
      </div>

      {/* FR8: Backdrop for drawer mode */}
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

      {/* Right filter panel — full height */}
      <Sidebar
        mode="categories"
        effectiveState={effectiveState}
        isDrawerOpen={isDrawerOpen}
        side={panelSide}
        onAutoCollapse={handleAutoCollapse}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
