// implements FR14 of add-supabase-adapter
// implements FR5 of add-file-attachments
// Row-to-wire serializers: map raw DB rows to protocol wire types

import { serializeDateOnly, serializeTimestamptz } from "./datetime.ts";

type DbRow = Record<string, unknown>;

export function serializeTaskRow(row: DbRow) {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    box: row.box as string,
    goal_id: (row.goal_id as string) ?? "",
    context_id: (row.context_id as string) ?? "",
    category_id: (row.category_id as string) ?? "",
    is_completed: row.is_completed as boolean,
    completed_at: serializeTimestamptz(row.completed_at),
    repeat_rule: row.repeat_rule ? JSON.stringify(row.repeat_rule) : "",
    is_hidden: row.is_hidden as boolean,
    next_date: serializeDateOnly(row.next_date),
    appear_date: serializeDateOnly(row.appear_date),
    original_task_id: (row.original_task_id as string) ?? "",
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeGoalRow(row: DbRow) {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    cover_hash: (row.cover_hash as string) ?? "",
    status: row.status as string,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeIdeaRow(row: DbRow) {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeContextRow(row: DbRow) {
  return {
    id: row.id as string,
    name: row.name as string,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeCategoryRow(row: DbRow) {
  return {
    id: row.id as string,
    name: row.name as string,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeChecklistItemRow(row: DbRow) {
  return {
    id: row.id as string,
    task_id: row.task_id as string,
    name: row.name as string,
    is_completed: row.is_completed as boolean,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

/** Implements FR5 of add-file-attachments */
export function serializeAttachmentRow(row: DbRow) {
  return {
    id: row.id as string,
    entity_type: row.entity_type as string,
    entity_id: row.entity_id as string,
    data_hash: row.data_hash as string,
    filename: row.filename as string,
    mime_type: row.mime_type as string,
    file_size: row.file_size as number,
    sort_order: row.sort_order as string,
    is_deleted: row.is_deleted as boolean,
    created_at: serializeTimestamptz(row.created_at),
    updated_at: serializeTimestamptz(row.updated_at),
    revision: row.revision as number,
  };
}

export function serializeSettingRow(row: DbRow) {
  return {
    key: row.key as string,
    value: row.value as string,
    updated_at: serializeTimestamptz(row.updated_at),
  };
}
