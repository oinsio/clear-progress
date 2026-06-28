/**
 * Branded type for ISO 8601 timestamps with timezone (e.g., "2026-04-16T14:30:00.000Z").
 * Used for created_at, updated_at, completed_at fields.
 */
export type ISOTimestamp = string & { readonly __brand: "ISOTimestamp" };

/**
 * Branded type for ISO 8601 date-only strings (e.g., "2026-04-16").
 * Used for next_date, appear_date fields.
 */
export type ISODate = string & { readonly __brand: "ISODate" };

// Client entities (Wire types + syncStatus field)
export type {
  ClientAttachment as Attachment,
  ClientCategory as Category,
  ClientChecklistItem as ChecklistItem,
  ClientContext as Context,
  ClientGoal as Goal,
  ClientIdea as Idea,
  ClientSetting as Setting,
  ClientTask as Task,
} from "@/schemas/entities";

// Entities without Wire equivalents
export interface SyncMeta {
  key: string;
  value: number;
}

// implements FR5, FR6 of content-addressable-covers
// renamed CoverRecord -> FileRecord as part of D1 (add-file-attachments)
export interface FileRecord {
  data_hash: string;
  data?: Blob;
}

// implements FR5, FR6 of content-addressable-covers
// renamed PendingCoverRecord -> PendingFileRecord as part of D1 (add-file-attachments)
export interface PendingFileRecord {
  goal_id: string;
  data: Blob;
  filename: string;
  mime_type: string;
  data_hash: string;
  created_at: ISOTimestamp;
}
