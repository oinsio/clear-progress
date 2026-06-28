import { generateKeyBetween } from "fractional-indexing";
import type { Category } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let categoryCounter = 0;
let lastCategoryKey: string | null = null;

export function buildCategory(overrides: Partial<Category> = {}): Category {
  categoryCounter += 1;
  lastCategoryKey = generateKeyBetween(lastCategoryKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Category ${categoryCounter}`,
    sort_order: lastCategoryKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    syncStatus: "synced" as const,
    ...overrides,
  };
}
