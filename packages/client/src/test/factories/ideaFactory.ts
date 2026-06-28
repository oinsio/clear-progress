import { generateKeyBetween } from "fractional-indexing";
import type { Idea } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let ideaCounter = 0;
let lastIdeaKey: string | null = null;

export function buildIdea(overrides: Partial<Idea> = {}): Idea {
  ideaCounter += 1;
  lastIdeaKey = generateKeyBetween(lastIdeaKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Idea ${ideaCounter}`,
    description: "",
    sort_order: lastIdeaKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    syncStatus: "synced" as const,
    ...overrides,
  };
}
