import { generateKeyBetween } from "fractional-indexing";
import type { Context } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let contextCounter = 0;
let lastContextKey: string | null = null;

export function buildContext(overrides: Partial<Context> = {}): Context {
  contextCounter += 1;
  lastContextKey = generateKeyBetween(lastContextKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `@Context ${contextCounter}`,
    sort_order: lastContextKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
