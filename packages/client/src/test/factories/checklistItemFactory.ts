import type { ChecklistItem } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let checklistItemCounter = 0;

export function buildChecklistItem(
  overrides: Partial<ChecklistItem> = {},
): ChecklistItem {
  checklistItemCounter += 1;
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    task_id: crypto.randomUUID(),
    name: `Checklist Item ${checklistItemCounter}`,
    is_completed: false,
    sort_order: checklistItemCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
