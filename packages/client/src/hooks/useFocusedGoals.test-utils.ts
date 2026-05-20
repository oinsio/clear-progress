import { waitFor } from "@testing-library/react";
import { beforeEach, vi } from "vitest";
import "fake-indexeddb/auto";
import { SETTINGS_KEYS } from "@clear-progress/contract";
import { db } from "@/db/database";
import { GoalRepository } from "@/db/repositories/GoalRepository";
import { SettingsRepository } from "@/db/repositories/SettingsRepository";
import type { Goal } from "@/types/entities";
import type { useFocusedGoals } from "./useFocusedGoals";

export const mockSchedulePush = vi.fn();

// Test UUIDs
export const UUID_1 = "00000000-0000-4000-8000-000000000001";
export const UUID_2 = "00000000-0000-4000-8000-000000000002";
export const UUID_3 = "00000000-0000-4000-8000-000000000003";
export const UUID_A = "00000000-0000-4000-8000-00000000000a";
export const UUID_B = "00000000-0000-4000-8000-00000000000b";
export const UUID_C = "00000000-0000-4000-8000-00000000000c";
export const UUID_INVALID = "00000000-0000-4000-8000-000000000999";

export const createGoal = (
  id: string,
  overrides: Partial<Goal> = {},
): Goal => ({
  id,
  name: `Goal ${id}`,
  description: "",
  cover_file_id: "",
  status: "in_progress",
  sort_order: 0,
  is_deleted: false,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  revision: 1,
  needsSync: false,
  ...overrides,
});

// Helper: setup focused goals in settings
export async function setupFocusedGoals(
  goalRepo: GoalRepository,
  settingsRepo: SettingsRepository,
  goal1Id?: string,
  goal2Id?: string,
): Promise<void> {
  if (goal1Id) {
    await goalRepo.create(createGoal(goal1Id));
    await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_1, goal1Id);
  }
  if (goal2Id) {
    await goalRepo.create(createGoal(goal2Id));
    await settingsRepo.set(SETTINGS_KEYS.FOCUSED_GOAL_2, goal2Id);
  }
}

// Helper: wait for focused goals to match expected IDs
export async function waitForFocusedGoals(
  result: { current: ReturnType<typeof useFocusedGoals> },
  expectedIds: string[],
): Promise<void> {
  await waitFor(
    () => {
      expect(result.current.focusedGoalIds).toEqual(expectedIds);
    },
    { timeout: 3000 },
  );
}

// Helper: verify settings values
export async function expectSettingsValues(
  settingsRepo: SettingsRepository,
  expectedGoal1: string,
  expectedGoal2: string,
): Promise<void> {
  const value1 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_1);
  const value2 = await settingsRepo.getValue(SETTINGS_KEYS.FOCUSED_GOAL_2);
  expect(value1).toBe(expectedGoal1);
  expect(value2).toBe(expectedGoal2);
}

// Shared setup for all useFocusedGoals test files
export function setupFocusedGoalsTests() {
  let settingsRepo: SettingsRepository;
  let goalRepo: GoalRepository;

  beforeEach(async () => {
    await db.delete();
    await db.open();
    settingsRepo = new SettingsRepository();
    goalRepo = new GoalRepository();
    mockSchedulePush.mockClear();
  });

  return {
    get settingsRepo() {
      return settingsRepo;
    },
    get goalRepo() {
      return goalRepo;
    },
  };
}
