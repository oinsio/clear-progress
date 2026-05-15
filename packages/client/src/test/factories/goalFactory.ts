import type { Goal } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let goalCounter = 0;

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  goalCounter += 1;
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Goal ${goalCounter}`,
    description: "",
    cover_file_id: "",
    status: "planning",
    sort_order: goalCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
