import {
  generateKeyBetween as fractionalGenerateKeyBetween,
  generateNKeysBetween,
} from "fractional-indexing";
import { SORT_ORDER_REBALANCE_THRESHOLD } from "@/constants";

/**
 * Checks whether a key is a valid fractional-indexing key.
 * Filters out legacy numeric sort_order values (e.g., "0", "1", "2")
 * that were converted to strings during the migration period.
 */
function isValidFractionalKey(key: string): boolean {
  return key.length > 0 && /^[a-zA-Z]/.test(key);
}

/**
 * Generates a sort key above the current maximum of existing keys.
 * Used for inserting at the top (DESC sort) or appending (ASC sort).
 * Filters out invalid legacy numeric keys during migration period.
 */
export function generateTopKey(existingKeys: string[]): string {
  const validKeys = existingKeys.filter(isValidFractionalKey);

  if (validKeys.length === 0) {
    return fractionalGenerateKeyBetween(null, null);
  }

  const maxKey = validKeys.reduce((maximum, current) =>
    current > maximum ? current : maximum,
  );

  return fractionalGenerateKeyBetween(maxKey, null);
}

/**
 * Alias for generateTopKey. Both generate a key above the max;
 * the sort direction determines whether it appears at "top" or "end".
 */
export const generateAppendKey = generateTopKey;

/**
 * Generates a sort key between two neighboring keys.
 * Pass null for lower to insert before upper, or null for upper to insert after lower.
 */
export function generateKeyBetween(
  lower: string | null,
  upper: string | null,
): string {
  return fractionalGenerateKeyBetween(lower, upper);
}

/**
 * Generates N evenly distributed sort keys spanning the full key space.
 * Used when rebalancing all items in a list.
 */
export function rebalanceKeys(count: number): string[] {
  return generateNKeysBetween(null, null, count);
}

/**
 * Checks whether a key exceeds the length threshold,
 * indicating the list should be rebalanced.
 */
export function needsRebalancing(key: string): boolean {
  return key.length > SORT_ORDER_REBALANCE_THRESHOLD;
}

/**
 * Comparator for sorting entities by their sort_order key in ascending order.
 * Compatible with Array.prototype.sort.
 */
export function compareSortKeys(keyA: string, keyB: string): number {
  if (keyA < keyB) return -1;
  if (keyA > keyB) return 1;
  return 0;
}
