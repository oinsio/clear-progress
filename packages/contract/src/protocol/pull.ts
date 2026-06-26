import type {
  WireAttachment,
  WireCategory,
  WireChecklistItem,
  WireContext,
  WireGoal,
  WireIdea,
  WireSetting,
  WireTask,
} from "../domain";

export interface PullRequest {
  since_revision: number;
  settings_updated_at?: string;
}

export interface PullResponse {
  ok: boolean;
  tasks: WireTask[];
  goals: WireGoal[];
  contexts: WireContext[];
  categories: WireCategory[];
  ideas: WireIdea[];
  checklist_items: WireChecklistItem[];
  attachments: WireAttachment[]; // implements FR6 of add-file-attachments
  settings: WireSetting[];
  current_revision: number;
  purge_revision: number;
  server_time: string;
  has_more: boolean; // implements FR4 of fix-pull-pagination
}
