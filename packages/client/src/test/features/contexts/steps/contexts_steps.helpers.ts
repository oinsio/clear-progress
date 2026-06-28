import { db } from "@/db/database";
import { ContextRepository } from "@/db/repositories/ContextRepository";
import { ContextService } from "@/services/ContextService";
import { buildContext } from "@/test/factories/contextFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Context } from "@/types/entities";

export function createScenarioContext() {
  const contextIds = new Map<string, string>();
  let contextService: ContextService;

  const reset = async () => {
    await db.contexts.clear();
    contextIds.clear();
    contextService = new ContextService(new ContextRepository());
  };

  return {
    contextIds,
    get contextService() {
      return contextService;
    },
    reset,
  };
}

export async function seedContext(
  contextIds: Map<string, string>,
  name: string,
  overrides: Partial<Context> = {},
) {
  const contextId = crypto.randomUUID();
  contextIds.set(name, contextId);
  await db.contexts.add(buildContext({ id: contextId, ...overrides }));
  return contextId;
}

export async function getContext(
  contextIds: Map<string, string>,
  name: string,
): Promise<Context> {
  return (await db.contexts.get(getIdOrThrow(contextIds, name))) as Context;
}

export async function seedContextsWithOrder(
  contextIds: Map<string, string>,
  names: string[],
) {
  const { rebalanceKeys } = await import("@/services/SortOrderService");
  const keys = rebalanceKeys(names.length);
  for (let i = 0; i < names.length; i++) {
    await seedContext(contextIds, names[i], {
      sort_order: keys[i],
      syncStatus: "synced" as const,
    });
  }
}

export async function moveContextBefore(
  contextIds: Map<string, string>,
  contextService: ContextService,
  movedName: string,
  beforeName: string,
) {
  const { generateKeyBetween } = await import("@/services/SortOrderService");
  const targetContext = await getContext(contextIds, beforeName);
  const movedContext = await getContext(contextIds, movedName);
  const newKey = generateKeyBetween(null, String(targetContext.sort_order));
  await contextService.reorderContexts(movedContext.id, newKey);
}
