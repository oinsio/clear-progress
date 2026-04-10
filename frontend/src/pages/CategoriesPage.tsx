import { useState, useCallback, useEffect } from "react";
import { Tag, Plus, GripVertical } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import {
  RightFilterPanel,
  type RightPanelMode,
} from "@/components/tasks/RightFilterPanel";
import { useCategories } from "@/hooks/useCategories";
import { useTasks } from "@/hooks/useTasks";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useInlineAdd } from "@/hooks/useInlineAdd";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { BOX, ROUTES } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Category } from "@/types/entities";
import { useIsUnsynced } from "@/hooks/useIsUnsynced";
import { TaskService } from "@/services/TaskService";
import { TaskRepository } from "@/db/repositories/TaskRepository";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";

const defaultTaskService = new TaskService(
  new TaskRepository(),
  new ChecklistRepository(),
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
    transform: transform
      ? `translate3d(0, ${transform.y}px, 0)`
      : undefined,
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
  const { createTask } = useTasks(BOX.INBOX);
  const { panelSide } = usePanelSide();
  const { filterBarPosition } = useFilterBarPosition();
  const navigate = useNavigate();

  const sensors = useDndSensors();

  const [categoryTaskCounts, setCategoryTaskCounts] = useState<
    Record<string, number>
  >({});
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();

  const {
    isAdding: isAddingCategory,
    setIsAdding: setIsAddingCategory,
    value: newCategoryName,
    setValue: setNewCategoryName,
    handleKeyDown: handleAddCategoryKeyDown,
    handleBlur: handleAddCategoryBlur,
  } = useInlineAdd(createCategory);

  const {
    isAdding: isAddingTask,
    setIsAdding: setIsAddingTask,
    value: newTaskTitle,
    setValue: setNewTaskTitle,
    handleKeyDown: handleAddTaskKeyDown,
    handleBlur: handleAddTaskBlur,
  } = useInlineAdd(createTask);

  const newCategoryTextareaRef = useAutoResizeTextarea(newCategoryName);
  const newTaskTextareaRef = useAutoResizeTextarea(newTaskTitle);

  const activeCategories = categories.filter(
    (category) => !category.is_deleted,
  );

  useEffect(() => {
    void defaultTaskService.getCategoryTaskCounts().then(setCategoryTaskCounts);
  }, []);

  const handlePanelToggle = togglePanelOpen;

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeCategories.findIndex((c) => c.id === active.id);
      const newIndex = activeCategories.findIndex((c) => c.id === over.id);
      const reordered = arrayMove(activeCategories, oldIndex, newIndex);
      void reorderCategories(reordered);
    },
    [activeCategories, reorderCategories],
  );

  const handleModeChange = useCallback(
    (newMode: RightPanelMode) => {
      if (newMode === "inbox" || newMode === "tasks" || newMode === "completed")
        navigate(ROUTES.INBOX, { state: { filterMode: newMode } });
    },
    [navigate],
  );

  return (
    <div
      data-testid="categories-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Main content column */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Action bar — top position (above header) */}
        {filterBarPosition === "top" && (
          <div
            className={cn(
              "flex items-center border-b border-gray-200 bg-white px-3 py-2",
              panelSide === "left" && "flex-row-reverse",
            )}
          >
            <button
              type="button"
              aria-label={t("category.add")}
              data-testid="add-category-button"
              onClick={() => setIsAddingCategory(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
            >
              <Tag className="w-5 h-5" aria-hidden="true" />
              <Plus
                className="w-3 h-3 absolute bottom-1 right-1"
                aria-hidden="true"
              />
            </button>
            <button
              type="button"
              aria-label={t("category.addTask")}
              data-testid="add-task-button"
              onClick={() => setIsAddingTask(true)}
              className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Header */}
        <header className="px-4 py-3 border-b border-gray-100">
          <h1 className="text-lg font-semibold text-accent">
            {t("filter.categories")}
          </h1>
        </header>

        {/* Scrollable category list */}
        <main className="flex-1 overflow-y-auto">
          <div className="xl:max-w-3xl xl:mx-auto">
            {!isLoading && activeCategories.length === 0 && !isAddingCategory ? (
            <button
              type="button"
              onClick={() => setIsAddingCategory(true)}
              className="w-full flex flex-col items-center justify-center text-gray-400 hover:text-accent transition-colors py-3"
              data-testid="empty-categories-message"
            >
              <p className="text-sm">{t("category.empty")}</p>
            </button>
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

                  {/* Inline add category input */}
                  {isAddingCategory && (
                    <li className="px-4 py-3 border-b border-gray-100">
                      <textarea
                        ref={newCategoryTextareaRef}
                        rows={1}
                        autoFocus
                        value={newCategoryName}
                        onChange={(event) =>
                          setNewCategoryName(event.target.value)
                        }
                        onKeyDown={handleAddCategoryKeyDown}
                        onBlur={handleAddCategoryBlur}
                        placeholder={t("category.namePlaceholder")}
                        className="w-full text-sm outline-none placeholder:text-gray-400 resize-none overflow-hidden"
                        data-testid="add-category-input"
                      />
                    </li>
                  )}
                </ul>
              </SortableContext>
            </DndContext>
          )}

          {/* Inline add task input */}
          {isAddingTask && (
            <div className="px-4 py-3 border-b border-gray-100">
              <textarea
                ref={newTaskTextareaRef}
                rows={1}
                autoFocus
                value={newTaskTitle}
                onChange={(event) => setNewTaskTitle(event.target.value)}
                onKeyDown={handleAddTaskKeyDown}
                onBlur={handleAddTaskBlur}
                placeholder={t("category.taskPlaceholder")}
                className="w-full text-sm outline-none placeholder:text-gray-400 resize-none overflow-hidden"
                data-testid="add-task-input"
              />
            </div>
          )}
          </div>
        </main>

        {/* Action bar — bottom position (default) */}
        {filterBarPosition === "bottom" && (
          <div
            className={cn(
              "flex items-center border-t border-gray-200 bg-white px-3 py-2",
              panelSide === "left" && "flex-row-reverse",
            )}
          >
            {/* Add category button */}
            <button
              type="button"
              aria-label={t("category.add")}
              data-testid="add-category-button"
              onClick={() => setIsAddingCategory(true)}
              className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
            >
              <Tag className="w-5 h-5" aria-hidden="true" />
              <Plus
                className="w-3 h-3 absolute bottom-1 right-1"
                aria-hidden="true"
              />
            </button>

            {/* Add task button */}
            <button
              type="button"
              aria-label={t("category.addTask")}
              data-testid="add-task-button"
              onClick={() => setIsAddingTask(true)}
              className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
            >
              <Plus className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        )}
      </div>

      {/* Right filter panel — full height */}
      <RightFilterPanel
        mode="categories"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={handlePanelToggle}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
