import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { createRepositoryMock } from "./createRepositoryMock";

export function createMockIdeaRepository(
  overrides: Partial<Record<keyof IdeaRepository, unknown>> = {},
): IdeaRepository {
  return createRepositoryMock<IdeaRepository>(overrides);
}
