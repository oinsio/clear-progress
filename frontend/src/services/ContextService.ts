import type { Context } from "@/types/entities";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { hasEntityChanged } from "@/utils/deepEqual";

export class ContextService {
  constructor(private readonly contextRepository: ContextRepository) {}

  async getAll(): Promise<Context[]> {
    const contexts = await this.contextRepository.getActive();
    return contexts.sort(
      (contextA, contextB) => contextA.sort_order - contextB.sort_order,
    );
  }

  async getById(id: string): Promise<Context | undefined> {
    return this.contextRepository.getById(id);
  }

  async create(name: string): Promise<Context> {
    const existingContexts = await this.contextRepository.getActive();
    const now = new Date().toISOString();
    const context: Context = {
      id: crypto.randomUUID(),
      name,
      sort_order: existingContexts.length,
      is_deleted: false,
      created_at: now,
      updated_at: now,
      version: 1,
      revision: 0,
      needsSync: true,
    };
    await this.contextRepository.create(context);
    return context;
  }

  async update(id: string, name: string): Promise<Context> {
    return this.applyChanges(id, { name });
  }

  async softDelete(id: string): Promise<Context> {
    return this.applyChanges(id, { is_deleted: true });
  }

  async restore(id: string): Promise<Context> {
    return this.applyChanges(id, { is_deleted: false });
  }

  async reorderContexts(orderedContexts: Context[]): Promise<void> {
    if (orderedContexts.length === 0) return;

    // Проверяем, изменился ли хотя бы один sort_order
    const hasAnyOrderChanged = orderedContexts.some(
      (context, index) => context.sort_order !== index,
    );
    if (!hasAnyOrderChanged) {
      return; // Ничего не изменилось, не синхронизируем
    }

    const now = new Date().toISOString();
    const updated = orderedContexts.map((context, index) => {
      const orderChanged = context.sort_order !== index;
      return {
        ...context,
        sort_order: index,
        updated_at: orderChanged ? now : context.updated_at,
        version: orderChanged ? context.version + 1 : context.version,
        needsSync: orderChanged,
      };
    });
    await this.contextRepository.bulkUpsert(updated);
  }

  private async applyChanges(
    id: string,
    changes: Partial<Context>,
  ): Promise<Context> {
    const existingContext = await this.contextRepository.getById(id);
    if (!existingContext) {
      throw new Error(`Context not found: ${id}`);
    }

    // Создаем обновленную версию без изменения метаданных
    const candidateContext: Context = {
      ...existingContext,
      ...changes,
      id,
    };

    // Проверяем, действительно ли что-то изменилось
    const hasChanged = hasEntityChanged(existingContext, candidateContext);

    // Применяем метаданные только если есть изменения
    const updatedContext: Context = {
      ...candidateContext,
      updated_at: hasChanged
        ? new Date().toISOString()
        : existingContext.updated_at,
      version: hasChanged
        ? existingContext.version + 1
        : existingContext.version,
      needsSync: hasChanged,
    };

    await this.contextRepository.update(updatedContext);
    return updatedContext;
  }
}
