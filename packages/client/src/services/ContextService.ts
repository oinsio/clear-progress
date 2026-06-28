import type { ContextRepository } from "@/db/repositories/ContextRepository";
import {
  compareSortKeys,
  generateAppendKey,
  needsRebalancing,
  rebalanceKeys,
} from "@/services/SortOrderService";
import type { Context } from "@/types/entities";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { hasEntityChanged } from "@/utils/deepEqual";

export class ContextService {
  constructor(private readonly contextRepository: ContextRepository) {}

  async getAll(): Promise<Context[]> {
    const contexts = await this.contextRepository.getActive();
    return contexts.sort((contextA, contextB) =>
      compareSortKeys(String(contextA.sort_order), String(contextB.sort_order)),
    );
  }

  async getById(id: string): Promise<Context | undefined> {
    return this.contextRepository.getById(id);
  }

  async create(name: string): Promise<Context> {
    const existingContexts = await this.contextRepository.getActive();
    const existingKeys = existingContexts.map((context) =>
      String(context.sort_order),
    );
    const now = toISOTimestamp();
    const context: Context = {
      id: crypto.randomUUID(),
      name,
      sort_order: generateAppendKey(existingKeys),
      is_deleted: false,
      created_at: now,
      updated_at: now,
      revision: 0,
      syncStatus: "pending" as const,
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

  async reorderContexts(
    contextId: string,
    newSortOrder: string,
  ): Promise<void> {
    const context = await this.contextRepository.getById(contextId);
    if (!context) throw new Error(`Context not found: ${contextId}`);

    const now = toISOTimestamp();
    await this.contextRepository.update({
      ...context,
      sort_order: newSortOrder,
      updated_at: now,
      syncStatus: "pending" as const,
    });

    if (needsRebalancing(newSortOrder)) {
      await this.rebalanceAllContexts();
    }
  }

  private async rebalanceAllContexts(): Promise<void> {
    const contexts = await this.contextRepository.getActive();
    const sorted = contexts.sort((contextA, contextB) =>
      compareSortKeys(String(contextA.sort_order), String(contextB.sort_order)),
    );
    const newKeys = rebalanceKeys(sorted.length);
    const now = toISOTimestamp();
    const rebalancedContexts = sorted.map((context, index) => ({
      ...context,
      sort_order: newKeys[index],
      updated_at: now,
      syncStatus: "pending" as const,
    }));
    await this.contextRepository.bulkUpsert(rebalancedContexts);
  }

  private async applyChanges(
    id: string,
    changes: Partial<Context>,
  ): Promise<Context> {
    const existingContext = await this.contextRepository.getById(id);
    if (!existingContext) {
      throw new Error(`Context not found: ${id}`);
    }

    // Build the updated version without modifying metadata
    const candidateContext: Context = {
      ...existingContext,
      ...changes,
      id,
    };

    // Check whether anything actually changed
    const hasChanged = hasEntityChanged(existingContext, candidateContext);

    // Apply metadata only if there are changes
    const updatedContext: Context = {
      ...candidateContext,
      updated_at: hasChanged ? toISOTimestamp() : existingContext.updated_at,
      syncStatus: hasChanged ? ("pending" as const) : ("synced" as const),
    };

    await this.contextRepository.update(updatedContext);
    return updatedContext;
  }
}
