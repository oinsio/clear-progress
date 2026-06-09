import type { Transaction } from "dexie";
import { generateNKeysBetween } from "fractional-indexing";

interface SortOrderRecord {
  id: string;
  sort_order: number | string;
}

interface ConvertedRecord {
  id: string;
  sort_order: string;
}

const TASK_TABLE = "tasks";
const NON_TASK_ENTITY_TABLES = [
  "goals",
  "ideas",
  "contexts",
  "categories",
  "checklist_items",
  "attachments",
] as const;

/**
 * Shared implementation for converting integer sort_orders to fractional-indexing keys.
 * When reverseOrder is true, lowest integer gets highest string key (for tasks).
 * When reverseOrder is false, lowest integer gets lowest string key (for entities).
 */
function convertSortOrders(
  records: SortOrderRecord[],
  reverseOrder: boolean,
): ConvertedRecord[] {
  if (records.length === 0) {
    return [];
  }

  const alreadyConverted = records.filter(
    (record) => typeof record.sort_order === "string",
  );
  const needsConversion = records.filter(
    (record) => typeof record.sort_order !== "string",
  );

  if (needsConversion.length === 0) {
    return records.map((record) => ({
      id: record.id,
      sort_order: record.sort_order as string,
    }));
  }

  const sortedByIntegerAsc = [...needsConversion].sort(
    (first, second) =>
      (first.sort_order as number) - (second.sort_order as number),
  );

  const keys = generateNKeysBetween(null, null, sortedByIntegerAsc.length);

  const convertedRecords = sortedByIntegerAsc.map((record, index) => ({
    id: record.id,
    sort_order: reverseOrder
      ? keys[sortedByIntegerAsc.length - 1 - index]
      : keys[index],
  }));

  const unchangedRecords = alreadyConverted.map((record) => ({
    id: record.id,
    sort_order: record.sort_order as string,
  }));

  return [...convertedRecords, ...unchangedRecords];
}

/**
 * Converts task integer sort_orders to fractional-indexing string keys.
 * Reverses order: lowest integer (displayed first in old ASC sort)
 * gets the HIGHEST string key (displayed first in new DESC sort).
 *
 * Already-string sort_orders are left unchanged (idempotent).
 *
 * Implements FR1 of fractional-sort-order
 */
export function convertTaskSortOrders(
  tasks: SortOrderRecord[],
): ConvertedRecord[] {
  return convertSortOrders(tasks, true);
}

/**
 * Converts non-task entity integer sort_orders to fractional-indexing string keys.
 * Preserves ascending order: item with the lowest integer gets lowest string key.
 *
 * Already-string sort_orders are left unchanged (idempotent).
 *
 * Implements FR1 of fractional-sort-order
 */
export function convertEntitySortOrders(
  entities: SortOrderRecord[],
): ConvertedRecord[] {
  return convertSortOrders(entities, false);
}

/**
 * Dexie upgrade handler: converts integer sort_order values
 * to fractional-indexing string keys for all entity tables.
 *
 * Implements FR1 of fractional-sort-order
 */
export async function upgradeSortOrderToFractional(
  transaction: Transaction,
): Promise<void> {
  const tasks = await transaction.table(TASK_TABLE).toArray();
  const convertedTasks = convertTaskSortOrders(tasks);
  await transaction.table(TASK_TABLE).bulkPut(
    convertedTasks.map((converted) => {
      const originalTask = tasks.find((task) => task.id === converted.id);
      if (!originalTask) return converted;
      return { ...originalTask, sort_order: converted.sort_order };
    }),
  );

  for (const tableName of NON_TASK_ENTITY_TABLES) {
    const entities = await transaction.table(tableName).toArray();
    const convertedEntities = convertEntitySortOrders(entities);
    await transaction.table(tableName).bulkPut(
      convertedEntities.map((converted) => {
        const originalEntity = entities.find(
          (entity) => entity.id === converted.id,
        );
        if (!originalEntity) return converted;
        return { ...originalEntity, sort_order: converted.sort_order };
      }),
    );
  }
}
