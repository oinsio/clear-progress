import {
  ERROR_CODES,
  jsonError,
  jsonNotInitialized,
  jsonOk,
} from "../helpers/response";
import { getCategoriesByRevision } from "../sheets/categories.sheet";
import { getChecklistItemsByRevision } from "../sheets/checklists.sheet";
import { getContextsByRevision } from "../sheets/contexts.sheet";
import { getGoalsByRevision } from "../sheets/goals.sheet";
import { getIdeasByRevision } from "../sheets/ideas.sheet";
import { readNextRevision, readPurgeRevision } from "../sheets/meta.sheet";
import {
  getAllSettings,
  getSettingsChangedSince,
} from "../sheets/settings.sheet";
import { getTasksByRevision } from "../sheets/tasks.sheet";

export function pull({
  since_revision,
  settings_updated_at,
}: {
  since_revision?: number;
  settings_updated_at?: string;
}): GoogleAppsScript.Content.TextOutput {
  const sinceRevision = since_revision ?? 0;
  try {
    const currentRevision = readNextRevision() - 1;
    const purgeRevision = readPurgeRevision();

    return jsonOk({
      data: {
        tasks: getTasksByRevision(sinceRevision),
        goals: getGoalsByRevision(sinceRevision),
        contexts: getContextsByRevision(sinceRevision),
        categories: getCategoriesByRevision(sinceRevision),
        checklist_items: getChecklistItemsByRevision(sinceRevision),
        ideas: getIdeasByRevision(sinceRevision),
      },
      settings: settings_updated_at
        ? getSettingsChangedSince(settings_updated_at)
        : getAllSettings(),
      current_revision: currentRevision,
      purge_revision: purgeRevision,
      // Backend uses Date because GAS doesn't support Temporal API.
      // This is safe: new Date().toISOString() returns valid ISO 8601 with Z suffix.
      // Server time is controlled by Google infrastructure (reliable).
      server_time: new Date().toISOString(),
    });
  } catch (e) {
    const err = e as Error;
    if (err.message === ERROR_CODES.NOT_INITIALIZED) {
      return jsonNotInitialized();
    }
    return jsonError(ERROR_CODES.INTERNAL_ERROR, err.message);
  }
}
