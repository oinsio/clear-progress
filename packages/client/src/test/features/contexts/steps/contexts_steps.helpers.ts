import { expect } from "vitest";
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

export async function expectNeedsSync(
  contextIds: Map<string, string>,
  name: string,
  expected: boolean,
) {
  const context = await getContext(contextIds, name);
  expect(context.needsSync).toBe(expected);
}

export async function expectSortOrder(
  contextIds: Map<string, string>,
  name: string,
  expected: number,
) {
  const context = await getContext(contextIds, name);
  expect(context.sort_order).toBe(expected);
}

export async function seedContextsWithOrder(
  contextIds: Map<string, string>,
  names: string[],
) {
  for (let i = 0; i < names.length; i++) {
    await seedContext(contextIds, names[i], {
      sort_order: i,
      needsSync: false,
    });
  }
}
