import { useCallback, useState } from "react";
import { Lightbulb, Plus, GripVertical } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DndContext, closestCenter, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { RightFilterPanel } from "@/components/tasks/RightFilterPanel";
import { IdeaItem } from "@/components/ideas/IdeaItem";
import { IdeaDetailPanel } from "@/components/ideas/IdeaDetailPanel";
import { useIdeas } from "@/hooks/useIdeas";
import { useTasks } from "@/hooks/useTasks";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelOpen } from "@/hooks/usePanelOpen";
import { useFilterBarPosition } from "@/hooks/useFilterBarPosition";
import { useRightPanelNavigation } from "@/hooks/useRightPanelNavigation";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useInlineAdd } from "@/hooks/useInlineAdd";
import { useAutoResizeTextarea } from "@/hooks/useAutoResizeTextarea";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { BOX } from "@/constants";
import { cn } from "@/shared/lib/cn";
import type { Idea } from "@/types/entities";

function SortableIdeaItem({
  idea,
  onEdit,
}: {
  idea: Idea;
  onEdit: () => void;
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
  } = useSortable({ id: idea.id });

  const style = {
    transform: transform
      ? `translate3d(0, ${transform.y}px, 0)`
      : undefined,
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const dragHandle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t("idea.drag")}
      className="flex-shrink-0 px-3 py-3 text-gray-300 hover:text-gray-400 touch-none cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-4 h-4" aria-hidden="true" />
    </button>
  );

  return (
    <IdeaItem
      idea={idea}
      nodeRef={setNodeRef}
      style={style}
      dragHandle={dragHandle}
      onEdit={onEdit}
    />
  );
}

