// implements U3, FR4, NFR-REL1 of fix-stale-sync-overwrites

export interface RebalancePullResponse {
  ok: boolean;
  tasks: Array<{
    id: string;
    name: string;
    description: string;
    box: string;
    sort_order: string;
    is_deleted: boolean;
    updated_at: string;
  }>;
  current_revision: number;
}

/**
 * Builds a full push payload carrying a single "inbox" task with an explicit
 * `sort_order`, so tests can pre-seed keys near/at the rebalance threshold
 * without going through the app's own key-generation logic.
 */
export function buildInboxTaskPayload(options: {
  id: string;
  name: string;
  sortOrder: string;
  updatedAt: string;
}): Record<string, unknown[]> {
  return {
    tasks: [
      {
        id: options.id,
        name: options.name,
        description: "",
        box: "inbox",
        is_completed: false,
        is_deleted: false,
        completed_at: "",
        next_date: "",
        appear_date: "",
        context_id: "",
        category_id: "",
        goal_id: "",
        repeat_rule: "",
        is_hidden: false,
        original_task_id: "",
        sort_order: options.sortOrder,
        created_at: options.updatedAt,
        updated_at: options.updatedAt,
        version: 1,
        revision: 0,
      },
    ],
    goals: [],
    ideas: [],
    contexts: [],
    categories: [],
    checklist_items: [],
    attachments: [],
    settings: [],
  };
}
