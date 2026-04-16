import type { Box, GoalStatus } from "./common";

/**
 * Branded type for ISO 8601 timestamps with timezone (e.g., "2026-04-16T14:30:00.000Z").
 * Used for created_at, updated_at, completed_at fields.
 */
export type ISOTimestamp = string & { readonly __brand: "ISOTimestamp" };

/**
 * Branded type for ISO 8601 date-only strings (e.g., "2026-04-16").
 * Used for next_date, appear_date fields.
 */
export type ISODate = string & { readonly __brand: "ISODate" };

export interface Task {
  id: string;
  name: string;
  description: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: ISOTimestamp | "";
  repeat_rule: string;
  is_hidden: boolean;
  next_date: ISODate | "";
  appear_date: ISODate | "";
  original_task_id: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: number;
  revision: number;
  needsSync: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  cover_file_id: string;
  status: GoalStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: number;
  revision: number;
  needsSync: boolean;
}

interface NamedEntity {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: number;
  revision: number;
  needsSync: boolean;
  [key: string]: unknown;
}

export type Context = NamedEntity;

export type Category = NamedEntity;

export interface Idea extends NamedEntity {
  description: string;
}

export interface ChecklistItem {
  id: string;
  task_id: string;
  name: string;
  is_completed: boolean;
  sort_order: number;
  is_deleted: boolean;
  created_at: ISOTimestamp;
  updated_at: ISOTimestamp;
  version: number;
  revision: number;
  needsSync: boolean;
}

export interface SyncMeta {
  key: string;
  value: number;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: ISOTimestamp;
  needsSync: boolean;
}

export interface CoverRecord {
  file_id: string;
  data_hash: string;
  data?: Blob;
}

export interface PendingCoverRecord {
  local_id: string;
  goal_id: string;
  data: Blob;
  filename: string;
  mime_type: string;
  data_hash: string;
  created_at: ISOTimestamp;
}
