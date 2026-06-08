/** Implements FR7 of add-file-attachments — client-side dynamic ref-counting */
import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import type { LocalFileRefCounter } from "./FileService";

export class DexieLocalFileRefCounter implements LocalFileRefCounter {
  constructor(
    private readonly goalRepository: GoalRepository,
    private readonly attachmentRepository: AttachmentRepository,
  ) {}

  async countLocalRefs(dataHash: string): Promise<number> {
    const [goals, attachments] = await Promise.all([
      this.goalRepository.getAll(),
      this.attachmentRepository.getByHash(dataHash),
    ]);

    const goalRefs = goals.filter(
      (goal) => goal.cover_hash === dataHash && !goal.is_deleted,
    ).length;

    const attachmentRefs = attachments.filter(
      (attachment) => !attachment.is_deleted,
    ).length;

    return goalRefs + attachmentRefs;
  }
}
