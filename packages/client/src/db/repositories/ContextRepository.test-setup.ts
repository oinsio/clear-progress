import { beforeEach } from "vitest";
import { db } from "../database";
import { ContextRepository } from "./ContextRepository";

export function createContextRepositorySetup(): {
  getRepository: () => ContextRepository;
} {
  let contextRepository: ContextRepository;

  beforeEach(async () => {
    await db.contexts.clear();
    contextRepository = new ContextRepository();
  });

  return {
    getRepository: () => contextRepository,
  };
}
