import { PUSH_STATUSES, CONFLICT_RESOLUTION, ERROR_MESSAGES, VALID_BOXES, isBlankString, isValidUuid, LOCK_TIMEOUT_MS } from '../helpers/constants';
import { jsonOk, jsonError, jsonNotInitialized, ERROR_CODES } from '../helpers/response';
import { resolveConflict } from '../helpers/conflict';
import { getAllTasks, upsertTasks } from '../sheets/tasks.sheet';
import { getAllGoals, upsertGoals } from '../sheets/goals.sheet';
import { getAllContexts, upsertContexts } from '../sheets/contexts.sheet';
import { getAllCategories, upsertCategories } from '../sheets/categories.sheet';
import { getAllChecklistItems, upsertChecklistItems } from '../sheets/checklists.sheet';
import { getAllSettings, upsertSettings } from '../sheets/settings.sheet';
import { readNextRevision, saveNextRevision } from '../sheets/meta.sheet';
import type { Task, Goal, Context, Category, ChecklistItem, Setting, PushItemResult } from '../types';

type AnyEntity = Task | Goal | Context | Category | ChecklistItem;

function getEntityLabel(entity: AnyEntity): string {
  return 'title' in entity ? entity.title : entity.name;
}

function getInvalidForeignKeyReason(record: AnyEntity): string | null {
  if ('task_id' in record) {
    if (!isValidUuid(record.task_id)) {
      return ERROR_MESSAGES.INVALID_REQUIRED_FK;
    }
  }
  if ('goal_id' in record) {
    if (record.goal_id !== '' && !isValidUuid(record.goal_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
    if (record.context_id !== '' && !isValidUuid(record.context_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
    if (record.category_id !== '' && !isValidUuid(record.category_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
  }
  return null;
}

function processRecords<T extends AnyEntity>(
  incoming: T[],
  existing: T[],
  batchUpsertFn: (records: T[]) => void,
  nextRevisionRef: { value: number },
): PushItemResult[] {
  const recordsToUpsert: T[] = [];

  const results = incoming.map(record => {
    if (!isValidUuid(record.id)) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.INVALID_ID };
    }

    if (isBlankString(getEntityLabel(record))) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.BLANK_TITLE };
    }

    if ('box' in record && !VALID_BOXES.includes(record.box)) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: ERROR_MESSAGES.INVALID_BOX };
    }

    const fkError = getInvalidForeignKeyReason(record);
    if (fkError) {
      return { id: record.id, status: PUSH_STATUSES.REJECTED, reason: fkError };
    }

    const serverRecord = existing.find(e => e.id === record.id);
    const assignedRevision = nextRevisionRef.value++;

    if (!serverRecord) {
      recordsToUpsert.push({ ...record, revision: assignedRevision });
      return { id: record.id, status: PUSH_STATUSES.CREATED, version: record.version, revision: assignedRevision };
    }

    const resolution = resolveConflict(record.updated_at, serverRecord.updated_at);
    if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
      const updatedVersion = serverRecord.version + 1;
      recordsToUpsert.push({ ...record, version: updatedVersion, revision: assignedRevision });
      return { id: record.id, status: PUSH_STATUSES.ACCEPTED, version: updatedVersion, revision: assignedRevision };
    }

    nextRevisionRef.value--;
    return { id: record.id, status: PUSH_STATUSES.CONFLICT, server_record: serverRecord };
  });

  batchUpsertFn(recordsToUpsert);
  return results;
}

export function push(changes: {
  tasks?: Task[];
  goals?: Goal[];
  contexts?: Context[];
  categories?: Category[];
  checklist_items?: ChecklistItem[];
  settings?: Setting[];
}): GoogleAppsScript.Content.TextOutput {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(LOCK_TIMEOUT_MS)) {
    return jsonError('SYNC_LOCK_TIMEOUT', 'Could not acquire sync lock');
  }

  try {
    const results: Record<string, PushItemResult[]> = {};
    const nextRevisionRef = { value: 0 };
    let hasAcceptedOrCreated = false;

    const hasPushableChanges =
      (changes.tasks?.length ?? 0) > 0 ||
      (changes.goals?.length ?? 0) > 0 ||
      (changes.contexts?.length ?? 0) > 0 ||
      (changes.categories?.length ?? 0) > 0 ||
      (changes.checklist_items?.length ?? 0) > 0;

    if (hasPushableChanges) {
      nextRevisionRef.value = readNextRevision();
    }

    if (changes.tasks?.length) {
      results.tasks = processRecords(changes.tasks, getAllTasks(), upsertTasks, nextRevisionRef);
      hasAcceptedOrCreated = hasAcceptedOrCreated || results.tasks.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
    }
    if (changes.goals?.length) {
      results.goals = processRecords(changes.goals, getAllGoals(), upsertGoals, nextRevisionRef);
      hasAcceptedOrCreated = hasAcceptedOrCreated || results.goals.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
    }
    if (changes.contexts?.length) {
      results.contexts = processRecords(changes.contexts, getAllContexts(), upsertContexts, nextRevisionRef);
      hasAcceptedOrCreated = hasAcceptedOrCreated || results.contexts.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
    }
    if (changes.categories?.length) {
      results.categories = processRecords(changes.categories, getAllCategories(), upsertCategories, nextRevisionRef);
      hasAcceptedOrCreated = hasAcceptedOrCreated || results.categories.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
    }
    if (changes.checklist_items?.length) {
      results.checklist_items = processRecords(changes.checklist_items, getAllChecklistItems(), upsertChecklistItems, nextRevisionRef);
      hasAcceptedOrCreated = hasAcceptedOrCreated || results.checklist_items.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
    }
    if (changes.settings?.length) {
      const serverSettings = getAllSettings();
      const settingsToUpsert: typeof changes.settings = [];
      results.settings = changes.settings.map(clientSetting => {
        const serverSetting = serverSettings.find(s => s.key === clientSetting.key);
        const resolution = serverSetting
          ? resolveConflict(clientSetting.updated_at, serverSetting.updated_at)
          : CONFLICT_RESOLUTION.ACCEPT;

        if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
          settingsToUpsert.push(clientSetting);
          return { id: clientSetting.key, status: PUSH_STATUSES.ACCEPTED };
        }

        return { id: clientSetting.key, status: PUSH_STATUSES.CONFLICT };
      });
      upsertSettings(settingsToUpsert);
    }

    if (hasAcceptedOrCreated) {
      saveNextRevision(nextRevisionRef.value);
    }

    return jsonOk({ results, server_time: new Date().toISOString() });
  } catch (e) {
    const err = e as Error;
    if (err.message === ERROR_CODES.NOT_INITIALIZED) {
      return jsonNotInitialized();
    }
    return jsonError(ERROR_CODES.INTERNAL_ERROR, err.message);
  } finally {
    lock.releaseLock();
  }
}
