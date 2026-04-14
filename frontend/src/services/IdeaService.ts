import type { Idea } from "@/types/entities";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
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
    const now = new Date().toISOString();
    const idea: Idea = {
      sort_order: existingIdeas.length,
      ...partialIdea,
      id: crypto.randomUUID(),
      description: partialIdea.description ?? "",
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
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

    // Создаем обновленную версию без изменения метаданных
    const candidateIdea: Idea = {
      ...existingIdea,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingIdea, candidateIdea);

    // Применяем метаданные только если есть изменения
    const updatedIdea: Idea = {
      ...candidateIdea,
      updated_at: hasChanged
        ? new Date().toISOString()
        : existingIdea.updated_at,
      version: hasChanged ? existingIdea.version + 1 : existingIdea.version,
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
      .sort((ideaA, ideaB) => ideaB.updated_at.localeCompare(ideaA.updated_at));
  }

  async reorderIdeas(orderedIdeas: Idea[]): Promise<void> {
    if (orderedIdeas.length === 0) return;

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = orderedIdeas.some(
      (idea, index) => idea.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = new Date().toISOString();
    const updatedIdeas = orderedIdeas.map((idea, index) => {
      const orderChanged = idea.sort_order !== index;
      return {
        ...idea,
        sort_order: index,
        updated_at: orderChanged ? now : idea.updated_at,
        version: orderChanged ? idea.version + 1 : idea.version,
        needsSync: orderChanged,
      };
    });
    await this.ideaRepository.bulkUpsert(updatedIdeas);
  }
}
