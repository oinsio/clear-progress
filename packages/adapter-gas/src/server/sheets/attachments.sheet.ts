// implements FR6 of add-file-attachments
import {
  coerceSheetBool,
  colMap,
  SHEET_NAMES,
  toISOStringValue,
} from "../helpers/constants";
import type { Attachment } from "../types";
import { deleteRecordsByIds, getAllRecords, upsertRecords } from "./base";

const COLS = colMap(SHEET_NAMES.ATTACHMENTS);

function rowToAttachment(row: unknown[]): Attachment {
  return {
    id: String(row[COLS.id] ?? ""),
    entity_type: String(row[COLS.entity_type] ?? ""),
    entity_id: String(row[COLS.entity_id] ?? ""),
    data_hash: String(row[COLS.data_hash] ?? ""),
    filename: String(row[COLS.filename] ?? ""),
    mime_type: String(row[COLS.mime_type] ?? ""),
    file_size: Number(row[COLS.file_size] ?? 0),
    sort_order: Number(row[COLS.sort_order] ?? 0),
    is_deleted: coerceSheetBool(row[COLS.is_deleted]),
    created_at: toISOStringValue(row[COLS.created_at]),
    updated_at: toISOStringValue(row[COLS.updated_at]),
    revision: Number(row[COLS.revision] ?? 0),
  };
}

export const getAllAttachments = (): Attachment[] =>
  getAllRecords(SHEET_NAMES.ATTACHMENTS, rowToAttachment);

export const getAttachmentsByRevision = (sinceRevision: number): Attachment[] =>
  getAllAttachments().filter(
    (attachment) =>
      attachment.revision === 0 || attachment.revision > sinceRevision,
  );

export const upsertAttachments = (attachments: Attachment[]): void =>
  upsertRecords(SHEET_NAMES.ATTACHMENTS, attachments);

export const deleteAttachmentsByIds = (ids: string[]): number =>
  deleteRecordsByIds(SHEET_NAMES.ATTACHMENTS, ids);

/**
 * Returns all unique data_hash values from non-deleted attachments.
 * Used for ref-counting when deciding whether to delete a file from Drive.
 * Implements FR6 of add-file-attachments
 */
export const getDataHashes = (): string[] =>
  getAllAttachments()
    .filter((attachment) => !attachment.is_deleted)
    .map((attachment) => attachment.data_hash)
    .filter(Boolean);
