export const DB_SCHEMA = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, version, updated_at",
  goals: "id, status, is_deleted, sort_order, version, updated_at",
  contexts: "id, is_deleted, sort_order, version, updated_at",
  categories: "id, is_deleted, sort_order, version, updated_at",
  checklist_items: "id, task_id, is_deleted, sort_order, version, updated_at",
  settings: "key, updated_at",
  covers: "file_id, data_hash",
} as const;

export const DB_SCHEMA_V4 = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_deleted, sort_order, version, revision, _dirty, updated_at",
  goals:
    "id, status, is_deleted, sort_order, version, revision, _dirty, updated_at",
  contexts: "id, is_deleted, sort_order, version, revision, _dirty, updated_at",
  categories:
    "id, is_deleted, sort_order, version, revision, _dirty, updated_at",
  checklist_items:
    "id, task_id, is_deleted, sort_order, version, revision, _dirty, updated_at",
  ideas: "id, is_deleted, sort_order, version, revision, _dirty, updated_at",
  settings: "key, _dirty, updated_at",
  covers: "file_id, data_hash",
  pending_covers: "local_id, goal_id, data_hash",
  sync_meta: "key",
} as const;
