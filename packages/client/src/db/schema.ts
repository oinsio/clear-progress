export const DB_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, updated_at",
  goals: "id, status, is_deleted, sort_order, updated_at",
  contexts: "id, is_deleted, sort_order, updated_at",
  categories: "id, is_deleted, sort_order, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, updated_at",
  settings: "key, updated_at",
  covers: "file_id, data_hash",
} as const;

export const DB_SCHEMA_V4 = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_hidden, is_deleted, sort_order, revision, needsSync, appear_date, original_task_id, updated_at",
  goals: "id, status, is_deleted, sort_order, revision, needsSync, updated_at",
  contexts: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  categories: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  checklist_items:
    "id, task_id, is_deleted, sort_order, revision, needsSync, updated_at",
  ideas: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  settings: "key, needsSync, updated_at",
  covers: "file_id, data_hash",
  pending_covers: "local_id, goal_id, data_hash",
  sync_meta: "key",
} as const;
