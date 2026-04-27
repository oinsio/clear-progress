import type {
  WireTask,
  WireGoal,
  WireContext,
  WireCategory,
  WireIdea,
  WireChecklistItem,
  WireSetting,
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
  settings: WireSetting[];
  current_revision: number;
  purge_revision: number;
  server_time: string;
}
