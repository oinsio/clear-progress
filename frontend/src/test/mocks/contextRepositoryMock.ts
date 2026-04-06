import type {ContextRepository} from "@/db/repositories/ContextRepository";
import {createRepositoryMock} from "./createRepositoryMock";

export function createMockContextRepository(
    overrides: Partial<Record<keyof ContextRepository, unknown>> = {},
): ContextRepository {
    return createRepositoryMock<ContextRepository>(overrides);
}
