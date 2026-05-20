import { beforeEach, describe, expect, it, vi } from "vitest";
import type { IdeaRepository } from "@/db/repositories/IdeaRepository";
import { Temporal } from "@/lib/temporal";
import { buildIdea } from "@/test/factories/ideaFactory";
import { createMockIdeaRepository } from "@/test/mocks/ideaRepositoryMock";
import { toISOTimestamp } from "@/utils/dateHelpers";
import { IdeaService } from "./IdeaService";

describe("IdeaService", () => {
  let mockIdeaRepository: IdeaRepository;

  beforeEach(() => {
    mockIdeaRepository = createMockIdeaRepository();
  });

  describe("searchByName", () => {
    it("should return empty array when no ideas match the query", async () => {
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([buildIdea({ name: "Buy milk" })]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toEqual([]);
    });

    it("should return ideas whose name contains the query", async () => {
      const matchingIdea = buildIdea({ name: "Learn piano" });
      const nonMatchingIdea = buildIdea({ name: "Buy groceries" });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([matchingIdea, nonMatchingIdea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toEqual([matchingIdea]);
    });

    it("should return ideas whose description contains the query", async () => {
      const matchingIdea = buildIdea({
        name: "Music project",
        description: "Learn to play piano",
      });
      const nonMatchingIdea = buildIdea({
        name: "Shopping",
        description: "Buy groceries",
      });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([matchingIdea, nonMatchingIdea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toEqual([matchingIdea]);
    });

    it("should return ideas matching in either name or description", async () => {
      const matchInName = buildIdea({
        name: "Piano lessons",
        description: "Weekly practice",
      });
      const matchInDescription = buildIdea({
        name: "Music",
        description: "Learn piano basics",
      });
      const noMatch = buildIdea({
        name: "Cooking",
        description: "Try recipes",
      });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi
          .fn()
          .mockResolvedValue([matchInName, matchInDescription, noMatch]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toHaveLength(2);
      expect(results).toContain(matchInName);
      expect(results).toContain(matchInDescription);
    });

    it("should match case-insensitively", async () => {
      const idea = buildIdea({ name: "Learn Piano" });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([idea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toHaveLength(1);
    });

    it("should match case-insensitively in description", async () => {
      const idea = buildIdea({
        name: "Music",
        description: "Learn Piano basics",
      });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([idea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("piano");
      expect(results).toHaveLength(1);
    });

    it("should match partial query", async () => {
      const idea = buildIdea({ name: "Start a podcast" });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([idea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("pod");
      expect(results).toHaveLength(1);
    });

    it("should return multiple matching ideas", async () => {
      const ideaA = buildIdea({ name: "Travel to Japan" });
      const ideaB = buildIdea({ name: "Travel to Spain" });
      const ideaC = buildIdea({ name: "Learn guitar" });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([ideaA, ideaB, ideaC]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("travel");
      expect(results).toHaveLength(2);
    });

    it("should call repository.getActive", async () => {
      const ideaService = new IdeaService(mockIdeaRepository);
      await ideaService.searchByName("test");
      expect(mockIdeaRepository.getActive).toHaveBeenCalled();
    });

    it("should sort ideas by updated_at descending", async () => {
      const timestamp1 = toISOTimestamp(
        Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
      );
      const timestamp2 = toISOTimestamp(
        Temporal.Instant.from("2025-01-02T10:00:00.000Z"),
      );
      const timestamp3 = toISOTimestamp(
        Temporal.Instant.from("2025-01-03T10:00:00.000Z"),
      );
      const ideas = [
        buildIdea({
          name: "Idea A",
          updated_at: timestamp1,
        }),
        buildIdea({
          name: "Idea B",
          updated_at: timestamp3,
        }),
        buildIdea({
          name: "Idea C",
          updated_at: timestamp2,
        }),
      ];
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue(ideas),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("idea");
      expect(results[0].updated_at).toBe(timestamp3);
      expect(results[1].updated_at).toBe(timestamp2);
      expect(results[2].updated_at).toBe(timestamp1);
    });

    it("should place most recently updated idea first", async () => {
      const oldIdea = buildIdea({
        name: "Old idea",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-01T10:00:00.000Z"),
        ),
      });
      const newIdea = buildIdea({
        name: "New idea",
        updated_at: toISOTimestamp(
          Temporal.Instant.from("2025-01-05T10:00:00.000Z"),
        ),
      });
      mockIdeaRepository = createMockIdeaRepository({
        getActive: vi.fn().mockResolvedValue([oldIdea, newIdea]),
      });
      const ideaService = new IdeaService(mockIdeaRepository);
      const results = await ideaService.searchByName("idea");
      expect(results[0].name).toBe("New idea");
      expect(results[1].name).toBe("Old idea");
    });
  });
});
