/** Implements FR5, FR8, FR13 of add-file-attachments */
import type { EntityType } from "@clear-progress/contract";
import { MAX_ATTACHMENT_SIZE_BYTES } from "@/constants";
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import { generateAppendKey } from "@/services/SortOrderService";
import type { Attachment } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import type { FileService } from "./FileService";

export class AttachmentService {
  constructor(
    private readonly attachmentRepository: AttachmentRepository,
    private readonly fileService: FileService,
  ) {}

  /** Implements FR8 of add-file-attachments */
  async attachFile(
    file: File,
    entityType: EntityType,
    entityId: string,
  ): Promise<Attachment> {
    const { data_hash: dataHash } = await this.fileService.uploadFile(
      file,
      "",
      MAX_ATTACHMENT_SIZE_BYTES,
    );

    const existingAttachments =
      await this.attachmentRepository.getByEntityTypeAndId(
        entityType,
        entityId,
      );
    const existingKeys = existingAttachments.map((attachment) =>
      String(attachment.sort_order),
    );
    const sortOrder = generateAppendKey(existingKeys);

    const now = toISOTimestamp();
    const attachment: Attachment = {
      id: crypto.randomUUID(),
      entity_type: entityType,
      entity_id: entityId,
      data_hash: dataHash,
      filename: file.name,
      mime_type: file.type,
      file_size: file.size,
      sort_order: sortOrder,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      needsSync: true,
    };

    await this.attachmentRepository.save(attachment);

    return attachment;
  }

  /** Implements FR13, FR18 of add-file-attachments */
  async deleteAttachment(attachmentId: string): Promise<void> {
    const attachment = await this.attachmentRepository.getById(attachmentId);
    await this.attachmentRepository.delete(attachmentId);
    if (attachment) {
      await this.fileService.deleteFile(attachment.data_hash, "");
    }
  }

  /** Implements FR5 of add-file-attachments */
  async getAttachments(
    entityType: EntityType,
    entityId: string,
  ): Promise<Attachment[]> {
    return this.attachmentRepository.getByEntityTypeAndId(entityType, entityId);
  }
}
