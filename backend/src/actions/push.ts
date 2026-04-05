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
type UpsertFn = (records: AnyEntity[]) => void;

type EntityBatch = {
  key: string;
  data: AnyEntity[] | undefined;
  getAll: () => AnyEntity[];
  upsert: UpsertFn;
};

function hasWrittenResults(results: PushItemResult[]): boolean {
  return results.some(r => r.status === PUSH_STATUSES.CREATED || r.status === PUSH_STATUSES.ACCEPTED);
}

function getEntityLabel(entity: AnyEntity): string {
  return 'title' in entity ? entity.title : entity.name;
}

function isInvalidOptionalFk(value: string): boolean {
  return value !== '' && !isValidUuid(value);
}

function getInvalidForeignKeyReason(record: AnyEntity): string | null {
  if ('task_id' in record) {
    if (!isValidUuid(record.task_id)) {
      return ERROR_MESSAGES.INVALID_REQUIRED_FK;
    }
  }
  if ('goal_id' in record) {
    if (isInvalidOptionalFk(record.goal_id) || isInvalidOptionalFk(record.context_id) || isInvalidOptionalFk(record.category_id)) {
      return ERROR_MESSAGES.INVALID_OPTIONAL_FK;
    }
  }
  return null;
}

function processRecords<T extends AnyEntity>(
  incoming: T[],
  existing: T[],
  batchUpsertFn: (records: T[]) => void,
  pushRevision: number,
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

    if (!serverRecord) {
      recordsToUpsert.push({ ...record, revision: pushRevision });
      return { id: record.id, status: PUSH_STATUSES.CREATED, version: record.version };
    }

    const resolution = resolveConflict(record.updated_at, serverRecord.updated_at);
    if (resolution === CONFLICT_RESOLUTION.ACCEPT) {
      const updatedVersion = serverRecord.version + 1;
      recordsToUpsert.push({ ...record, version: updatedVersion, revision: pushRevision });
      return { id: record.id, status: PUSH_STATUSES.ACCEPTED, version: updatedVersion };
    }

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
    let pushRevision: number | undefined = undefined;
    let hasAcceptedOrCreated = false;

    const entityBatches: EntityBatch[] = [
      { key: 'tasks', data: changes.tasks, getAll: getAllTasks, upsert: upsertTasks as UpsertFn },
      { key: 'goals', data: changes.goals, getAll: getAllGoals, upsert: upsertGoals as UpsertFn },
      { key: 'contexts', data: changes.contexts, getAll: getAllContexts, upsert: upsertContexts as UpsertFn },
      { key: 'categories', data: changes.categories, getAll: getAllCategories, upsert: upsertCategories as UpsertFn },
      { key: 'checklist_items', data: changes.checklist_items, getAll: getAllChecklistItems, upsert: upsertChecklistItems as UpsertFn },
    ];

    const hasPushableChanges = entityBatches.some(({ data }) => (data?.length ?? 0) > 0);
    if (hasPushableChanges) {
      pushRevision = readNextRevision();
    }

    for (const { key, data, getAll, upsert } of entityBatches) {
      if (data?.length) {
        const entityResults = processRecords(data, getAll(), upsert, pushRevision ?? 0);
        results[key] = entityResults;
        hasAcceptedOrCreated = hasAcceptedOrCreated || hasWrittenResults(entityResults);
      }
    }
    if (changes.settings?.length) {
      const serverByKey = new Map(getAllSettings().map(s => [s.key, s]));
      const settingsToUpsert: typeof changes.settings = [];
      results.settings = changes.settings.map(clientSetting => {
        const serverSetting = serverByKey.get(clientSetting.key);
        const isClientNewer = !serverSetting || clientSetting.updated_at >= serverSetting.updated_at;
        if (isClientNewer) {
          settingsToUpsert.push(clientSetting);
          return { id: clientSetting.key, status: PUSH_STATUSES.ACCEPTED };
        }
        return { id: clientSetting.key, status: PUSH_STATUSES.CONFLICT };
      });
      upsertSettings(settingsToUpsert);
    }

    if (hasAcceptedOrCreated) {
      saveNextRevision((pushRevision ?? 0) + 1);
    }

    return jsonOk({
      ...(hasAcceptedOrCreated ? { revision: pushRevision } : {}),
      results,
      server_time: new Date().toISOString(),
    });
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