export default function IdeasPage() {
  const { t } = useTranslation();
  const { ideas, isLoading, createIdea, updateIdea, deleteIdea, reorderIdeas } =
    useIdeas();
  const { createTask } = useTasks(BOX.INBOX);
  const { panelSide } = usePanelSide();
  const { isPanelOpen, togglePanelOpen } = usePanelOpen();
  const { filterBarPosition } = useFilterBarPosition();
  const sensors = useDndSensors();
  const isDesktop = useIsDesktop();
  const {
    ratio,
    containerRef: splitContainerRef,
    handleResizeMouseDown,
  } = usePanelSplit();

  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const {
    isAdding: isAddingIdea,
    setIsAdding: setIsAddingIdea,
    value: newIdeaName,
    setValue: setNewIdeaName,
    handleKeyDown: handleAddIdeaKeyDown,
    handleBlur: handleAddIdeaBlur,
  } = useInlineAdd((name) => createIdea({ name }));

  const {
    isAdding: isAddingTask,
    setIsAdding: setIsAddingTask,
    value: newTaskTitle,
    setValue: setNewTaskTitle,
    handleKeyDown: handleAddTaskKeyDown,
    handleBlur: handleAddTaskBlur,
  } = useInlineAdd(createTask);

  const newIdeaTextareaRef = useAutoResizeTextarea(newIdeaName);
  const newTaskTextareaRef = useAutoResizeTextarea(newTaskTitle);

  const activeIdeas = ideas.filter((idea) => !idea.is_deleted);

  const handleModeChange = useRightPanelNavigation();

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeIdeas.findIndex((idea) => idea.id === active.id);
      const newIndex = activeIdeas.findIndex((idea) => idea.id === over.id);
      const reordered = arrayMove(activeIdeas, oldIndex, newIndex);
      void reorderIdeas(reordered);
    },
    [activeIdeas, reorderIdeas],
  );

  const handleEditIdea = useCallback((ideaId: string) => {
    setSelectedIdeaId(ideaId);
  }, []);

  const handleCloseEditModal = useCallback(() => {
    setSelectedIdeaId(null);
  }, []);

  const handleUpdateIdea = useCallback(
    async (id: string, changes: Partial<Idea>) => {
      await updateIdea(id, changes);
    },
    [updateIdea],
  );

  const handleDeleteIdea = useCallback(
    (id: string) => {
      void deleteIdea(id);
    },
    [deleteIdea],
  );

  const selectedIdea = selectedIdeaId
    ? activeIdeas.find((idea) => idea.id === selectedIdeaId)
    : null;

  return (
    <div
      data-testid="ideas-page"
      className="relative flex flex-1 overflow-hidden bg-white"
    >
      {/* Split container: idea list + optional idea detail panel */}
      <div ref={splitContainerRef} className="flex flex-1 overflow-hidden">
        {/* Main content */}
        <div
          className={cn(
            "flex flex-1 flex-col overflow-hidden",
            !isDesktop && selectedIdea && "hidden",
          )}
          style={
            isDesktop && selectedIdea
              ? { width: `${ratio * 100}%`, flexShrink: 0 }
              : undefined
          }
        >
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
                aria-label={t("idea.add")}
                data-testid="add-idea-button"
                onClick={() => setIsAddingIdea(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
              >
                <Lightbulb className="w-5 h-5" aria-hidden="true" />
                <Plus
                  className="w-3 h-3 absolute bottom-1 right-1"
                  aria-hidden="true"
                />
              </button>
              <button
                type="button"
                aria-label={t("idea.addTask")}
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
              {t("idea.pageTitle")}
            </h1>
          </header>

          {/* Scrollable idea list */}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:max-w-3xl xl:mx-auto">
              {!isLoading && activeIdeas.length === 0 ? (
                <button
                  type="button"
                  onClick={() => setIsAddingIdea(true)}
                  className="w-full flex flex-col items-center justify-center text-gray-400 hover:text-accent transition-colors py-3"
                  data-testid="empty-ideas-message"
                >
                  <p className="text-sm">{t("idea.empty")}</p>
                </button>
              ) : (
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd}
                >
                  <SortableContext
                    items={activeIdeas.map((idea) => idea.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <ul>
                      {activeIdeas.map((idea) => (
                        <SortableIdeaItem
                          key={idea.id}
                          idea={idea}
                          onEdit={() => handleEditIdea(idea.id)}
                        />
                      ))}
                    </ul>
                  </SortableContext>
                </DndContext>
              )}

              {/* Inline add idea input */}
              {isAddingIdea && (
                <div className="px-4 py-3 border-b border-gray-100">
                  <textarea
                    ref={newIdeaTextareaRef}
                    rows={1}
                    autoFocus
                    value={newIdeaName}
                    onChange={(event) => setNewIdeaName(event.target.value)}
                    onKeyDown={handleAddIdeaKeyDown}
                    onBlur={handleAddIdeaBlur}
                    placeholder={t("idea.titlePlaceholder")}
                    className="w-full text-sm outline-none placeholder:text-gray-400 resize-none overflow-hidden"
                    data-testid="add-idea-input"
                  />
                </div>
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
                    placeholder={t("idea.taskPlaceholder")}
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
              {/* Add idea button */}
              <button
                type="button"
                aria-label={t("idea.add")}
                data-testid="add-idea-button"
                onClick={() => setIsAddingIdea(true)}
                className="relative flex items-center justify-center w-10 h-10 rounded-full text-accent hover:bg-accent/10 active:bg-accent/20 transition-colors"
              >
                <Lightbulb className="w-5 h-5" aria-hidden="true" />
                <Plus
                  className="w-3 h-3 absolute bottom-1 right-1"
                  aria-hidden="true"
                />
              </button>

              {/* Add task button */}
              <button
                type="button"
                aria-label={t("idea.addTask")}
                data-testid="add-task-button"
                onClick={() => setIsAddingTask(true)}
                className="ml-auto flex-shrink-0 w-10 h-10 bg-accent text-white rounded-full flex items-center justify-center shadow-md hover:bg-accent/80 active:bg-accent/70 transition-colors"
              >
                <Plus className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>
          )}
        </div>

        {/* Resize handle between idea list and detail panel */}
        {isDesktop && selectedIdea && (
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Idea detail panel — shown when an idea is selected (desktop: side panel, mobile: full screen) */}
        {selectedIdea && (
          <IdeaDetailPanel
            idea={selectedIdea}
            onUpdate={handleUpdateIdea}
            onDelete={(ideaId) => {
              setSelectedIdeaId(null);
              handleDeleteIdea(ideaId);
            }}
            onClose={handleCloseEditModal}
            style={
              isDesktop
                ? { width: `${(1 - ratio) * 100}%`, flexShrink: 0 }
                : { flex: "1 1 0" }
            }
          />
        )}
      </div>
      {/* end splitContainerRef */}

      {/* Right filter panel */}
      <RightFilterPanel
        mode="ideas"
        isOpen={isPanelOpen}
        side={panelSide}
        onToggle={togglePanelOpen}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
