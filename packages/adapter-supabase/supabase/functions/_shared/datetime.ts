// implements FR14 of add-supabase-adapter
// Datetime serialization: TIMESTAMPTZ → ISO 8601 Z, DATE → YYYY-MM-DD

/**
 * Normalizes a TIMESTAMPTZ value from PostgreSQL to ISO 8601 with Z suffix.
 * Handles: null, empty string, "+00:00" suffix, or already-correct "Z" suffix.
 * Returns empty string ("") for null/undefined/empty inputs.
 */
export function serializeTimestamptz(value: string | null | undefined): string {
  if (!value) return "";

  // Already has Z suffix — ensure milliseconds are present
  if (value.endsWith("Z")) {
    return ensureMilliseconds(value);
  }

  // Replace +00:00 or +0000 offset with Z
  const normalized = value.replace(/\+00:?00$/, "Z").replace(/ /, "T");
  return ensureMilliseconds(normalized);
}

/**
 * Normalizes a DATE value from PostgreSQL to YYYY-MM-DD format.
 * Returns empty string ("") for null/undefined/empty inputs.
 */
export function serializeDateOnly(value: string | null | undefined): string {
  if (!value) return "";
  // PostgreSQL DATE comes as "YYYY-MM-DD" — take only the date part
  return value.slice(0, 10);
}

/**
 * Ensures a timestamp string has exactly 3 fractional digits (millisecond precision).
 * PostgreSQL strips trailing zeros from fractional seconds (e.g. .100 → .1),
 * so we must normalize to exactly 3 digits to match ISOTimestampSchema.
 */
function ensureMilliseconds(isoString: string): string {
  // Already has fractional seconds — normalize to exactly 3 digits
  const fractionalMatch = isoString.match(/\.(\d+)Z$/);
  if (fractionalMatch) {
    const normalized = fractionalMatch[1].padEnd(3, "0").slice(0, 3);
    return isoString.replace(/\.\d+Z$/, `.${normalized}Z`);
  }
  // Has seconds but no fraction: "...T10:30:00Z"
  if (/:\d{2}Z$/.test(isoString)) {
    return isoString.replace(/Z$/, ".000Z");
  }
  return isoString;
}
