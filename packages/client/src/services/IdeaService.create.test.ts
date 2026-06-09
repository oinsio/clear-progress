import { beforeEach, describe, expect, it } from "vitest";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { createMockIdeaRepository } from "@/test/mocks/ideaRepositoryMock";
import { IdeaService } from "./IdeaService";

describe("IdeaService", () => {
  let mockIdeaRepository: IdeaRepository;

  beforeEach(() => {
    mockIdeaRepository = createMockIdeaRepository();
  });

  describe("create", () => {
    let createdIdea: Awaited<ReturnType<IdeaService["create"]>>;

    beforeEach(async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      createdIdea = await ideaService.create({ name: "My idea" });
    });

    it("should create idea with given name", () => {
      expect(createdIdea.name).toBe("My idea");
    });

    it("should create idea with is_deleted false", () => {
      expect(createdIdea.is_deleted).toBe(false);
    });

    it("should create idea with a UUID id", () => {
      expect(createdIdea.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it("should create idea with empty string description by default", () => {
      expect(createdIdea.description).toBe("");
    });

    it("should create idea with string sort_order by default", () => {
      expect(typeof createdIdea.sort_order).toBe("string");
    });

    it("should create idea with needsSync true", () => {
      expect(createdIdea.needsSync).toBe(true);
    });

    it("should create idea with revision 0", () => {
      expect(createdIdea.revision).toBe(0);
    });

    it("should call repository.create with the constructed idea", () => {
      expect(mockIdeaRepository.create).toHaveBeenCalledWith(createdIdea);
    });

    it("should preserve provided description", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const idea = await ideaService.create({
        name: "Test",
        description: "Custom description",
      });
      expect(idea.description).toBe("Custom description");
    });

    it("should preserve provided sort_order", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      const idea = await ideaService.create({ name: "Test", sort_order: "a5" });
      expect(idea.sort_order).toBe("a5");
    });
  });
});
