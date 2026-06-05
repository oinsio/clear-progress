/**
 * Normalizes empty values for correct comparison.
 * "" and undefined are considered equal values.
 */
function normalizeValue(value: unknown): unknown {
  if (value === "" || value === undefined || value === null) {
    return "";
  }
  return value;
}

/**
 * Checks whether any significant fields of an entity have changed.
 * Ignores service fields (id, updated_at, created_at, needsSync, revision).
 * Normalizes empty values ("" and undefined are considered equal).
 *
 * @param existing - The existing entity
 * @param updated - The updated entity
 * @param excludeFields - Fields to exclude from comparison
 * @returns true if at least one significant field has changed
 */
export function hasEntityChanged<T extends object>(
  existing: T,
  updated: T,
  excludeFields: string[] = [
    "id",
    "updated_at",
    "created_at",
    "needsSync",
    "revision",
  ],
): boolean {
  const existingKeys = Object.keys(existing);
  const updatedKeys = Object.keys(updated);

  // Get all unique keys from both objects
  const allKeys = new Set([...existingKeys, ...updatedKeys]);

  for (const key of allKeys) {
    // Skip service fields
    if (excludeFields.includes(key)) {
      continue;
    }

    const existingValue = normalizeValue(existing[key as keyof T] as unknown);
    const updatedValue = normalizeValue(updated[key as keyof T] as unknown);

    // Compare normalized values
    if (existingValue !== updatedValue) {
      return true;
    }
  }

  return false;
}
