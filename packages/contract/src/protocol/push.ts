import type { PushResultStatus } from "../domain";
import type {
  WireTask,
  WireGoal,
  WireContext,
  WireCategory,
  WireIdea,
  WireChecklistItem,
  WireSetting,
} from "../domain";

export interface PushRequest {
  tasks?: WireTask[];
  goals?: WireGoal[];
  contexts?: WireContext[];
  categories?: WireCategory[];
  ideas?: WireIdea[];
  checklist_items?: WireChecklistItem[];
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
    | WireChecklistItem;
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
    settings?: PushSettingResult[];
  };
  server_time: string;
}
