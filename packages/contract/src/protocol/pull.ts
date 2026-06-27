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

/** Composite cursor for a single entity table — implements FR8 of fix-pull-pagination */
export interface TableCursor {
  /** Revision of the last record on the previous page. */
  revision: number;
  /** UUID id of the last record on the previous page (tiebreaker). */
  last_id: string;
}

export interface PullRequest {
  since_revision: number;
  settings_updated_at?: string;
  /** Per-table composite cursors for resuming pagination — implements FR8 of fix-pull-pagination */
  cursors?: Record<string, TableCursor>;
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
  /** Per-table composite cursors for truncated tables — implements FR4 of fix-pull-pagination */
  cursors?: Record<string, TableCursor>;
}
