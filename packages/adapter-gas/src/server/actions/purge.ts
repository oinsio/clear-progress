import { ERROR_MESSAGES } from "../helpers/constants";
import { ERROR_CODES, jsonError, jsonOk } from "../helpers/response";
import {
  deleteAttachmentsByIds,
  getAllAttachments,
} from "../sheets/attachments.sheet";
import {
  deleteCategoriesByIds,
  getAllCategories,
} from "../sheets/categories.sheet";
import {
  deleteChecklistItemsByIds,
  getAllChecklistItems,
} from "../sheets/checklists.sheet";
import { deleteContextsByIds, getAllContexts } from "../sheets/contexts.sheet";
import { deleteGoalsByIds, getAllGoals } from "../sheets/goals.sheet";
import { deleteIdeasByIds, getAllIdeas } from "../sheets/ideas.sheet";
import { readPurgeRevision, savePurgeRevision } from "../sheets/meta.sheet";
import { deleteTasksByIds, getAllTasks } from "../sheets/tasks.sheet";

export function purge(payload: {
  confirm?: unknown;
}): GoogleAppsScript.Content.TextOutput {
  if (payload?.confirm !== true) {
    return jsonError(
      ERROR_CODES.INVALID_PAYLOAD,
      ERROR_MESSAGES.PURGE_CONFIRM_REQUIRED,
    );
  }

  try {
    const getDeletedIds = <T extends { id: string; is_deleted: boolean }>(
      entities: T[],
    ): string[] =>
      entities.filter((entity) => entity.is_deleted).map((entity) => entity.id);

    const tasks = deleteTasksByIds(getDeletedIds(getAllTasks()));
    const goals = deleteGoalsByIds(getDeletedIds(getAllGoals()));
    const contexts = deleteContextsByIds(getDeletedIds(getAllContexts()));
    const categories = deleteCategoriesByIds(getDeletedIds(getAllCategories()));
    const checklist_items = deleteChecklistItemsByIds(
      getDeletedIds(getAllChecklistItems()),
    );
    const ideas = deleteIdeasByIds(getDeletedIds(getAllIdeas()));
    const attachments = deleteAttachmentsByIds(
      getDeletedIds(getAllAttachments()),
    );

    // Increment purge_revision
    const currentPurgeRevision = readPurgeRevision();
    const newPurgeRevision = currentPurgeRevision + 1;
    savePurgeRevision(newPurgeRevision);

    return jsonOk({
      purged: {
        tasks,
        goals,
        contexts,
        categories,
        checklist_items,
        ideas,
        attachments,
      },
      purge_revision: newPurgeRevision,
    });
  } catch (e) {
    return jsonError(ERROR_CODES.INTERNAL_ERROR, String(e));
  }
}
