/**
 * IdeasPage — displays and manages ideas.
 * Implements FR20 of command-bar.
 */
import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { GripVertical, Lightbulb } from "lucide-react";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { CommandBar } from "@/components/command-bar";
import { IdeaDetailPanel } from "@/components/ideas/IdeaDetailPanel";
import { IdeaItem } from "@/components/ideas/IdeaItem";
import { SidebarShell } from "@/components/layout/SidebarShell";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useIdeas } from "@/hooks/useIdeas";
import { useIsDesktop } from "@/hooks/useIsDesktop";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { generateKeyBetween } from "@/services/SortOrderService";
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
    transform: transform ? `translate3d(0, ${transform.y}px, 0)` : undefined,
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
  const sensors = useDndSensors();
  const isDesktop = useIsDesktop();
  const {
    ratio,
    containerRef: splitContainerRef,
    handleResizeMouseDown,
  } = usePanelSplit();

  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const activeIdeas = ideas.filter((idea) => !idea.is_deleted);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeIdeas.findIndex((idea) => idea.id === active.id);
      const newIndex = activeIdeas.findIndex((idea) => idea.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted DESC: index 0 = highest key, last index = lowest key
      // upper = higher key (lower index), lower = lower key (higher index)
      const upperNeighbor =
        newIndex > 0 ? String(activeIdeas[newIndex - 1].sort_order) : null;
      const lowerNeighbor =
        newIndex < activeIdeas.length - 1
          ? String(activeIdeas[newIndex + 1].sort_order)
          : null;

      // If moving down, the displaced item moves up, so neighbors shift
      const upperKey =
        oldIndex < newIndex
          ? String(activeIdeas[newIndex].sort_order)
          : upperNeighbor;
      const lowerKey =
        oldIndex > newIndex
          ? String(activeIdeas[newIndex].sort_order)
          : lowerNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderIdeas(String(active.id), newSortOrder);
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

  const handleSubmit = useCallback(
    (name: string) => {
      void createIdea({ name });
    },
    [createIdea],
  );

  const selectedIdea = selectedIdeaId
    ? activeIdeas.find((idea) => idea.id === selectedIdeaId)
    : null;

  return (
    <SidebarShell mode="ideas" data-testid="ideas-page">
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
          <CommandBar
            entityIcon={Lightbulb}
            placeholder={t("commandBar.placeholder.idea")}
            onSubmit={handleSubmit}
          />

          {/* Header */}
          <header className="px-4 py-3 border-b border-gray-100">
            <h1 className="text-lg font-semibold text-accent">
              {t("idea.pageName")}
            </h1>
          </header>

          {/* Scrollable idea list */}
          <main className="flex-1 overflow-y-auto">
            <div className="xl:max-w-3xl xl:mx-auto">
              {!isLoading && activeIdeas.length === 0 ? (
                <div
                  className="w-full flex flex-col items-center justify-center text-gray-400 py-3"
                  data-testid="empty-ideas-message"
                >
                  <p className="text-sm">{t("idea.empty")}</p>
                </div>
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
            </div>
          </main>
        </div>

        {/* Resize handle between idea list and detail panel */}
        {isDesktop && selectedIdea && (
          <div
            className="w-1 flex-shrink-0 cursor-col-resize bg-gray-100 hover:bg-accent/30 active:bg-accent/50 transition-colors"
            onMouseDown={handleResizeMouseDown}
          />
        )}

        {/* Idea detail panel */}
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
    </SidebarShell>
  );
}
