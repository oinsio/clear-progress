/**
 * Normalizes sort_order from number to string on a record pulled from the server.
 * The server DB stores sort_order as INTEGER, but the client now uses
 * fractional-indexing string keys. If sort_order is already a string, it is
 * left unchanged.
 *
 * Implements FR1 of fractional-sort-order
 */
export function normalizeSortOrder<T extends { sort_order: number | string }>(
  record: T,
): T & { sort_order: string } {
  if (typeof record.sort_order === "number") {
    return { ...record, sort_order: String(record.sort_order) };
  }
  return record as T & { sort_order: string };
}
