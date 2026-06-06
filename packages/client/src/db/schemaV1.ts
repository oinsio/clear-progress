export const DB_SCHEMA_V1 = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_hidden, is_deleted, sort_order, revision, needsSync, appear_date, original_task_id, updated_at",
  goals: "id, status, is_deleted, sort_order, revision, needsSync, updated_at",
  contexts: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  categories: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  checklist_items:
    "id, task_id, is_deleted, sort_order, revision, needsSync, updated_at",
  ideas: "id, is_deleted, sort_order, revision, needsSync, updated_at",
  settings: "key, needsSync, updated_at",
  covers: "data_hash",
  pending_covers: "data_hash, goal_id",
  sync_meta: "key",
} as const;
