import { SHEET_NAMES, SHEET_HEADERS, colMap, DEFAULT_SETTINGS, toISOStringValue } from '../helpers/constants';
import { getSheet } from './client';
import type { Setting } from '../types';

const SET_COLS = colMap(SHEET_NAMES.SETTINGS);

// Backend uses Date because GAS doesn't support Temporal API.
// This is safe: new Date().toISOString() returns valid ISO 8601 with Z suffix.
// Server time is controlled by Google infrastructure (reliable).
const DEFAULTS: Setting[] = [
  { ...DEFAULT_SETTINGS.DEFAULT_BOX, updated_at: new Date().toISOString() },
  { ...DEFAULT_SETTINGS.ACCENT_COLOR, updated_at: new Date().toISOString() },
];

function settingToRow(setting: Setting): unknown[] {
  return SHEET_HEADERS[SHEET_NAMES.SETTINGS].map(col => (setting as unknown as Record<string, unknown>)[col]);
}

export function getAllSettings(): Setting[] {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  return data.slice(1).filter((row: unknown[]) => row[0]).map((row: unknown[]) => ({
    key: String(row[SET_COLS.key]),
    value: String(row[SET_COLS.value] ?? ''),
    updated_at: toISOStringValue(row[SET_COLS.updated_at]),
  }));
}

export function getSettingsChangedSince(since: string): Setting[] {
  // Пустая строка — вернуть все settings (обратная совместимость)
  if (!since) return getAllSettings();
  // Используем числовое сравнение через Date.getTime() вместо строкового,
  // т.к. Temporal.Instant.toString() и Date.toISOString() могут давать
  // разное количество десятичных знаков (0 vs 3), что ломает лексикографическое сравнение.
  const sinceMs = new Date(since).getTime();
  return getAllSettings().filter(
    (setting) => new Date(setting.updated_at).getTime() > sinceMs
  );
}

export function upsertSetting(setting: Setting): void {
  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][SET_COLS.key] === setting.key) {
      sheet.getRange(i + 1, 1, 1, SHEET_HEADERS[SHEET_NAMES.SETTINGS].length).setValues([settingToRow(setting)]);
      return;
    }
  }
  sheet.appendRow(settingToRow(setting));
}

export function upsertSettings(settings: Setting[]): void {
  if (settings.length === 0) return;

  const sheet = getSheet(SHEET_NAMES.SETTINGS);
  const data = sheet.getDataRange().getValues();
  const numCols = SHEET_HEADERS[SHEET_NAMES.SETTINGS].length;

  const keyToRowIndex = new Map<string, number>();
  for (let i = 1; i < data.length; i++) {
    if (data[i][SET_COLS.key]) keyToRowIndex.set(String(data[i][SET_COLS.key]), i);
  }

  const updatedRows = data.map(row => [...row] as unknown[]);
  const newRows: unknown[][] = [];
  let hasUpdates = false;

  for (const setting of settings) {
    const row = settingToRow(setting);
    const existingIndex = keyToRowIndex.get(setting.key);
    if (existingIndex !== undefined) {
      updatedRows[existingIndex] = row;
      hasUpdates = true;
    } else {
      newRows.push(row);
    }
  }

  if (hasUpdates) {
    sheet.getRange(1, 1, updatedRows.length, numCols).setValues(updatedRows);
  }

  for (const newRow of newRows) {
    sheet.appendRow(newRow);
  }
}

export function initDefaults(): void {
  const existingKeys = getAllSettings().map(s => s.key);
  DEFAULTS.forEach(def => {
    if (!existingKeys.includes(def.key)) upsertSetting(def);
  });
}
