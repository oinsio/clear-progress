import { describe, it, expect } from 'vitest';
import { normalizeToSheetDate, isDateOnlyColumn, SHEET_NAMES } from '../../src/helpers/constants';

describe('normalizeToSheetDate', () => {
  it('should convert ISO date string to prefixed format', () => {
    expect(normalizeToSheetDate('2026-04-20')).toBe("'2026-04-20");
  });

  it('should convert Date object to prefixed ISO date', () => {
    const date = new Date('2026-04-20T00:00:00Z');
    expect(normalizeToSheetDate(date)).toBe("'2026-04-20");
  });

  it('should return empty string for empty string input', () => {
    expect(normalizeToSheetDate('')).toBe('');
  });

  it('should return empty string for null', () => {
    expect(normalizeToSheetDate(null)).toBe('');
  });

  it('should return empty string for undefined', () => {
    expect(normalizeToSheetDate(undefined)).toBe('');
  });

  it('should preserve already prefixed date', () => {
    expect(normalizeToSheetDate("'2026-04-20")).toBe("'2026-04-20");
  });

  it('should extract date from ISO timestamp', () => {
    expect(normalizeToSheetDate('2026-04-20T10:30:00.000Z')).toBe("'2026-04-20");
  });

  it('should convert Date object at midnight UTC to prefixed ISO date', () => {
    const date = new Date('2026-04-20T00:00:00Z');
    expect(normalizeToSheetDate(date)).toBe("'2026-04-20");
  });

  it('should return empty string for unparseable string', () => {
    expect(normalizeToSheetDate('not-a-date')).toBe('');
  });

  it('should return empty string for invalid Date object', () => {
    const invalidDate = new Date('invalid');
    expect(normalizeToSheetDate(invalidDate)).toBe('');
  });

  it('should reject malformed ISO date with wrong year length', () => {
    expect(normalizeToSheetDate('26-04-20')).not.toBe("'26-04-20");
  });

  it('should reject malformed ISO date with wrong month length', () => {
    expect(normalizeToSheetDate('2026-4-20')).not.toBe("'2026-4-20");
  });

  it('should reject malformed ISO date with wrong day length', () => {
    expect(normalizeToSheetDate('2026-04-2')).not.toBe("'2026-04-2");
  });

  it('should handle ISO timestamp without milliseconds', () => {
    expect(normalizeToSheetDate('2026-04-20T10:30:00Z')).toBe("'2026-04-20");
  });

  it('should handle ISO timestamp with timezone offset', () => {
    expect(normalizeToSheetDate('2026-04-20T10:30:00+03:00')).toBe("'2026-04-20");
  });

  it('should return empty string for non-date string', () => {
    expect(normalizeToSheetDate('hello world')).toBe('');
  });

  it('should return empty string for numeric string that is not a date', () => {
    expect(normalizeToSheetDate('12345')).not.toBe("'12345");
  });

  it('should handle parseable date string that is not ISO format', () => {
    // "April 20, 2026" is parseable by Date constructor
    const result = normalizeToSheetDate('April 20, 2026');
    // Result depends on timezone, but should be a validly prefixed date
    expect(result).toMatch(/^'\d{4}-\d{2}-\d{2}$/);
    expect(result.startsWith("'")).toBe(true);
  });

  it('should handle timestamp and return only date part', () => {
    const result = normalizeToSheetDate('2026-04-20T15:30:45.123Z');
    expect(result).toBe("'2026-04-20");
    expect(result).not.toContain('T');
    expect(result).not.toContain('15:30');
  });

  it('should validate ISO date format strictly', () => {
    // Valid ISO date should pass
    expect(normalizeToSheetDate('2026-04-20')).toBe("'2026-04-20");
    // Invalid formats should not pass the regex check
    expect(normalizeToSheetDate('2026-4-20')).not.toBe("'2026-4-20");
    expect(normalizeToSheetDate('2026-04-2')).not.toBe("'2026-04-2");
  });
});

describe('isDateOnlyColumn', () => {
  it('should return true for next_date in Tasks', () => {
    expect(isDateOnlyColumn(SHEET_NAMES.TASKS, 'next_date')).toBe(true);
  });

  it('should return true for appear_date in Tasks', () => {
    expect(isDateOnlyColumn(SHEET_NAMES.TASKS, 'appear_date')).toBe(true);
  });

  it('should return false for created_at in Tasks', () => {
    expect(isDateOnlyColumn(SHEET_NAMES.TASKS, 'created_at')).toBe(false);
  });

  it('should return false for any column in Goals', () => {
    expect(isDateOnlyColumn(SHEET_NAMES.GOALS, 'name')).toBe(false);
  });

  it('should return false for unknown sheet', () => {
    expect(isDateOnlyColumn('Unknown', 'next_date')).toBe(false);
  });
});
