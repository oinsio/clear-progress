import type {
  WireAttachment,
  WireCategory,
  WireChecklistItem,
  WireContext,
  WireGoal,
  WireIdea,
  WireTask,
} from "../../src";

function nowISOString(): string {
  return new Date().toISOString();
}

export function createWireTask(overrides: Partial<WireTask> = {}): WireTask {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test task",
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
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireGoal(overrides: Partial<WireGoal> = {}): WireGoal {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test goal",
    description: "",
    cover_hash: "",
    status: "planning",
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireContext(
  overrides: Partial<WireContext> = {},
): WireContext {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test context",
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireCategory(
  overrides: Partial<WireCategory> = {},
): WireCategory {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test category",
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireIdea(overrides: Partial<WireIdea> = {}): WireIdea {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    name: "Test idea",
    description: "",
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireChecklistItem(
  overrides: Partial<WireChecklistItem> = {},
): WireChecklistItem {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    task_id: crypto.randomUUID(),
    name: "Test checklist item",
    is_completed: false,
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}

export function createWireAttachment(
  overrides: Partial<WireAttachment> = {},
): WireAttachment {
  const now = nowISOString();
  return {
    id: crypto.randomUUID(),
    entity_type: "goal",
    entity_id: crypto.randomUUID(),
    data_hash: `hash-${crypto.randomUUID().slice(0, 8)}`,
    filename: "attachment.jpg",
    mime_type: "image/jpeg",
    file_size: 1024,
    sort_order: "0",
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    ...overrides,
  };
}
