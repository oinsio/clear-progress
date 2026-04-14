import type { Idea } from "@/types/entities";

let ideaCounter = 0;

export function buildIdea(overrides: Partial<Idea> = {}): Idea {
  ideaCounter += 1;
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    name: `Idea ${ideaCounter}`,
    description: "",
    sort_order: ideaCounter,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    version: 1,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
