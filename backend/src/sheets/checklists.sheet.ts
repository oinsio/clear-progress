import { SHEET_NAMES, coerceSheetBool, colMap } from '../helpers/constants';
import { getAllRecords, upsertRecords, deleteRecordsByIds } from './base';
import type { ChecklistItem } from '../types';

const COLS = colMap(SHEET_NAMES.CHECKLIST_ITEMS);

function rowToItem(row: unknown[]): ChecklistItem {
  return {
    id: String(row[COLS.id] ?? ''),
    task_id: String(row[COLS.task_id] ?? ''),
    name: String(row[COLS.name] ?? ''),
    is_completed: coerceSheetBool(row[COLS.is_completed]),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: String(row[COLS.created_at] ?? ''),
    updated_at: String(row[COLS.updated_at] ?? ''),
    version: Number(row[COLS.version] ?? 1),
    revision: Number(row[COLS.revision] ?? 0),
  };
}

export const getAllChecklistItems = (): ChecklistItem[] => getAllRecords(SHEET_NAMES.CHECKLIST_ITEMS, rowToItem);
export const getChecklistItemsByRevision = (sinceRevision: number): ChecklistItem[] =>
  getAllChecklistItems().filter(item => item.revision === 0 || item.revision > sinceRevision);
export const upsertChecklistItems = (items: ChecklistItem[]): void => upsertRecords(SHEET_NAMES.CHECKLIST_ITEMS, items);
export const deleteChecklistItemsByIds = (ids: string[]): number => deleteRecordsByIds(SHEET_NAMES.CHECKLIST_ITEMS, ids);
