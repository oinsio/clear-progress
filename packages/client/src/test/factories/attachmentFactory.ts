import { generateKeyBetween } from "fractional-indexing";
import type { Attachment } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let attachmentCounter = 0;
let lastAttachmentKey: string | null = null;

export function buildAttachment(
  overrides: Partial<Attachment> = {},
): Attachment {
  attachmentCounter += 1;
  lastAttachmentKey = generateKeyBetween(lastAttachmentKey, null);
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    entity_type: "task",
    entity_id: crypto.randomUUID(),
    data_hash: `test-hash-${attachmentCounter}`,
    filename: "test-file.pdf",
    mime_type: "application/pdf",
    file_size: 1024,
    sort_order: lastAttachmentKey,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
