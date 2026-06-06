import type {
  PushResultStatus,
  WireAttachment,
  WireCategory,
  WireChecklistItem,
  WireContext,
  WireGoal,
  WireIdea,
  WireSetting,
  WireTask,
} from "../domain";

export interface PushRequest {
  tasks?: WireTask[];
  goals?: WireGoal[];
  contexts?: WireContext[];
  categories?: WireCategory[];
  ideas?: WireIdea[];
  checklist_items?: WireChecklistItem[];
  attachments?: WireAttachment[]; // implements FR6 of add-file-attachments
  settings?: WireSetting[];
}

export interface PushItemResult {
  id: string;
  status: PushResultStatus;
  server_record?:
    | WireTask
    | WireGoal
    | WireContext
    | WireCategory
    | WireIdea
    | WireChecklistItem
    | WireAttachment;
  reason?: string;
}

export interface PushSettingResult {
  key: string;
  status: PushResultStatus;
  server_record?: WireSetting;
  reason?: string;
}

export interface PushResponse {
  ok: boolean;
  revision?: number;
  results: {
    tasks?: PushItemResult[];
    goals?: PushItemResult[];
    contexts?: PushItemResult[];
    categories?: PushItemResult[];
    ideas?: PushItemResult[];
    checklist_items?: PushItemResult[];
    attachments?: PushItemResult[];
    settings?: PushSettingResult[];
  };
  server_time: string;
  error?: string;
}
