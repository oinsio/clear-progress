import { beforeEach, describe, expect, it, vi } from "vitest";
import type { GoalRepository } from "@/db/repositories/GoalRepository";
import { buildGoal } from "@/test/factories/goalFactory";
import { createMockGoalRepository } from "@/test/mocks/goalRepositoryMock";
import { GoalService } from "./GoalService";

describe("GoalService", () => {
  let mockGoalRepository: GoalRepository;

  beforeEach(() => {
    mockGoalRepository = createMockGoalRepository();
  });

  describe("searchByName", () => {
    it("should return empty array when no goals match", async () => {
      const goals = [buildGoal({ name: "Learn piano" })];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("nonexistent");
      expect(results).toEqual([]);
    });

    it("should return matching goals case-insensitively", async () => {
      const goals = [
        buildGoal({ name: "Learn piano" }),
        buildGoal({ name: "Read books" }),
        buildGoal({ name: "Learn Spanish" }),
      ];
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue(goals),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("learn");
      expect(results).toHaveLength(2);
    });

    it("should match partial name", async () => {
      const goal = buildGoal({ name: "My important goal" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("import");
      expect(results).toEqual([goal]);
    });

    it("should return goals whose description contains the query", async () => {
      const matchingGoal = buildGoal({
        name: "Career growth",
        description: "Learn advanced programming techniques",
      });
      const nonMatchingGoal = buildGoal({
        name: "Fitness",
        description: "Run marathon",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([matchingGoal, nonMatchingGoal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("programming");
      expect(results).toEqual([matchingGoal]);
    });

    it("should return goals matching in either name or description", async () => {
      const matchInName = buildGoal({
        name: "Programming mastery",
        description: "Become expert developer",
      });
      const matchInDescription = buildGoal({
        name: "Career development",
        description: "Focus on programming skills",
      });
      const noMatch = buildGoal({ name: "Fitness", description: "Exercise" });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi
          .fn()
          .mockResolvedValue([matchInName, matchInDescription, noMatch]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("programming");
      expect(results).toHaveLength(2);
      expect(results).toContain(matchInName);
      expect(results).toContain(matchInDescription);
    });

    it("should match case-insensitively in description", async () => {
      const goal = buildGoal({
        name: "Career",
        description: "Learn Programming",
      });
      mockGoalRepository = createMockGoalRepository({
        getActive: vi.fn().mockResolvedValue([goal]),
      });
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("programming");
      expect(results).toHaveLength(1);
    });

    it("should call getActive on repository", async () => {
      const goalService = new GoalService(mockGoalRepository);
      await goalService.searchByName("query");
      expect(mockGoalRepository.getActive).toHaveBeenCalled();
    });

    it("should return empty array when repository returns no goals", async () => {
      const goalService = new GoalService(mockGoalRepository);
      const results = await goalService.searchByName("anything");
      expect(results).toEqual([]);
    });
  });
});
