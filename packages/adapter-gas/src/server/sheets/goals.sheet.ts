import {
  coerceSheetBool,
  coerceSheetGoalStatus,
  colMap,
  SHEET_NAMES,
  toISOStringValue,
} from "../helpers/constants";
import type { Goal } from "../types";
import { deleteRecordsByIds, getAllRecords, upsertRecords } from "./base";

const COLS = colMap(SHEET_NAMES.GOALS);

function rowToGoal(row: unknown[]): Goal {
  return {
    id: String(row[COLS.id] ?? ""),
    name: String(row[COLS.name] ?? ""),
    description: String(row[COLS.description] ?? ""),
    cover_hash: String(row[COLS.cover_hash] ?? ""),
    status: coerceSheetGoalStatus(row[COLS.status]),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: toISOStringValue(row[COLS.created_at]),
    updated_at: toISOStringValue(row[COLS.updated_at]),
    revision: Number(row[COLS.revision] ?? 0),
  };
}

export const getAllGoals = (): Goal[] =>
  getAllRecords(SHEET_NAMES.GOALS, rowToGoal);
export const getGoalsByRevision = (sinceRevision: number): Goal[] =>
  getAllGoals().filter(
    (goal) => goal.revision === 0 || goal.revision > sinceRevision,
  );
export const upsertGoals = (goals: Goal[]): void =>
  upsertRecords(SHEET_NAMES.GOALS, goals);
export const deleteGoalsByIds = (ids: string[]): number =>
  deleteRecordsByIds(SHEET_NAMES.GOALS, ids);
export const getCoverHashes = (): string[] =>
  getAllGoals()
    .map((goal) => goal.cover_hash)
    .filter(Boolean);
