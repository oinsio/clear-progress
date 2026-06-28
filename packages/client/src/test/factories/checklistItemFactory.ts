import { generateKeyBetween } from "fractional-indexing";
import type { ChecklistItem } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let checklistItemCounter = 0;
let lastChecklistKey: string | null = null;

export function buildChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  checklistItemCounter += 1;
  lastChecklistKey = generateKeyBetween(lastChecklistKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    task_id: crypto.randomUUID(),
    name: `Checklist Item ${checklistItemCounter}`,
    is_completed: false,
    sort_order: lastChecklistKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    syncStatus: "synced" as const,
    ...overrides,
  };
}
