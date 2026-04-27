import type { PushResultStatus } from "./common";
import type {
  Category,
  ChecklistItem,
  Context,
  Goal,
  Idea,
  Setting,
  Task,
} from "./entities";

export interface PullRequest {
  action: "pull";
  since_revision: number;
  settings_updated_at?: string;
}

export interface PullResponseData {
  tasks: Task[];
  goals: Goal[];
  contexts: Context[];
  categories: Category[];
  checklist_items: ChecklistItem[];
  ideas: Idea[];
}

export interface PullResponse {
  ok: boolean;
  data: PullResponseData;
  settings: Setting[];
  current_revision: number;
  purge_revision: number;
  server_time: string;
}

export interface PushChanges {
  tasks?: Task[];
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  checklist_items?: ChecklistItem[];
  ideas?: Idea[];
  settings?: Setting[];
}

export interface PushRequest {
  action: "push";
  changes: PushChanges;
}

export interface PushItemResult {
  id: string;
  status: PushResultStatus;
  server_record?: Task | Goal | Context | Category | Idea | ChecklistItem;
  reason?: string;
}

export interface PushResponseData {
  tasks?: PushItemResult[];
  goals?: PushItemResult[];
  contexts?: PushItemResult[];
  categories?: PushItemResult[];
  checklist_items?: PushItemResult[];
  ideas?: PushItemResult[];
  settings?: PushItemResult[];
}

export interface PushResponse {
  ok: boolean;
  revision?: number;
  results: PushResponseData;
  server_time: string;
}

export interface PingResponse {
  ok: boolean;
  app: string;
  version: string;
  initialized: boolean;
}

export interface InitResponse {
  ok: boolean;
}

export interface UploadCoverResponse {
  ok: boolean;
  file_id: string;
  reused: boolean;
}

export interface UploadCoverBatchItem {
  local_id: string;
  goal_id: string;
  filename: string;
  mime_type: string;
  data: string; // base64
}

export interface UploadCoverBatchResult {
  local_id: string;
  goal_id: string;
  file_id?: string;
  reused?: boolean;
  error?: string;
}

export interface UploadCoversResponse {
  ok: boolean;
  results: UploadCoverBatchResult[];
}

export interface GetCoverResult {
  file_id: string;
  mime_type?: string;
  data?: string;
  error?: string;
}

export interface GetCoversResponse {
  ok: boolean;
  covers: GetCoverResult[];
}

export interface DeleteCoverResponse {
  ok: boolean;
  deleted: boolean;
  ref_count: number;
}

export interface PurgeResponse {
  ok: boolean;
  purged: {
    tasks: number;
    goals: number;
    contexts: number;
    categories: number;
    checklist_items: number;
    ideas: number;
  };
  purge_revision: number;
}
