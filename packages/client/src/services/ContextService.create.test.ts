import { beforeEach, describe, expect, it } from "vitest";
import type { ContextRepository } from "@/db/repositories/ContextRepository";
import { createMockContextRepository } from "@/test/mocks/contextRepositoryMock";
import { ContextService } from "./ContextService";

describe("ContextService", () => {
  let mockContextRepository: ContextRepository;

  beforeEach(() => {
    mockContextRepository = createMockContextRepository();
  });

  describe("create", () => {
    let createdContext: Awaited<ReturnType<ContextService["create"]>>;

    beforeEach(async () => {
      const contextService = new ContextService(mockContextRepository);
      createdContext = await contextService.create("@Home");
    });

    it("should create context with given name", () => {
      expect(createdContext.name).toBe("@Home");
    });

    it("should create context with is_deleted false", () => {
      expect(createdContext.is_deleted).toBe(false);
    });

    it("should create context with a UUID id", () => {
      expect(createdContext.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create context with string sort_order", () => {
      expect(typeof createdContext.sort_order).toBe("string");
    });

    it("should create context with syncStatus true", () => {
      expect(createdContext.syncStatus).toBe("pending");
    });

    it("should create context with revision 0", () => {
      expect(createdContext.revision).toBe(0);
    });

    it("should call repository.create with the constructed context", () => {
      expect(mockContextRepository.create).toHaveBeenCalledWith(createdContext);
    });
  });
});
