import { generateKeyBetween } from "fractional-indexing";
import type { Goal } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let goalCounter = 0;
let lastGoalKey: string | null = null;

export function buildGoal(overrides: Partial<Goal> = {}): Goal {
  goalCounter += 1;
  lastGoalKey = generateKeyBetween(lastGoalKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Goal ${goalCounter}`,
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: lastGoalKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    syncStatus: "synced" as const,
    ...overrides,
  };
}
