// implements U3, FR7, M4 of add-composite-tenant-pk
// Push-payload builders for cross-tenant FK-ownership integration tests.
// Every builder returns a full payload with all top-level entity keys present
// (empty arrays for unused ones), as required by the push Edge Function.

/** Options for a task push record (only cross-tenant-relevant fields vary). */
export interface TaskPayloadOptions {
  id: string;
  name: string;
  goalId?: string;
  contextId?: string;
  categoryId?: string;
}

function emptyPayload(): Record<string, unknown[]> {
  return {
    tasks: [],
    goals: [],
    ideas: [],
    contexts: [],
    categories: [],
    checklist_items: [],
    attachments: [],
    settings: [],
  };
}

/** Builds a full push payload carrying a single goal record. */
export function buildGoalPayload(
  id: string,
  name: string,
): Record<string, unknown[]> {
  const now = new Date().toISOString();
  return {
    ...emptyPayload(),
    goals: [
      {
        id,
        name,
        description: "",
        status: "planning",
        cover_hash: "",
        sort_order: "0",
        is_deleted: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
  };
}

/** Builds a full push payload carrying a single context record. */
export function buildContextPayload(
  id: string,
  name: string,
): Record<string, unknown[]> {
  const now = new Date().toISOString();
  return {
    ...emptyPayload(),
    contexts: [
      {
        id,
        name,
        sort_order: "0",
        is_deleted: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
  };
}

/** Builds a full push payload carrying a single category record. */
export function buildCategoryPayload(
  id: string,
  name: string,
): Record<string, unknown[]> {
  const now = new Date().toISOString();
  return {
    ...emptyPayload(),
    categories: [
      {
        id,
        name,
        sort_order: "0",
        is_deleted: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
  };
}

/** Builds a full push payload carrying a single task record. */
export function buildTaskPayload(
  options: TaskPayloadOptions,
): Record<string, unknown[]> {
  const now = new Date().toISOString();
  return {
    ...emptyPayload(),
    tasks: [
      {
        id: options.id,
        name: options.name,
        description: "",
        box: "inbox",
        is_completed: false,
        is_deleted: false,
        completed_at: "",
        next_date: "",
        appear_date: "",
        context_id: options.contextId ?? "",
        category_id: options.categoryId ?? "",
        goal_id: options.goalId ?? "",
        repeat_rule: "",
        is_hidden: false,
        original_task_id: "",
        sort_order: "0",
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
  };
}

/** Builds a full push payload carrying a single checklist_items record. */
export function buildChecklistPayload(
  id: string,
  taskId: string,
  name: string,
): Record<string, unknown[]> {
  const now = new Date().toISOString();
  return {
    ...emptyPayload(),
    checklist_items: [
      {
        id,
        task_id: taskId,
        name,
        is_completed: false,
        sort_order: "0",
        is_deleted: false,
        created_at: now,
        updated_at: now,
        version: 1,
        revision: 0,
      },
    ],
  };
}
