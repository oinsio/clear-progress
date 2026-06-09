import { generateKeyBetween } from "fractional-indexing";
import type { Task } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let taskCounter = 0;
let lastTaskKey: string | null = null;

export function buildTask(overrides: Partial<Task> = {}): Task {
  taskCounter += 1;
  lastTaskKey = generateKeyBetween(lastTaskKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    name: `Task ${taskCounter}`,
    description: "",
    box: "inbox",
    goal_id: "",
    context_id: "",
    category_id: "",
    is_completed: false,
    completed_at: "",
    repeat_rule: "",
    is_hidden: false,
    next_date: "",
    appear_date: "",
    original_task_id: "",
    sort_order: lastTaskKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
