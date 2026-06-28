import type { AttachmentRepository } from "@/db/repositories/AttachmentRepository";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { Temporal } from "@/lib/temporal";
import {
  compareSortKeys,
  generateAppendKey,
  needsRebalancing,
  rebalanceKeys,
} from "@/services/SortOrderService";
import type { Idea } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export class IdeaService {
  constructor(
    private readonly ideaRepository: IdeaRepository,
    private readonly attachmentRepository?: AttachmentRepository,
  ) {}

  async getAll(): Promise<Idea[]> {
    const ideas = await this.ideaRepository.getActive();
    return ideas.sort((ideaA, ideaB) =>
      compareSortKeys(String(ideaA.sort_order), String(ideaB.sort_order)),
    );
  }

  async getById(id: string): Promise<Idea | undefined> {
    return this.ideaRepository.getById(id);
  }

  async create(partialIdea: Pick<Idea, "name"> & Partial<Idea>): Promise<Idea> {
    const existingIdeas = await this.ideaRepository.getActive();
    const existingKeys = existingIdeas.map((idea) => String(idea.sort_order));
    const now = toISOTimestamp();
    const idea: Idea = {
      sort_order: generateAppendKey(existingKeys),
      ...partialIdea,
      id: crypto.randomUUID(),
      description: partialIdea.description ?? "",
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      syncStatus: "pending" as const,
    };
    await this.ideaRepository.create(idea);
    return idea;
  }

  async update(id: string, changes: Partial<Idea>): Promise<Idea> {
    const existingIdea = await this.ideaRepository.getById(id);
    if (!existingIdea) {
      throw new Error(`Idea not found: ${id}`);
    }

    // Build the updated version without modifying metadata
    const candidateIdea: Idea = {
      ...existingIdea,
      ...changes,
      id,
    };

    // Check whether anything actually changed
    const hasChanged = hasEntityChanged(existingIdea, candidateIdea);

    // Apply metadata only if there are changes
    const updatedIdea: Idea = {
      ...candidateIdea,
      updated_at: hasChanged ? toISOTimestamp() : existingIdea.updated_at,
      syncStatus: hasChanged ? ("pending" as const) : ("synced" as const),
    };

    await this.ideaRepository.update(updatedIdea);
    return updatedIdea;
  }

  /** Implements FR14 of add-file-attachments */
  async softDelete(id: string): Promise<Idea> {
    if (this.attachmentRepository) {
      await this.attachmentRepository.softDeleteByEntityTypeAndId("idea", id);
    }
    return this.update(id, { is_deleted: true });
  }

  /** Implements FR15 of add-file-attachments */
  async restore(id: string): Promise<Idea> {
    if (this.attachmentRepository) {
      await this.attachmentRepository.restoreByEntityTypeAndId("idea", id);
    }
    return this.update(id, { is_deleted: false });
  }

  async searchByName(query: string): Promise<Idea[]> {
    const allIdeas = await this.ideaRepository.getActive();
    const lowerQuery = query.toLowerCase();
    return allIdeas
      .filter(
        (idea) =>
          idea.name.toLowerCase().includes(lowerQuery) ||
          idea.description.toLowerCase().includes(lowerQuery),
      )
      .sort((ideaA, ideaB) =>
        Temporal.Instant.compare(
          Temporal.Instant.from(ideaB.updated_at),
          Temporal.Instant.from(ideaA.updated_at),
        ),
      );
  }

  async reorderIdeas(ideaId: string, newSortOrder: string): Promise<void> {
    const idea = await this.ideaRepository.getById(ideaId);
    if (!idea) throw new Error(`Idea not found: ${ideaId}`);

    const now = toISOTimestamp();
    await this.ideaRepository.update({
      ...idea,
      sort_order: newSortOrder,
      updated_at: now,
      syncStatus: "pending" as const,
    });

    if (needsRebalancing(newSortOrder)) {
      await this.rebalanceAllIdeas();
    }
  }

  private async rebalanceAllIdeas(): Promise<void> {
    const ideas = await this.ideaRepository.getActive();
    const sorted = ideas.sort((ideaA, ideaB) =>
      compareSortKeys(String(ideaA.sort_order), String(ideaB.sort_order)),
    );
    const newKeys = rebalanceKeys(sorted.length);
    const now = toISOTimestamp();
    const rebalancedIdeas = sorted.map((idea, index) => ({
      ...idea,
      sort_order: newKeys[index],
      updated_at: now,
      syncStatus: "pending" as const,
    }));
    await this.ideaRepository.bulkUpsert(rebalancedIdeas);
  }
}
