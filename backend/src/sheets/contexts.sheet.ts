import { colMap, SHEET_NAMES } from "../helpers/constants";
import type { Context } from "../types";
import {
  deleteRecordsByIds,
  getAllRecords,
  rowToNamedEntity,
  upsertRecords,
} from "./base";

const COLS = colMap(SHEET_NAMES.CONTEXTS);

const rowToContext = (row: unknown[]): Context => rowToNamedEntity(row, COLS);

export const getAllContexts = (): Context[] =>
  getAllRecords(SHEET_NAMES.CONTEXTS, rowToContext);
export const getContextsByRevision = (sinceRevision: number): Context[] =>
  getAllContexts().filter(
    (ctx) => ctx.revision === 0 || ctx.revision > sinceRevision,
  );
export const upsertContexts = (contexts: Context[]): void =>
  upsertRecords(SHEET_NAMES.CONTEXTS, contexts);
export const deleteContextsByIds = (ids: string[]): number =>
  deleteRecordsByIds(SHEET_NAMES.CONTEXTS, ids);
