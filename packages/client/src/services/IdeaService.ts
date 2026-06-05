import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { Temporal } from "@/lib/temporal";
import type { Idea } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export class IdeaService {
  constructor(private readonly ideaRepository: IdeaRepository) {}

  async getAll(): Promise<Idea[]> {
    const ideas = await this.ideaRepository.getActive();
    return ideas.sort((ideaA, ideaB) => ideaA.sort_order - ideaB.sort_order);
  }

  async getById(id: string): Promise<Idea | undefined> {
    return this.ideaRepository.getById(id);
  }

  async create(partialIdea: Pick<Idea, "name"> & Partial<Idea>): Promise<Idea> {
    const existingIdeas = await this.ideaRepository.getActive();
    const now = toISOTimestamp();
    const idea: Idea = {
      sort_order: existingIdeas.length,
      ...partialIdea,
      id: crypto.randomUUID(),
      description: partialIdea.description ?? "",
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      needsSync: true,
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
      needsSync: hasChanged,
    };

    await this.ideaRepository.update(updatedIdea);
    return updatedIdea;
  }

  async softDelete(id: string): Promise<Idea> {
    return this.update(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Idea> {
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

  async reorderIdeas(orderedIdeas: Idea[]): Promise<void> {
    if (orderedIdeas.length === 0) return;

    // Check if at least one sort_order has changed
    const hasAnyOrderChanged = orderedIdeas.some(
      (idea, index) => idea.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Nothing changed, skip sync
    }

    const now = toISOTimestamp();
    const updatedIdeas = orderedIdeas.map((idea, index) => {
      const orderChanged = idea.sort_order !== index;
      return {
        ...idea,
        sort_order: index,
        updated_at: orderChanged ? now : idea.updated_at,
        needsSync: orderChanged,
      };
    });
    await this.ideaRepository.bulkUpsert(updatedIdeas);
  }
}
