import { db } from "@/db/database";
import { ChecklistRepository } from "@/db/repositories/ChecklistRepository";
import { ChecklistService } from "@/services/ChecklistService";
import { buildChecklistItem } from "@/test/factories/checklistItemFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { ChecklistItem } from "@/types/entities";

export function createScenarioContext() {
  const checklistItemIds = new Map<string, string>();
  let checklistService: ChecklistService;

  const reset = async () => {
    await db.checklist_items.clear();
    checklistItemIds.clear();
    checklistService = new ChecklistService(new ChecklistRepository());
  };

  return {
    checklistItemIds,
    get checklistService() {
      return checklistService;
    },
    reset,
  };
}

export async function seedChecklistItem(
  checklistItemIds: Map<string, string>,
  name: string,
  overrides: Partial<ChecklistItem> = {},
) {
  const checklistItemId = crypto.randomUUID();
  checklistItemIds.set(name, checklistItemId);
  await db.checklist_items.add(
    buildChecklistItem({ id: checklistItemId, name, ...overrides }),
  );
  return checklistItemId;
}

export async function getChecklistItem(
  checklistItemIds: Map<string, string>,
  name: string,
): Promise<ChecklistItem> {
  return (await db.checklist_items.get(
    getIdOrThrow(checklistItemIds, name),
  )) as ChecklistItem;
}

export async function seedChecklistItemsWithOrder(
  checklistItemIds: Map<string, string>,
  names: string[],
  taskId: string,
) {
  const { rebalanceKeys } = await import("@/services/SortOrderService");
  const keys = rebalanceKeys(names.length);
  for (let i = 0; i < names.length; i++) {
    await seedChecklistItem(checklistItemIds, names[i], {
      task_id: taskId,
      sort_order: keys[i],
      needsSync: false,
    });
  }
}
