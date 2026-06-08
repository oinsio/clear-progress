// implements FR17 of add-file-attachments
import {
  buildFolderQuery,
  DRIVE_QUERY_FIELDS,
  ERROR_MESSAGES,
  PROPERTY_KEYS,
} from "../helpers/constants";
import { ERROR_CODES, jsonError, jsonOk } from "../helpers/response";
import {
  deleteAttachmentsByIds,
  getAllAttachments,
  getDataHashes,
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
import {
  deleteGoalsByIds,
  getAllGoals,
  getCoverHashes,
} from "../sheets/goals.sheet";
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

    const files = trashOrphanedFiles();

    return jsonOk({
      purged: {
        tasks,
        goals,
        contexts,
        categories,
        checklist_items,
        ideas,
        attachments,
        files,
      },
      purge_revision: newPurgeRevision,
    });
  } catch (e) {
    return jsonError(ERROR_CODES.INTERNAL_ERROR, String(e));
  }
}

function trashOrphanedFiles(): number {
  const filesFolderId = PropertiesService.getScriptProperties().getProperty(
    PROPERTY_KEYS.FILES_FOLDER_ID,
  );

  if (!filesFolderId) return 0;

  const response = Drive.Files.list({
    q: buildFolderQuery(filesFolderId),
    fields: DRIVE_QUERY_FIELDS.FOLDER_FILES,
  });

  const driveFiles = response.files ?? [];
  if (driveFiles.length === 0) return 0;

  const referencedHashes = new Set([...getCoverHashes(), ...getDataHashes()]);

  const orphanedFiles = driveFiles.filter(
    (file) => !referencedHashes.has(file.description ?? ""),
  );

  for (const file of orphanedFiles) {
    if (file.id) {
      Drive.Files.update({ trashed: true }, file.id);
    }
  }

  return orphanedFiles.length;
}
