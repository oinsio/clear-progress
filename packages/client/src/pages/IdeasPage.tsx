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
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CommandBar } from "@/components/command-bar";
import { IdeaDetailPanel } from "@/components/ideas/IdeaDetailPanel";
import { IdeaItem } from "@/components/ideas/IdeaItem";
import { Sidebar } from "@/components/tasks/Sidebar";
import { useDndSensors } from "@/hooks/useDndSensors";
import { useIdeas } from "@/hooks/useIdeas";
import { usePanelSide } from "@/hooks/usePanelSide";
import { usePanelSplit } from "@/hooks/usePanelSplit";
import { useSidebarNavigation } from "@/hooks/useSidebarNavigation";
import { useSidebarState } from "@/hooks/useSidebarState";
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
  const { panelSide } = usePanelSide();
  const { effectiveState, isNarrow, hasHover } = useSidebarState();
  const sensors = useDndSensors();
  const isDesktop = !isNarrow;
  const {
    ratio,
    containerRef: splitContainerRef,
    handleResizeMouseDown,
  } = usePanelSplit();

  const [selectedIdeaId, setSelectedIdeaId] = useState<string | null>(null);

  const activeIdeas = ideas.filter((idea) => !idea.is_deleted);

  const handleModeChange = useSidebarNavigation();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const handleAutoCollapse = isDrawerOpen ? closeDrawer : undefined;

  // FR17: Close drawer when transitioning from narrow to wide
  useEffect(() => {
    if (!isNarrow) {
      setIsDrawerOpen(false);
    }
  }, [isNarrow]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = activeIdeas.findIndex((idea) => idea.id === active.id);
      const newIndex = activeIdeas.findIndex((idea) => idea.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted ASC: index 0 = lowest key, last index = highest key
      const lowerNeighbor =
        newIndex > 0 ? String(activeIdeas[newIndex - 1].sort_order) : null;
      const upperNeighbor =
        newIndex < activeIdeas.length - 1
          ? String(activeIdeas[newIndex + 1].sort_order)
          : null;

      const lowerKey =
        oldIndex < newIndex
          ? String(activeIdeas[newIndex].sort_order)
          : lowerNeighbor;
      const upperKey =
        oldIndex > newIndex
          ? String(activeIdeas[newIndex].sort_order)
          : upperNeighbor;

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
      {/* end splitContainerRef */}

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

      {/* Right filter panel */}
      <Sidebar
        mode="ideas"
        effectiveState={effectiveState}
        isDrawerOpen={isDrawerOpen}
        side={panelSide}
        onAutoCollapse={handleAutoCollapse}
        onModeChange={handleModeChange}
      />
    </div>
  );
}
