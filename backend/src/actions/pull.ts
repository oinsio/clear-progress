import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';
import { getTasksByRevision } from '../sheets/tasks.sheet';
import { getGoalsByRevision } from '../sheets/goals.sheet';
import { getContextsByRevision } from '../sheets/contexts.sheet';
import { getCategoriesByRevision } from '../sheets/categories.sheet';
import { getChecklistItemsByRevision } from '../sheets/checklists.sheet';
import { getIdeasByRevision } from '../sheets/ideas.sheet';
import { getAllSettings } from '../sheets/settings.sheet';
import { readNextRevision } from '../sheets/meta.sheet';

export function pull({ since_revision }: { since_revision?: number }): GoogleAppsScript.Content.TextOutput {
  const sinceRevision = since_revision ?? 0;
  try {
    const currentRevision = readNextRevision() - 1;
    return jsonOk({
      data: {
        tasks: getTasksByRevision(sinceRevision),
        goals: getGoalsByRevision(sinceRevision),
        contexts: getContextsByRevision(sinceRevision),
        categories: getCategoriesByRevision(sinceRevision),
        checklist_items: getChecklistItemsByRevision(sinceRevision),
        ideas: getIdeasByRevision(sinceRevision),
      },
      settings: getAllSettings(),
      current_revision: currentRevision,
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
