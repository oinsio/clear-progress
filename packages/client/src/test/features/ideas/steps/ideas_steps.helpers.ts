import { db } from "@/db/database";
import { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { IdeaService } from "@/services/IdeaService";
import { buildIdea } from "@/test/factories/ideaFactory";
import { getIdOrThrow } from "@/test/helpers/getIdOrThrow";
import type { Idea } from "@/types/entities";

export function createScenarioContext() {
  const ideaIds = new Map<string, string>();
  let ideaService: IdeaService;

  const reset = async () => {
    await db.ideas.clear();
    ideaIds.clear();
    ideaService = new IdeaService(new IdeaRepository());
  };

  return {
    ideaIds,
    get ideaService() {
      return ideaService;
    },
    reset,
  };
}

export async function seedIdea(
  ideaIds: Map<string, string>,
  name: string,
  overrides: Partial<Idea> = {},
) {
  const ideaId = crypto.randomUUID();
  ideaIds.set(name, ideaId);
  await db.ideas.add(buildIdea({ id: ideaId, ...overrides }));
  return ideaId;
}

export async function getIdea(
  ideaIds: Map<string, string>,
  name: string,
): Promise<Idea> {
  return (await db.ideas.get(getIdOrThrow(ideaIds, name))) as Idea;
}

export async function seedIdeasWithOrder(
  ideaIds: Map<string, string>,
  names: string[],
) {
  for (let i = 0; i < names.length; i++) {
    await seedIdea(ideaIds, names[i], {
      sort_order: i,
      needsSync: false,
    });
  }
}
