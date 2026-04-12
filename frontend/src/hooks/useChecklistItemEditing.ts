import { useState, useCallback } from "react";
import * as React from "react";

export function useChecklistItemEditing(
  updateItem: (id: string, name: string) => Promise<void>,
) {
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingItemName, setEditingItemName] = useState("");

  const handleItemNameClick = useCallback(
    (item: { id: string; name: string }) => {
      setEditingItemId(item.id);
      setEditingItemName(item.name);
    },
    [],
  );

  const commitItemEdit = useCallback(
    async (id: string) => {
      const trimmedName = editingItemName.trim();
      if (trimmedName) {
        await updateItem(id, trimmedName);
      }
      setEditingItemId(null);
      setEditingItemName("");
    },
    [editingItemName, updateItem],
  );

  const handleItemEditKeyDown = useCallback(
    async (event: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>, id: string) => {
      if (event.key === "Enter") {
        await commitItemEdit(id);
      }
    },
    [commitItemEdit],
  );

  return {
    editingItemId,
    editingItemName,
    setEditingItemName,
    handleItemNameClick,
    commitItemEdit,
    handleItemEditKeyDown,
  };
}
