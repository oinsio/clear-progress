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
  files: "data_hash",
  pending_files: "data_hash",
  attachments:
    "id, [entity_type+entity_id], data_hash, is_deleted, sort_order, revision, needsSync, updated_at",
  sync_meta: "key",
} as const;

// implements FR6 of fix-push-poison-pill
export const DB_SCHEMA_V2 = {
  tasks:
    "id, box, goal_id, context_id, category_id, is_completed, is_hidden, is_deleted, sort_order, revision, syncStatus, appear_date, original_task_id, updated_at",
  goals: "id, status, is_deleted, sort_order, revision, syncStatus, updated_at",
  contexts: "id, is_deleted, sort_order, revision, syncStatus, updated_at",
  categories: "id, is_deleted, sort_order, revision, syncStatus, updated_at",
  checklist_items:
    "id, task_id, is_deleted, sort_order, revision, syncStatus, updated_at",
  ideas: "id, is_deleted, sort_order, revision, syncStatus, updated_at",
  settings: "key, syncStatus, updated_at",
  files: "data_hash",
  pending_files: "data_hash",
  attachments:
    "id, [entity_type+entity_id], data_hash, is_deleted, sort_order, revision, syncStatus, updated_at",
  sync_meta: "key",
} as const;

/** @deprecated Use DB_SCHEMA_V2 instead */
export const DB_SCHEMA = DB_SCHEMA_V1;
