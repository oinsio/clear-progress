import type { Box, GoalStatus } from "./common";

export interface Task {
  id: string;
  name: string;
  description: string;
  box: Box;
  goal_id: string;
  context_id: string;
  category_id: string;
  is_completed: boolean;
  completed_at: string;
  repeat_rule: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
  _dirty: boolean;
}

export interface Goal {
  id: string;
  name: string;
  description: string;
  cover_file_id: string;
  status: GoalStatus;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
  _dirty: boolean;
}

interface NamedEntity {
  id: string;
  name: string;
  sort_order: number;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
  _dirty: boolean;
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
  created_at: string;
  updated_at: string;
  version: number;
  revision: number;
  _dirty: boolean;
}

export interface SyncMeta {
  key: string;
  value: number;
}

export interface Setting {
  key: string;
  value: string;
  updated_at: string;
  _dirty: boolean;
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
  created_at: string;
}
