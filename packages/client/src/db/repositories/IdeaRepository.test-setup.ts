import { beforeEach } from "vitest";
import { db } from "../database";
import { IdeaRepository } from "./IdeaRepository";

export function createIdeaRepositorySetup(): {
  getRepository: () => IdeaRepository;
} {
  let ideaRepository: IdeaRepository;

  beforeEach(async () => {
    await db.ideas.clear();
    ideaRepository = new IdeaRepository();
  });

  return {
    getRepository: () => ideaRepository,
  };
}
