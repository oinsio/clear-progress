import type { Attachment } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";

let attachmentCounter = 0;

export function buildAttachment(
  overrides: Partial<Attachment> = {},
): Attachment {
  attachmentCounter += 1;
  const now = toISOTimestamp();
  return {
    id: crypto.randomUUID(),
    entity_type: "task",
    entity_id: crypto.randomUUID(),
    data_hash: `test-hash-${attachmentCounter}`,
    filename: "test-file.pdf",
    mime_type: "application/pdf",
    file_size: 1024,
    sort_order: 0,
    is_deleted: false,
    created_at: now,
    updated_at: now,
    revision: 0,
    needsSync: false,
    ...overrides,
  };
}
