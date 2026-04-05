import type { Idea } from "@/types/entities";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";

export class IdeaService {
  constructor(private readonly ideaRepository: IdeaRepository) {}

  async getAll(): Promise<Idea[]> {
    const ideas = await this.ideaRepository.getActive();
    return ideas.sort((ideaA, ideaB) => ideaA.sort_order - ideaB.sort_order);
  }

  async getById(id: string): Promise<Idea | undefined> {
    return this.ideaRepository.getById(id);
  }

  async create(
    partialIdea: Pick<Idea, "name"> & Partial<Idea>,
  ): Promise<Idea> {
    const now = new Date().toISOString();
    const idea: Idea = {
      sort_order: 0,
      ...partialIdea,
      id: crypto.randomUUID(),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      _dirty: true,
    };
    await this.ideaRepository.create(idea);
    return idea;
  }

  async update(id: string, changes: Partial<Idea>): Promise<Idea> {
    const existingIdea = await this.ideaRepository.getById(id);
    if (!existingIdea) {
      throw new Error(`Idea not found: ${id}`);
    }
    const updatedIdea: Idea = {
      ...existingIdea,
      ...changes,
      id,
      updated_at: new Date().toISOString(),
      version: existingIdea.version + 1,
      _dirty: true,
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

  async reorderIdeas(orderedIdeas: Idea[]): Promise<void> {
    if (orderedIdeas.length === 0) return;
    const now = new Date().toISOString();
    const updatedIdeas = orderedIdeas.map((idea, index) => ({
      ...idea,
      sort_order: index,
      updated_at: now,
      version: idea.version + 1,
      _dirty: true,
    }));
    await this.ideaRepository.bulkUpsert(updatedIdeas);
  }
}
