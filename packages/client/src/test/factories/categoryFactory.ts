import type { Category } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let categoryCounter = 0;

export function buildCategory(overrides: Partial<Category> = {}): Category {
  categoryCounter += 1;
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Category ${categoryCounter}`,
    sort_order: categoryCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
