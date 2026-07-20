/** Implements FR5 of add-file-attachments */
import type { EntityType, WireAttachment } from "@clear-progress/contract";
import { ClientAttachmentSchema } from "@/schemas/entities";
import type { Attachment, ISOTimestamp } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { db } from "../database";
import { shouldOverwritePendingLocalRecord } from "./applyServerRecordLww";

const ATTACHMENT_ENTITY_NAME = "attachment";

export class AttachmentRepository {
  async getAll(): Promise<Attachment[]> {
    return db.attachments.toArray();
  }

  async getById(id: string): Promise<Attachment | undefined> {
    return db.attachments.get(id);
  }

  async update(attachment: Attachment): Promise<void> {
    this.validateAttachment(attachment, "before IndexedDB write");
    await db.attachments.put(attachment);
  }

  async getByEntityTypeAndId(
    entityType: EntityType,
    entityId: string,
  ): Promise<Attachment[]> {
    return db.attachments
      .where("[entity_type+entity_id]")
      .equals([entityType, entityId])
      .filter((attachment) => !attachment.is_deleted)
      .sortBy("sort_order");
  }

  async getAllByEntityTypeAndId(
    entityType: EntityType,
    entityId: string,
  ): Promise<Attachment[]> {
    return db.attachments
      .where("[entity_type+entity_id]")
      .equals([entityType, entityId])
      .sortBy("sort_order");
  }

  async getByHash(dataHash: string): Promise<Attachment[]> {
    return db.attachments.where("data_hash").equals(dataHash).toArray();
  }

  async save(attachment: Attachment): Promise<void> {
    this.validateAttachment(attachment, "before IndexedDB write");
    await db.attachments.put(attachment);
  }

  async delete(id: string): Promise<void> {
    const attachment = await db.attachments.get(id);
    if (!attachment) {
      return;
    }
    await db.attachments.update(id, {
      is_deleted: true,
      syncStatus: "pending" as const,
    });
  }

  async bulkUpsert(attachments: Attachment[]): Promise<void> {
    for (const attachment of attachments) {
      this.validateAttachment(attachment, "in bulk operation");
    }
    await db.attachments.bulkPut(attachments);
  }

  async getNeedingSync(): Promise<Attachment[]> {
    return db.attachments
      .filter((attachment) => attachment.syncStatus === "pending")
      .toArray();
  }

  /** Implements FR14 of add-file-attachments */
  async softDeleteByEntityTypeAndId(
    entityType: EntityType,
    entityId: string,
  ): Promise<number> {
    const attachments = await this.getByEntityTypeAndId(entityType, entityId);
    if (attachments.length === 0) return 0;
    const now = toISOTimestamp();
    for (const attachment of attachments) {
      await db.attachments.update(attachment.id, {
        is_deleted: true,
        syncStatus: "pending" as const,
        updated_at: now,
      });
    }
    return attachments.length;
  }

  /** Implements FR14 of add-file-attachments */
  async restoreByEntityTypeAndId(
    entityType: EntityType,
    entityId: string,
  ): Promise<number> {
    const allAttachments = await this.getAllByEntityTypeAndId(
      entityType,
      entityId,
    );
    const deletedAttachments = allAttachments.filter(
      (attachment) => attachment.is_deleted,
    );
    if (deletedAttachments.length === 0) return 0;
    const now = toISOTimestamp();
    for (const attachment of deletedAttachments) {
      await db.attachments.update(attachment.id, {
        is_deleted: false,
        syncStatus: "pending" as const,
        updated_at: now,
      });
    }
    return deletedAttachments.length;
  }

  private validateAttachment(attachment: Attachment, context: string): void {
    const result = ClientAttachmentSchema.safeParse(attachment);
    if (!result.success) {
      console.error(`Invalid attachment ${context}:`, result.error);
      throw new Error(`Invalid attachment data: ${result.error.message}`);
    }
  }

  /**
   * Implements FR5 of fix-stale-sync-overwrites.
   * A local `pending` record is overwritten only when the server record's
   * `updated_at` is strictly newer (LWW pull protection). Local records with
   * any other syncStatus, or no local record at all, are always overwritten.
   */
  async applyServerRecords(records: WireAttachment[]): Promise<void> {
    await db.transaction("rw", db.attachments, async () => {
      for (const serverRecord of records) {
        const localRecord = await db.attachments.get(serverRecord.id);
        const shouldWrite =
          localRecord?.syncStatus !== "pending" ||
          shouldOverwritePendingLocalRecord({
            entityName: ATTACHMENT_ENTITY_NAME,
            id: serverRecord.id,
            localUpdatedAt: localRecord.updated_at,
            serverUpdatedAt: serverRecord.updated_at,
          });

        if (shouldWrite) {
          const attachment: Attachment = {
            ...serverRecord,
            created_at: serverRecord.created_at as ISOTimestamp,
            updated_at: serverRecord.updated_at as ISOTimestamp,
            syncStatus: "synced" as const,
          };
          await db.attachments.put(attachment);
        }
      }
    });
  }
}
