import { closestCenter, DndContext, type DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type * as React from "react";
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useChecklistItemEditing } from "@/hooks/useChecklistItemEditing";
import { useDndSensors } from "@/hooks/useDndSensors";
import { generateKeyBetween } from "@/services/SortOrderService";
import type { ChecklistItem } from "@/types/entities";
import { SortableChecklistItem } from "./SortableChecklistItem";
import {
  CHECKLIST_ITEM_VARIANT,
  type ChecklistItemVariant,
} from "./taskEditShared";

interface ChecklistSectionProps {
  name: string;
  items: ChecklistItem[];
  editingItemId: string | null;
  editingItemName: string;
  variant: ChecklistItemVariant;
  onDragEnd: (event: DragEndEvent) => void;
  onToggle: (id: string) => void;
  onStartEdit: (item: ChecklistItem) => void;
  onEditChange: (value: string) => void;
  onCommitEdit: (id: string) => void;
  onEditKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
    id: string,
  ) => void;
  onDelete: (id: string) => void;
  getToggleAriaLabel: (item: ChecklistItem) => string;
  getDeleteAriaLabel: (item: ChecklistItem) => string;
}

function ChecklistSection({
  name,
  items,
  editingItemId,
  editingItemName,
  variant,
  onDragEnd,
  onToggle,
  onStartEdit,
  onEditChange,
  onCommitEdit,
  onEditKeyDown,
  onDelete,
  getToggleAriaLabel,
  getDeleteAriaLabel,
}: ChecklistSectionProps) {
  const sensors = useDndSensors();
  return (
    <div>
      <p className="text-center text-sm font-medium text-accent mb-2">{name}</p>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={items.map((item) => item.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1">
            {items.map((item) => (
              <SortableChecklistItem
                key={item.id}
                item={item}
                isEditing={editingItemId === item.id}
                editingName={editingItemName}
                variant={variant}
                toggleAriaLabel={getToggleAriaLabel(item)}
                deleteAriaLabel={getDeleteAriaLabel(item)}
                onToggle={() => onToggle(item.id)}
                onStartEdit={() => onStartEdit(item)}
                onEditChange={onEditChange}
                onEditBlur={() => onCommitEdit(item.id)}
                onEditKeyDown={(event) => onEditKeyDown(event, item.id)}
                onDelete={() => onDelete(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface TaskChecklistTabProps {
  items: ChecklistItem[];
  createItem: (name: string) => Promise<void>;
  toggleItem: (id: string) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  updateItem: (id: string, name: string) => Promise<void>;
  reorderItems: (itemId: string, newSortOrder: string) => Promise<void>;
}

export function TaskChecklistTab({
  items,
  createItem,
  toggleItem,
  deleteItem,
  updateItem,
  reorderItems,
}: TaskChecklistTabProps) {
  const { t } = useTranslation();
  const [newItemName, setNewItemName] = useState("");
  const newItemInputRef = useRef<HTMLInputElement>(null);

  const {
    editingItemId,
    editingItemName,
    setEditingItemName,
    handleItemNameClick,
    commitItemEdit,
    handleItemEditKeyDown,
  } = useChecklistItemEditing(updateItem);

  const activeItems = items.filter((item) => !item.is_completed);
  const completedItems = items.filter((item) => item.is_completed);

  const handleSectionDragEnd = useCallback(
    (sectionItems: ChecklistItem[], event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = sectionItems.findIndex((item) => item.id === active.id);
      const newIndex = sectionItems.findIndex((item) => item.id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      // List is sorted ASC: index 0 = lowest key, last index = highest key
      const lowerNeighbor =
        newIndex > 0 ? String(sectionItems[newIndex - 1].sort_order) : null;
      const upperNeighbor =
        newIndex < sectionItems.length - 1
          ? String(sectionItems[newIndex + 1].sort_order)
          : null;

      const lowerKey =
        oldIndex < newIndex
          ? String(sectionItems[newIndex].sort_order)
          : lowerNeighbor;
      const upperKey =
        oldIndex > newIndex
          ? String(sectionItems[newIndex].sort_order)
          : upperNeighbor;

      const newSortOrder = generateKeyBetween(lowerKey, upperKey);
      void reorderItems(String(active.id), newSortOrder);
    },
    [reorderItems],
  );

  const handleNewItemKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "Enter" && newItemName.trim()) {
        await createItem(newItemName.trim());
        setNewItemName("");
      }
    },
    [newItemName, createItem],
  );

  const handleNewItemBlur = useCallback(async () => {
    if (newItemName.trim()) {
      await createItem(newItemName.trim());
      setNewItemName("");
    }
  }, [newItemName, createItem]);

  return (
    <div className="px-4 py-4 flex flex-col gap-4">
      <ChecklistSection
        name={t("taskEdit.activeSection", { count: activeItems.length })}
        items={activeItems}
        editingItemId={editingItemId}
        editingItemName={editingItemName}
        variant={CHECKLIST_ITEM_VARIANT.ACTIVE}
        onDragEnd={(event) => handleSectionDragEnd(activeItems, event)}
        onToggle={(id) => void toggleItem(id)}
        onStartEdit={handleItemNameClick}
        onEditChange={setEditingItemName}
        onCommitEdit={(id) => void commitItemEdit(id)}
        onEditKeyDown={(event, id) => void handleItemEditKeyDown(event, id)}
        onDelete={(id) => void deleteItem(id)}
        getToggleAriaLabel={(item) =>
          t("taskEdit.checkItemMark", { name: item.name })
        }
        getDeleteAriaLabel={(item) =>
          t("taskEdit.checkItemDelete", { name: item.name })
        }
      />

      {/* New item input */}
      <div className="flex items-center gap-3 py-1.5">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="w-3.5 h-5 flex-shrink-0" />
          <span className="w-0.5 h-5" />
          <div className="w-5 h-5 rounded border-2 border-gray-200 flex-shrink-0" />
        </div>
        <input
          ref={newItemInputRef}
          type="text"
          value={newItemName}
          onChange={(event) => setNewItemName(event.target.value)}
          onKeyDown={(event) => void handleNewItemKeyDown(event)}
          onBlur={() => void handleNewItemBlur()}
          placeholder={t("taskEdit.newChecklistItemPlaceholder")}
          className="flex-1 text-sm text-gray-400 outline-none placeholder:text-gray-300"
        />
      </div>

      {completedItems.length > 0 && (
        <ChecklistSection
          name={t("taskEdit.doneSection", {
            count: completedItems.length,
          })}
          items={completedItems}
          editingItemId={editingItemId}
          editingItemName={editingItemName}
          variant={CHECKLIST_ITEM_VARIANT.COMPLETED}
          onDragEnd={(event) => handleSectionDragEnd(completedItems, event)}
          onToggle={(id) => void toggleItem(id)}
          onStartEdit={handleItemNameClick}
          onEditChange={setEditingItemName}
          onCommitEdit={(id) => void commitItemEdit(id)}
          onEditKeyDown={(event, id) => void handleItemEditKeyDown(event, id)}
          onDelete={(id) => void deleteItem(id)}
          getToggleAriaLabel={(item) =>
            t("taskEdit.checkItemUnmark", { name: item.name })
          }
          getDeleteAriaLabel={(item) =>
            t("taskEdit.checkItemDelete", { name: item.name })
          }
        />
      )}
    </div>
  );
}
